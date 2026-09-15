import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type WingerXRecord = ObjectRecord & Record<string, unknown>;

export const normalizeWingerXKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getWingerXRecordValue = (
  record: WingerXRecord,
  candidateFields: string[],
) => {
  const entries = Object.entries(record);

  for (const candidate of candidateFields) {
    const normalizedCandidate = normalizeWingerXKey(candidate);
    const match = entries.find(
      ([key]) => normalizeWingerXKey(key) === normalizedCandidate,
    );
    if (match) return match[1];
  }

  return undefined;
};

export const wingerXTextValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (value && typeof value === 'object') {
    const typed = value as Record<string, unknown>;
    const candidate =
      typed.label ??
      typed.name ??
      typed.value ??
      typed.title ??
      typed.displayName ??
      typed.primaryEmail;

    if (typeof candidate === 'string') return candidate;

    const firstName = typeof typed.firstName === 'string' ? typed.firstName : '';
    const lastName = typeof typed.lastName === 'string' ? typed.lastName : '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
  }

  return '';
};

export const wingerXNumericValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object') {
    const typed = value as Record<string, unknown>;
    const amount =
      typed.amount ?? typed.value ?? typed.amountMicros ?? typed.amountCents;
    if (typeof amount === 'number') {
      if ('amountMicros' in typed) return amount / 1_000_000;
      if ('amountCents' in typed) return amount / 100;
      return amount;
    }
  }

  return 0;
};

export const wingerXDateValue = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
};

export const getWingerXRecordName = (record: WingerXRecord) =>
  wingerXTextValue(
    getWingerXRecordValue(record, [
      'name',
      'title',
      'subject',
      'companyName',
      'fullName',
    ]),
  ) || 'Untitled';

export const getWingerXStage = (record: WingerXRecord) =>
  wingerXTextValue(
    getWingerXRecordValue(record, [
      'stage',
      'status',
      'salesStage',
      'pipelineStage',
      'dealStage',
    ]),
  ) || 'Unspecified';

export const getWingerXAmount = (record: WingerXRecord) =>
  wingerXNumericValue(
    getWingerXRecordValue(record, [
      'amount',
      'dealValue',
      'value',
      'annualValue',
      'arr',
      'mrr',
      'revenue',
      'contractValue',
      'totalValue',
    ]),
  );

export const isWingerXWonStage = (stage: string) => {
  const normalized = normalizeWingerXKey(stage);
  return ['won', 'closedwon', 'customer', 'signed', 'success', 'converted'].some(
    (token) => normalized.includes(token),
  );
};

export const isWingerXLostStage = (stage: string) => {
  const normalized = normalizeWingerXKey(stage);
  return [
    'lost',
    'closedlost',
    'rejected',
    'cancelled',
    'canceled',
    'disqualified',
  ].some((token) => normalized.includes(token));
};

export const getWingerXUpdatedAt = (record: WingerXRecord) =>
  wingerXDateValue(
    getWingerXRecordValue(record, [
      'updatedAt',
      'lastActivityAt',
      'lastContactedAt',
      'lastInteractionAt',
    ]),
  );

export const getWingerXCreatedAt = (record: WingerXRecord) =>
  wingerXDateValue(getWingerXRecordValue(record, ['createdAt', 'createdDate']));

export const wingerXDaysSince = (date: Date | null, now = new Date()) => {
  if (!date) return null;
  return Math.max(0, Math.floor((now.valueOf() - date.valueOf()) / 86_400_000));
};

export const wingerXFormatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 100_000 ? 1 : 0,
  }).format(value);

export const wingerXFormatCompactNumber = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);

export const getWingerXOwner = (record: WingerXRecord) =>
  wingerXTextValue(
    getWingerXRecordValue(record, [
      'owner',
      'assignee',
      'assignedTo',
      'salesperson',
      'accountExecutive',
      'workspaceMember',
    ]),
  ) || 'Unassigned';

export const getWingerXSource = (record: WingerXRecord) =>
  wingerXTextValue(
    getWingerXRecordValue(record, [
      'source',
      'leadSource',
      'acquisitionSource',
      'channel',
      'campaign',
    ]),
  ) || 'Unknown';

export const getWingerXPriority = (record: WingerXRecord) =>
  wingerXTextValue(
    getWingerXRecordValue(record, ['priority', 'severity', 'urgency', 'impact']),
  ) || 'Unspecified';
