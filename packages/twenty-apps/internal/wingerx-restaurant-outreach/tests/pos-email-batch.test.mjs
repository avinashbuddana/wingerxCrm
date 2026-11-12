import assert from 'node:assert/strict';
import test from 'node:test';

import { runPosEmailBatch } from '../scripts/run-pos-email-batch.mjs';

const now = () => new Date('2026-11-12T20:00:00Z');
const ready = (id, overrides = {}) => ({
  id: String(id),
  name: `Restaurant ${id}`,
  businessEmail: `restaurant${id}@example.com`,
  stage: 'READY',
  emailPermissionAt: '2026-11-01T00:00:00Z',
  nextActionAt: '2026-11-12T00:00:00Z',
  ...overrides,
});

const mockTwenty = (prospects, latest = (record) => record) => {
  const sends = [];
  const client = {
    async listPage(object, query) {
      const rows = object === 'restaurantProspects' ? prospects : sends;
      const start = Number(query.starting_after ?? 0);
      return {
        records: rows.slice(start, start + 60),
        next: start + 60 < rows.length ? String(start + 60) : null,
      };
    },
    async request(method, path, body) {
      if (method === 'POST') {
        assert.ok(!sends.some((record) => record.dispatchKey === body.dispatchKey));
        assert.ok(!sends.some((record) => record.dispatchSlot === body.dispatchSlot));
        const id = String(sends.length + 1);
        sends.push({ ...body, id });
        return { data: { createRestaurantEmailSend: { id } } };
      }
      const id = path.split('/').at(-1);
      if (method === 'GET') {
        return { data: { restaurantProspect: latest(prospects.find((record) => record.id === id)) } };
      }
      Object.assign(sends.find((record) => record.id === id), body);
      return {};
    },
  };
  return { client, sends };
};

test('reserves no more than 100 sends per IST day across pages and reruns', async () => {
  const { client, sends } = mockTwenty(Array.from({ length: 103 }, (_, index) => ready(index)));
  const send = async () => {
    assert.equal(sends.at(-1).sendStatus, 'RESERVED');
    return '<accepted@example.com>';
  };
  assert.equal((await runPosEmailBatch({ client, send, now })).eligible, 100);
  assert.equal(sends.length, 0);
  assert.equal((await runPosEmailBatch({ client, send, now, dryRun: false })).sent, 100);
  assert.ok(sends.every((record) => record.dispatchDay === '2026-11-13' && record.sendStatus === 'SENT'));
  assert.equal((await runPosEmailBatch({ client, send, now, dryRun: false })).sent, 0);
  const tomorrow = () => new Date('2026-11-13T20:00:00Z');
  assert.equal((await runPosEmailBatch({ client, now: tomorrow })).eligible, 3);
});

test('skips suppressed, unapproved, replied, and duplicate addresses and rechecks before SMTP', async () => {
  const { client, sends } = mockTwenty([
    ready(1), ready(2, { emailPermissionAt: null }),
    ready(3), ready(4, { stage: 'DO_NOT_CONTACT', businessEmail: 'RESTAURANT3@example.com' }),
    ready(5), ready(6, { businessEmail: 'RESTAURANT5@example.com' }),
    ready(7, { latestReplyAt: '2026-11-01T00:00:00Z' }),
    ready(8, { stage: 'CONTACTED' }),
  ], (record) => record.id === '1' ? { ...record, emailSuppressed: true } : record);
  const recipients = [];
  const send = async ({ email }) => {
    recipients.push(email);
    return '<accepted@example.com>';
  };
  const result = await runPosEmailBatch({ client, send, now, dryRun: false });
  assert.equal(result.skipped, 1);
  assert.equal(result.sent, 1);
  assert.deepEqual(recipients, ['restaurant5@example.com']);
  assert.equal(sends[0].sendStatus, 'SKIPPED');
});

test('retains ambiguous sends for review without trying the same address again', async () => {
  const { client, sends } = mockTwenty([ready(1), ready(2)]);
  const send = async () => { throw new Error('SMTP timed out'); };
  const result = await runPosEmailBatch({ client, send, now, dryRun: false });
  assert.equal(result.needsReview, 1);
  assert.equal(sends[0].sendStatus, 'REVIEW');
  assert.equal((await runPosEmailBatch({ client, now })).eligible, 1);
});

test('limits a pilot to the specified approved address', async () => {
  const { client } = mockTwenty([ready(1), ready(2)]);
  const recipients = [];
  const send = async ({ email }) => {
    recipients.push(email);
    return '<accepted@example.com>';
  };
  await runPosEmailBatch({
    client, send, now, dryRun: false, onlyEmail: 'restaurant2@example.com',
  });
  assert.deepEqual(recipients, ['restaurant2@example.com']);
});
