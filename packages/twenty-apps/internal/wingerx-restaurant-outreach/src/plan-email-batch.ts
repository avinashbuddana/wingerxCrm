export const DAILY_EMAIL_LIMIT = 100;

type Prospect = {
  id: string;
  stage: string;
  businessEmail?: string | null;
  emailPermissionAt?: string | null;
  emailSuppressed?: boolean | null;
  latestReplyAt?: string | null;
  nextActionAt?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const planEmailBatch = ({
  prospects,
  reservedToday,
  now,
}: {
  prospects: readonly Prospect[];
  reservedToday: number;
  now: Date;
}) => {
  if (!Number.isInteger(reservedToday) || reservedToday < 0) {
    throw new RangeError('Reserved email count must be a non-negative integer');
  }
  const cutoff = now.getTime();

  if (!Number.isFinite(cutoff)) {
    throw new RangeError('The batch time must be a valid date');
  }

  const remaining = Math.max(0, DAILY_EMAIL_LIMIT - reservedToday);
  const suppressedEmails = new Set(
    prospects
      .filter((prospect) => prospect.emailSuppressed || prospect.stage === 'DO_NOT_CONTACT')
      .map((prospect) => prospect.businessEmail?.trim().toLowerCase()),
  );
  const candidates = prospects.flatMap((prospect) => {
    const email = prospect.businessEmail?.trim().toLowerCase() ?? '';
    const permissionAt = Date.parse(prospect.emailPermissionAt ?? '');
    const dueAt = Date.parse(prospect.nextActionAt ?? '');

    if (
      !['READY', 'CONTACTED'].includes(prospect.stage) ||
      !EMAIL_PATTERN.test(email) ||
      suppressedEmails.has(email) ||
      prospect.latestReplyAt ||
      !Number.isFinite(permissionAt) ||
      permissionAt > cutoff ||
      !Number.isFinite(dueAt) ||
      dueAt > cutoff
    ) {
      return [];
    }

    return [{ id: prospect.id, email, dueAt, kind: prospect.stage === 'READY' ? 'initial' : 'follow-up' }];
  });

  candidates.sort((left, right) => left.dueAt - right.dueAt || left.id.localeCompare(right.id));

  const seen = new Set<string>();
  const batch = [];

  for (const candidate of candidates) {
    if (batch.length === remaining) {
      break;
    }
    if (seen.has(candidate.email)) {
      continue;
    }
    seen.add(candidate.email);
    batch.push({ id: candidate.id, email: candidate.email, kind: candidate.kind });
  }

  return { remaining, batch };
};
