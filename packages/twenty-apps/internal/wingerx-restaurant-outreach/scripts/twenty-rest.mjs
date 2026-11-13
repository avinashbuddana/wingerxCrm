import { setTimeout as sleep } from 'node:timers/promises';

const API_TIMEOUT_MS = 15_000;
const MAX_RETRY_WAIT_MS = 120_000;

export const createTwentyClient = ({ baseUrl, apiKey, fetchRequest = fetch, wait = sleep }) => {
  if (!baseUrl || !apiKey) {
    throw new Error('Set TWENTY_WORKSPACE_URL and a scoped TWENTY_API_KEY.');
  }
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || !apiKey) {
    throw new Error('Set an HTTPS Twenty workspace URL and a scoped Twenty API key.');
  }

  const request = async (method, path, body) => {
    for (let attempt = 0; ; attempt += 1) {
      const response = await fetchRequest(new URL('/rest/' + path, base), {
        method,
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
        redirect: 'error',
      });

      if (response.ok) return response.json();
      if (response.status !== 429) {
        throw new Error(`Twenty ${method} returned HTTP ${response.status}.`);
      }

      const retryAfter = response.headers.get('retry-after')?.trim() ?? '';
      const retryDelay = /^\d+$/.test(retryAfter)
        ? Number(retryAfter) * 1_000
        : Date.parse(retryAfter) - Date.now();
      const delay = Number.isFinite(retryDelay)
        ? Math.max(1_000, retryDelay)
        : 30_000 * (attempt + 1);
      if (method !== 'GET' || attempt >= 2 || delay > MAX_RETRY_WAIT_MS) {
        throw new Error(`Twenty ${method} returned HTTP 429. Retry after ${Math.ceil(delay / 1000)} seconds.`);
      }
      await response.body?.cancel();
      await wait(delay);
    }
  };

  const listPage = async (object, query = {}) => {
    const suffix = new URLSearchParams({ limit: '60', depth: '0', ...query });
    const result = await request('GET', object + '?' + suffix);
    const records = result.data?.[object];

    if (!Array.isArray(records)) {
      throw new Error('Unexpected Twenty list response.');
    }

    const next = result.pageInfo?.hasNextPage ? result.pageInfo.endCursor : null;
    if (result.pageInfo?.hasNextPage && !next) {
      throw new Error('Twenty omitted the next pagination cursor.');
    }
    return { records, next };
  };

  return { listPage, request };
};

export const workspaceClient = () => createTwentyClient({
  baseUrl: process.env.TWENTY_WORKSPACE_URL,
  apiKey: process.env.TWENTY_API_KEY,
});
