import assert from 'node:assert/strict';
import test from 'node:test';

import { planEmailBatch } from '../src/plan-email-batch.ts';

const NOW = new Date('2026-11-11T05:00:00Z');
const ready = (index: number) => ({
  id: String(index).padStart(3, '0'),
  stage: 'READY',
  businessEmail: `owner${index}@example.com`,
  emailPermissionAt: '2026-11-10T05:00:00Z',
  nextActionAt: '2026-11-11T04:00:00Z',
});

test('counts initial emails and follow-ups against the same daily cap', () => {
  const prospects = Array.from({ length: 110 }, (_, index) => ready(index));
  prospects[0].stage = 'CONTACTED';

  const { batch, remaining } = planEmailBatch({ prospects, reservedToday: 15, now: NOW });

  assert.equal(remaining, 85);
  assert.equal(batch.length, 85);
  assert.equal(batch[0].kind, 'follow-up');
  assert.equal(batch[84].id, '084');
  assert.deepEqual(planEmailBatch({ prospects, reservedToday: 100, now: NOW }).batch, []);
});

test('skips replies, opt-outs, duplicates, unscheduled and unqualified outlets', () => {
  const prospects = [
    ready(1),
    { ...ready(2), businessEmail: 'OWNER1@example.com' },
    { ...ready(3), latestReplyAt: '2026-11-11T04:15:00Z' },
    { ...ready(4), stage: 'DO_NOT_CONTACT' },
    { ...ready(5), businessEmail: 'owner4@example.com' },
    { ...ready(6), emailPermissionAt: null },
    { ...ready(7), nextActionAt: '2026-11-11T06:00:00Z' },
    { ...ready(8), stage: 'NEW' },
    { ...ready(9), emailSuppressed: true },
    { ...ready(10), nextActionAt: null },
  ];

  const { batch } = planEmailBatch({ prospects, reservedToday: 0, now: NOW });

  assert.deepEqual(batch, [{ id: '001', email: 'owner1@example.com', kind: 'initial' }]);
});
