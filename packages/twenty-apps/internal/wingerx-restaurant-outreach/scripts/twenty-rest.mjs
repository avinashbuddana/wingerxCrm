const API_TIMEOUT_MS = 15_000;

export const createTwentyClient = ({ baseUrl, apiKey, fetchRequest = fetch }) => {
  if (!baseUrl || !apiKey) {
    throw new Error('Set TWENTY_WORKSPACE_URL and a scoped TWENTY_API_KEY.');
  }
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || !apiKey) {
    throw new Error('Set an HTTPS Twenty workspace URL and a scoped Twenty API key.');
  }

  const request = async (method, path, body) => {
    const response = await fetchRequest(new URL('/rest/' + path, base), {
      method,
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      redirect: 'error',
    });

    if (!response.ok) {
      throw new Error(`Twenty ${method} returned HTTP ${response.status}.`);
    }

    return response.json();
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
