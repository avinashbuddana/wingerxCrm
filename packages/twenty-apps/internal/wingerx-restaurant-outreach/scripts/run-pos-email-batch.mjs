import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildNeurixaPosEmail } from '../../../../twenty-front/src/modules/wingerx/utils/buildNeurixaPosEmail.ts';
import {
  buildNeurixaPosEmailContent,
  escapeWingerXEmailMessage,
} from '../../../../twenty-server/src/modules/wingerx/utils/build-neurixa-pos-email-content.ts';
import { DAILY_EMAIL_LIMIT, planEmailBatch } from '../src/plan-email-batch.ts';
import { workspaceClient } from './twenty-rest.mjs';

const PROSPECTS = 'restaurantProspects';
const SENDS = 'restaurantEmailSends';
const FOLLOW_UP_DELAY_MS = 3 * 24 * 60 * 60 * 1000;
const IST_DATE = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });
const ASSETS = fileURLToPath(new URL(
  '../../../../twenty-server/src/modules/wingerx/assets/',
  import.meta.url,
));

const listAll = async (client, object) => {
  const result = [];
  const seenCursors = new Set();
  let cursor;

  do {
    const page = await client.listPage(object, cursor ? { starting_after: cursor } : {});
    result.push(...page.records);
    cursor = page.next;
    if (cursor && seenCursors.has(cursor)) throw new Error('Twenty returned a repeated pagination cursor.');
    seenCursors.add(cursor);
  } while (cursor);

  return result;
};

const dispatchKey = (email) =>
  createHash('sha256').update('pos-introduction:' + email).digest('hex');

const syncPipeline = async (client, sendRecord, prospect, checkedAt) => {
  const sentAt = Date.parse(sendRecord.sentAt);
  if (!Number.isFinite(sentAt)) throw new Error('The send record has no valid acceptance time.');

  if (
    prospect?.stage === 'READY' &&
    !prospect.latestReplyAt &&
    !prospect.emailSuppressed &&
    Date.parse(prospect.emailPermissionAt ?? '') <= sentAt &&
    prospect.businessEmail?.trim().toLowerCase() === sendRecord.recipientEmail
  ) {
    const updatedAt = Date.parse(prospect.updatedAt);
    if (!Number.isFinite(updatedAt)) throw new Error('The prospect has no valid update time.');

    const sendDateFilter = JSON.stringify(sendRecord.sentAt);
    const conditions = [
      `id[eq]:${prospect.id}`,
      'stage[eq]:READY',
      `updatedAt[gte]:${JSON.stringify(new Date(updatedAt).toISOString())}`,
      `updatedAt[lt]:${JSON.stringify(new Date(updatedAt + 1).toISOString())}`,
      'latestReplyAt[is]:NULL',
      'or(emailSuppressed[eq]:false,emailSuppressed[is]:NULL)',
      `emailPermissionAt[lte]:${sendDateFilter}`,
    ];
    const update = { stage: 'CONTACTED', lastPosEmailSentAt: sendRecord.sentAt };

    if (!prospect.nextActionAt || Date.parse(prospect.nextActionAt) <= sentAt) {
      conditions.push(`or(nextActionAt[is]:NULL,nextActionAt[lte]:${sendDateFilter})`);
      update.nextActionAt = new Date(sentAt + FOLLOW_UP_DELAY_MS).toISOString();
    }

    const query = new URLSearchParams({ filter: `and(${conditions.join(',')})`, depth: '0' });
    const response = await client.request('PATCH', `${PROSPECTS}?${query}`, update);
    if (response.data?.updateRestaurantProspects?.[0]?.id !== prospect.id) {
      return false;
    }
  }

  await client.request('PATCH', `${SENDS}/${sendRecord.id}`, {
    pipelineCheckedAt: checkedAt.toISOString(),
  });
  return true;
};

