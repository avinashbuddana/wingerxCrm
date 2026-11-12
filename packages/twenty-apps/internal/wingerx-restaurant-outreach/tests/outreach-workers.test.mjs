import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { newProspects, restaurantFromPlace } from '../scripts/refresh-restaurant-prospects.mjs';
import { draftWithCodex, parseDraft, processReplyDrafts } from '../scripts/run-reply-drafts.mjs';
import { createTwentyClient } from '../scripts/twenty-rest.mjs';

const REQUEST_ID = '497ec0db-8c5d-4844-b85d-19b369657734';
const REQUEST = {
  id: REQUEST_ID, status: 'REQUESTED', name: 'Example Restaurant',
  incomingReply: 'Yes, we would like a demo.', updatedAt: '2026-11-11T12:00:00.000Z',
};

test('writes a reviewable reply draft to Twenty and makes no send request', async () => {
  const calls = [];
  const client = createTwentyClient({
    baseUrl: 'https://crm.example.com',
    apiKey: 'twenty-test-key',
    fetchRequest: async (url, init) => {
      calls.push({ url, init });
      const data = calls.length === 1
        ? { restaurantReplyDrafts: [REQUEST] }
        : { restaurantReplyDraft: REQUEST };
      return Response.json({ data });
    },
  });
  const result = await processReplyDrafts({
    client,
    draft: async (input) => {
      assert.deepEqual(input, { name: REQUEST.name, incomingReply: REQUEST.incomingReply });
      return { intent: 'demo', draft: 'What time works for a 15-minute demo?' };
    },
  });
  assert.deepEqual(result, { ready: 1, failed: 0, skipped: 0 });
  assert.deepEqual(calls.map(({ url, init }) => [init.method, url.pathname]), [
    ['GET', '/rest/restaurantReplyDrafts'],
    ['GET', '/rest/restaurantReplyDrafts/' + REQUEST_ID],
    ['PATCH', '/rest/restaurantReplyDrafts/' + REQUEST_ID],
  ]);
  assert.equal(calls[0].url.searchParams.get('filter'), 'status[eq]:REQUESTED');
  assert.deepEqual(JSON.parse(calls[2].init.body), {
    status: 'READY', intent: 'demo', draftText: 'What time works for a 15-minute demo?', errorNote: '',
  });
});

test('leaves a request alone when the operator changes it during drafting', async () => {
  const result = await processReplyDrafts({
    client: {
      listPage: async () => ({ records: [REQUEST] }),
      request: async (method) => {
        assert.equal(method, 'GET');
        return { data: { restaurantReplyDraft: { ...REQUEST, updatedAt: '2026-11-11T12:00:01.000Z' } } };
      },
    },
    draft: async () => ({ intent: 'demo', draft: 'Here is a draft.' }),
  });
  assert.deepEqual(result, { ready: 0, failed: 0, skipped: 1 });
});

test('clears opt-out drafts and rejects invalid model output', () => {
  assert.deepEqual(parseDraft('{"intent":"opt_out","draft":"Ignored"}'), { intent: 'opt_out', draft: '' });
  assert.throws(() => parseDraft('{"intent":"demo","draft":""}'), /Empty reply draft/);
  assert.throws(() => parseDraft('{"intent":"bogus","draft":"Text"}'), /Unexpected draft format/);
});

test('invokes Codex without passing CRM or model API keys', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'test-wingerx-codex-'));
  const previous = { ...process.env };
  try {
    const shim = join(temp, 'codex');
    await writeFile(shim, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
if (process.env.TWENTY_API_KEY || process.env.OPENAI_API_KEY ||
    !args.includes('read-only') || !args.includes('--ephemeral') ||
    input.reply !== 'Can I book a demo?') process.exit(1);
fs.writeFileSync(args[args.indexOf('--output-last-message') + 1],
  JSON.stringify({ intent: 'demo', draft: 'When are you available?' }));
`, { mode: 0o700 });
    process.env.WINGERX_CODEX_BIN = shim;
    process.env.TWENTY_API_KEY = 'test-crm-key';
    process.env.OPENAI_API_KEY = 'test-model-key';
    assert.deepEqual(await draftWithCodex({ name: 'Example', incomingReply: 'Can I book a demo?' }),
      { intent: 'demo', draft: 'When are you available?' });
  } finally {
    for (const key of ['WINGERX_CODEX_BIN', 'TWENTY_API_KEY', 'OPENAI_API_KEY']) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
    await rm(temp, { recursive: true, force: true });
  }
});

test('rejects closed or unrelated places and skips existing source IDs, phones, and emails', () => {
  const feature = {
    id: 'restaurant-1',
    properties: {
      names: { primary: 'Example Cafe' }, confidence: 0.86, basic_category: 'cafe',
      addresses: [{ country: 'IN', freeform: 'Example Road' }],
      phones: ['+91 98567 12345'], emails: ['CAFE@EXAMPLE.COM'],
    },
  };
  const restaurant = restaurantFromPlace(feature, 'Ranchi', 'Jharkhand');
  assert.equal(restaurant.businessPhone, '+91 9856712345');
  assert.equal(restaurant.businessEmail, 'cafe@example.com');
  for (const properties of [{ operating_status: 'permanently_closed' }, { basic_category: 'internet_cafe' }, { phones: [] }]) {
    assert.equal(restaurantFromPlace({ ...feature, properties: { ...feature.properties, ...properties } }, 'Ranchi', 'Jharkhand'), null);
  }
  const candidates = [restaurant, { ...restaurant, sourceId: 'restaurant-2', businessPhone: '+91 9512012345', businessEmail: '' }];
  for (const existing of [
    { sourceId: 'restaurant-1' }, { businessPhone: '09856712345' }, { businessEmail: 'CAFE@EXAMPLE.COM' },
  ]) {
    assert.deepEqual(newProspects(candidates, [existing]).map(({ sourceId }) => sourceId), ['restaurant-2']);
  }
  assert.equal(newProspects([restaurant, restaurant], []).length, 1);
});
