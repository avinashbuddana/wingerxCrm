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
  updatedAt: '2026-11-12T00:00:00.000Z',
  ...overrides,
});

const mockTwenty = (prospects, latest = (record) => record, beforePipelineUpdate = () => {}) => {
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
      if (path.startsWith('restaurantProspects?')) {
        const filter = new URLSearchParams(path.split('?')[1]).get('filter');
        const prospectId = filter.match(/id\[eq\]:([^,]+)/)[1];
        const prospect = prospects.find((record) => record.id === prospectId);
        const acceptedAt = sends.find((record) => record.prospectReference === prospectId).sentAt;
        assert.ok(filter.includes('stage[eq]:READY'));
        assert.ok(filter.includes('latestReplyAt[is]:NULL'));
        assert.ok(filter.includes('emailSuppressed[eq]:false'));
        assert.ok(filter.includes(`updatedAt[gte]:${JSON.stringify(prospect.updatedAt)}`));
        const expectedUpdateTime = prospect.updatedAt;
        beforePipelineUpdate();
        const mayUpdate = prospect.updatedAt === expectedUpdateTime &&
          prospect.stage === 'READY' && !prospect.latestReplyAt &&
          !prospect.emailSuppressed && Date.parse(prospect.emailPermissionAt ?? '') <= Date.parse(acceptedAt) &&
          (!body.nextActionAt || !prospect.nextActionAt || Date.parse(prospect.nextActionAt) <= Date.parse(acceptedAt));
        if (mayUpdate) Object.assign(prospect, body);
        return { data: { updateRestaurantProspects: mayUpdate ? [{ id: prospect.id }] : [] } };
      }
      Object.assign(sends.find((record) => record.id === id), body);
      return {};
    },
  };
  return { client, sends };
};

test('caps a one-off batch at ten across preview and live mode', async () => {
  const { client, sends } = mockTwenty(Array.from({ length: 12 }, (_, index) => ready(index + 1)));
  const options = { client, now, limit: 10 };
  assert.equal((await runPosEmailBatch(options)).eligible, 10);
  assert.equal(sends.length, 0);
  const send = async () => '<accepted@example.com>';
  assert.equal((await runPosEmailBatch({ ...options, send, dryRun: false })).sent, 10);
  assert.equal(sends.length, 10);
  assert.equal((await runPosEmailBatch(options)).eligible, 2);
  await assert.rejects(runPosEmailBatch({ ...options, limit: 101 }), /Batch limit/);
});

test('reserves no more than 100 sends per IST day across pages and reruns', async () => {
  const { client, sends } = mockTwenty(Array.from({ length: 103 }, (_, index) => ready(index)));
  const send = async () => {
    assert.equal(sends.at(-1).sendStatus, 'RESERVED');
    return '<accepted@example.com>';
  };
  assert.equal((await runPosEmailBatch({ client, send, now })).eligible, 100);
  assert.equal(sends.length, 0);
  assert.equal((await runPosEmailBatch({ client, send, now, dryRun: false })).sent, 100);
  assert.ok(sends.every((record) => record.dispatchDay === '2026-11-13' && record.sendStatus === 'SENT' && record.pipelineCheckedAt));
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

test('moves a sent restaurant to Contacted and schedules the next action three days later', async () => {
  const prospect = ready(1);
  const { client } = mockTwenty([prospect]);
  await runPosEmailBatch({ client, send: async () => '<accepted@example.com>', now, dryRun: false });
  assert.equal(prospect.stage, 'CONTACTED');
  assert.equal(prospect.lastPosEmailSentAt, now().toISOString());
  assert.equal(prospect.nextActionAt, '2026-11-15T20:00:00.000Z');
});

test('keeps an intervening reply stage and retries only a pending pipeline check', async () => {
  const prospect = ready(1);
  const { client, sends } = mockTwenty([prospect], undefined, () => {
    prospect.stage = 'REPLIED';
    prospect.latestReplyAt = now().toISOString();
  });
  const send = async () => '<accepted@example.com>';
  const first = await runPosEmailBatch({ client, send, now, dryRun: false });
  assert.equal(first.sent, 1);
  assert.equal(first.pipelinePending, 1);
  assert.equal(prospect.stage, 'REPLIED');
  assert.equal(sends[0].pipelineCheckedAt, undefined);
  const second = await runPosEmailBatch({ client, now, dryRun: false });
  assert.equal(second.sent, 0);
  assert.equal(second.pipelinePending, 0);
  assert.equal(sends[0].sendStatus, 'SENT');
  assert.equal(sends[0].pipelineCheckedAt, now().toISOString());
  assert.equal(prospect.stage, 'REPLIED');
});

test('reconciles an accepted send without replacing a newer follow-up date or resending', async () => {
  const prospect = ready(1);
  const { client, sends } = mockTwenty([prospect], undefined, () => {
    if (prospect.nextActionAt === '2026-11-12T00:00:00Z') {
      prospect.nextActionAt = '2026-11-20T04:30:00Z';
    }
  });
  const first = await runPosEmailBatch({
    client, send: async () => '<accepted@example.com>', now, dryRun: false,
  });
  assert.equal(first.pipelinePending, 1);
  const second = await runPosEmailBatch({ client, now, dryRun: false });
  assert.equal(second.sent, 0);
  assert.equal(second.pipelinePending, 0);
  assert.equal(prospect.stage, 'CONTACTED');
  assert.equal(prospect.nextActionAt, '2026-11-20T04:30:00Z');
  assert.equal(sends.length, 1);
});