export const runPosEmailBatch = async ({
  client, send, dryRun = true, onlyEmail, now = () => new Date(),
}) => {
  const started = now();
  const dispatchDay = IST_DATE.format(started);
  const [prospects, sends] = await Promise.all([
    listAll(client, PROSPECTS),
    listAll(client, SENDS),
  ]);
  const today = sends.filter((record) => record.dispatchDay === dispatchDay);
  const keys = new Set(sends.map((record) => record.dispatchKey));
  const usedSlots = new Set(today.map((record) => record.dispatchSlot));
  const { batch } = planEmailBatch({
    prospects: prospects.map((prospect) => {
      const email = prospect.businessEmail?.trim().toLowerCase() ?? '';

      // Keep all rows in the planner so opt-outs on duplicate addresses apply.
      return prospect.stage === 'CONTACTED' || keys.has(dispatchKey(email)) ||
        (onlyEmail && email !== onlyEmail)
        ? { ...prospect, nextActionAt: null }
        : prospect;
    }),
    reservedToday: today.length,
    now: started,
  });
  const result = { dispatchDay, eligible: batch.length, reservedToday: today.length, sent: 0, skipped: 0, needsReview: 0, pipelinePending: 0, dryRun };
  if (dryRun) return result;

  const reconcilePipeline = async (sendRecord, prospect) => {
    try {
      if (await syncPipeline(client, sendRecord, prospect, now())) return;
    } catch {
      // SMTP acceptance is already saved. Retry only the pipeline update.
    }
    result.pipelinePending += 1;
  };

  const prospectsById = new Map(prospects.map((prospect) => [prospect.id, prospect]));
  for (const record of sends) {
    if (record.sendStatus === 'SENT' && !record.pipelineCheckedAt &&
      (!onlyEmail || record.recipientEmail === onlyEmail)) {
      await reconcilePipeline(record, prospectsById.get(record.prospectReference));
    }
  }
  if (batch.length === 0) return result;
  if (!send) throw new Error('SMTP sender is required in send mode.');

  const availableSlots = Array.from({ length: DAILY_EMAIL_LIMIT }, (_, index) => `${dispatchDay}/${index + 1}`)
    .filter((slot) => !usedSlots.has(slot));

  for (const [index, item] of batch.entries()) {
    if (IST_DATE.format(now()) !== dispatchDay) break;
    const key = dispatchKey(item.email);
    const reservation = await client.request('POST', SENDS, {
      name: prospectsById.get(item.id)?.name?.trim() || 'Restaurant',
      recipientEmail: item.email,
      prospectReference: item.id,
      dispatchKey: key,
      dispatchSlot: availableSlots[index],
      dispatchDay,
      sendStatus: 'RESERVED',
    });
    const id = reservation.data?.createRestaurantEmailSend?.id;
    if (!id) throw new Error('Twenty did not confirm the email reservation.');
    const path = `${SENDS}/${id}`;
    const latest = (await client.request('GET', `${PROSPECTS}/${item.id}`)).data?.restaurantProspect;
    const recheckAt = now();
    const eligible = latest?.stage === 'READY' && planEmailBatch({
      prospects: [latest],
      reservedToday: 0,
      now: recheckAt,
    }).batch.some((candidate) => candidate.email === item.email);

    if (!eligible || IST_DATE.format(recheckAt) !== dispatchDay) {
      await client.request('PATCH', path, {
        sendStatus: 'SKIPPED',
        dispatchKey: `skipped:${id}`,
      });
      result.skipped += 1;
      continue;
    }

    let messageId;
    try {
      messageId = await send({ email: item.email, name: latest.name, key });
      if (!messageId) throw new Error('SMTP did not confirm acceptance.');
    } catch {
      // A timeout can occur after SMTP accepted a message. Keep the reservation.
      await client.request('PATCH', path, { sendStatus: 'REVIEW' });
      result.needsReview += 1;
      break;
    }

    const sentAt = now().toISOString();
    await client.request('PATCH', path, {
      sendStatus: 'SENT',
      providerMessageId: messageId,
      sentAt,
    });
    result.sent += 1;
    await reconcilePipeline({ id, recipientEmail: item.email, sentAt }, latest);
  }

  return result;
};

const createSmtpSender = async () => {
  const { default: nodemailer } = await import('nodemailer');
  const { EMAIL_SMTP_HOST, EMAIL_SMTP_USER, EMAIL_SMTP_PASSWORD } = process.env;
  const from = process.env.WINGERX_EMAIL_FROM_ADDRESS?.trim();
  const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
  if (!EMAIL_SMTP_HOST || !EMAIL_SMTP_USER || !EMAIL_SMTP_PASSWORD ||
    !from || !/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(from) ||
    ![465, 587].includes(port)) {
    throw new Error('Configure authenticated SMTP and WINGERX_EMAIL_FROM_ADDRESS before sending.');
  }

  const transport = nodemailer.createTransport({
    host: EMAIL_SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: EMAIL_SMTP_USER, pass: EMAIL_SMTP_PASSWORD },
    connectionTimeout: 15_000,
    socketTimeout: 30_000,
  });
  const fromDomain = from.split('@')[1];
  const unsubscribeUrl = `mailto:${from}?subject=Unsubscribe%20from%20POS%20outreach`;

  return async ({ email, name, key }) => {
    const { subject, message } = buildNeurixaPosEmail(name);
    const content = await buildNeurixaPosEmailContent(message, escapeWingerXEmailMessage(message), {
      assets: ASSETS,
      unsubscribeUrl,
    });
    const info = await transport.sendMail({
      from: { address: from, name: process.env.WINGERX_EMAIL_FROM_NAME || 'Abhi' },
      to: email,
      replyTo: from,
      subject,
      messageId: `<pos-${key}@${fromDomain}>`,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
      ...content,
    });
    return info.accepted.length === 1 ? info.messageId : undefined;
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const onlyArgs = args.filter((arg) => arg.startsWith('--only='));
    if (new Set(args).size !== args.length || onlyArgs.length > 1 ||
      args.some((arg) => arg !== '--send' && !arg.startsWith('--only='))) {
      throw new Error('Usage: yarn email:batch [--send] [--only=internal@example.com]');
    }
    const only = onlyArgs[0];
    const onlyEmail = only?.slice('--only='.length).trim().toLowerCase();
    if (only && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onlyEmail ?? '')) {
      throw new Error('Use --only with one valid internal test email.');
    }
    const dryRun = !args.includes('--send');
    const send = dryRun ? undefined : await createSmtpSender();
    const result = await runPosEmailBatch({ client: workspaceClient(), send, dryRun, onlyEmail });
    console.log(JSON.stringify(result));
    if (result.needsReview || result.pipelinePending) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'POS outreach batch failed.');
    process.exitCode = 1;
  }
}
