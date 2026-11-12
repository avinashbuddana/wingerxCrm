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
  const result = { dispatchDay, eligible: batch.length, reservedToday: today.length, sent: 0, skipped: 0, needsReview: 0, dryRun };
  if (dryRun || batch.length === 0) return result;
  if (!send) throw new Error('SMTP sender is required in send mode.');

  const availableSlots = Array.from({ length: DAILY_EMAIL_LIMIT }, (_, index) => `${dispatchDay}/${index + 1}`)
    .filter((slot) => !usedSlots.has(slot));
  const names = new Map(prospects.map((prospect) => [prospect.id, prospect.name]));

  for (const [index, item] of batch.entries()) {
    if (IST_DATE.format(now()) !== dispatchDay) break;
    const key = dispatchKey(item.email);
    const reservation = await client.request('POST', SENDS, {
      name: names.get(item.id)?.trim() || 'Restaurant',
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

    await client.request('PATCH', path, {
      sendStatus: 'SENT',
      providerMessageId: messageId,
      sentAt: now().toISOString(),
    });
    result.sent += 1;
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
    if (result.needsReview) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'POS outreach batch failed.');
    process.exitCode = 1;
  }
}
