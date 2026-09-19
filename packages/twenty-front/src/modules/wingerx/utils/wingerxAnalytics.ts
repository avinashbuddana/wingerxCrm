import {
  getWingerXAmount,
  getWingerXOwner,
  getWingerXPriority,
  getWingerXSource,
  getWingerXStage,
  getWingerXUpdatedAt,
  isWingerXLostStage,
  isWingerXWonStage,
  normalizeWingerXKey,
  wingerXDaysSince,
  type WingerXRecord,
} from '@/wingerx/utils/wingerxRecordUtils';

export type WingerXSalesMetrics = {
  total: number;
  won: WingerXRecord[];
  lost: WingerXRecord[];
  open: WingerXRecord[];
  wonValue: number;
  openValue: number;
  allValue: number;
  weightedPipeline: number;
  conversionRate: number;
  averageDealSize: number;
  staleDeals: WingerXRecord[];
  highValueDeals: WingerXRecord[];
  stageCounts: Array<[string, number]>;
  sourceCounts: Array<[string, number]>;
  ownerPerformance: Array<{
    owner: string;
    opportunities: number;
    won: number;
    value: number;
    winRate: number;
  }>;
};

const getStageProbability = (stage: string) => {
  const normalized = normalizeWingerXKey(stage);
  if (isWingerXWonStage(stage)) return 1;
  if (isWingerXLostStage(stage)) return 0;
  if (normalized.includes('commit')) return 0.9;
  if (normalized.includes('negotiat')) return 0.8;
  if (normalized.includes('proposal')) return 0.65;
  if (normalized.includes('solution')) return 0.55;
  if (normalized.includes('demo')) return 0.45;
  if (normalized.includes('qualif')) return 0.35;
  if (normalized.includes('discover')) return 0.2;
  return 0.25;
};

export const computeWingerXSalesMetrics = (
  opportunities: WingerXRecord[],
  now = new Date(),
): WingerXSalesMetrics => {
  const won = opportunities.filter((record) =>
    isWingerXWonStage(getWingerXStage(record)),
  );
  const lost = opportunities.filter((record) =>
    isWingerXLostStage(getWingerXStage(record)),
  );
  const open = opportunities.filter((record) => {
    const stage = getWingerXStage(record);
    return !isWingerXWonStage(stage) && !isWingerXLostStage(stage);
  });

  const wonValue = won.reduce(
    (sum, record) => sum + getWingerXAmount(record),
    0,
  );
  const openValue = open.reduce(
    (sum, record) => sum + getWingerXAmount(record),
    0,
  );
  const allValue = opportunities.reduce(
    (sum, record) => sum + getWingerXAmount(record),
    0,
  );
  const weightedPipeline = open.reduce(
    (sum, record) =>
      sum +
      getWingerXAmount(record) * getStageProbability(getWingerXStage(record)),
    0,
  );

  const staleDeals = open
    .filter((record) => {
      const days = wingerXDaysSince(getWingerXUpdatedAt(record), now);
      return days !== null && days >= 14;
    })
    .sort((a, b) => {
      const aDays = wingerXDaysSince(getWingerXUpdatedAt(a), now) ?? 0;
      const bDays = wingerXDaysSince(getWingerXUpdatedAt(b), now) ?? 0;
      return bDays - aDays;
    });

  const averageDealSize = won.length > 0 ? wonValue / won.length : 0;
  const highValueThreshold = averageDealSize > 0 ? averageDealSize * 1.5 : 0;
  const highValueDeals = open
    .filter((record) => getWingerXAmount(record) > highValueThreshold)
    .sort((a, b) => getWingerXAmount(b) - getWingerXAmount(a));

  const stageMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const ownerMap = new Map<
    string,
    { opportunities: number; won: number; value: number }
  >();

  for (const record of opportunities) {
    const stage = getWingerXStage(record);
    stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1);

    const source = getWingerXSource(record);
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);

    const owner = getWingerXOwner(record);
    const current = ownerMap.get(owner) ?? {
      opportunities: 0,
      won: 0,
      value: 0,
    };
    current.opportunities += 1;
    current.value += getWingerXAmount(record);
    if (isWingerXWonStage(stage)) current.won += 1;
    ownerMap.set(owner, current);
  }

  const ownerPerformance = [...ownerMap.entries()]
    .map(([owner, value]) => ({
      owner,
      ...value,
      winRate:
        value.opportunities > 0 ? (value.won / value.opportunities) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    total: opportunities.length,
    won,
    lost,
    open,
    wonValue,
    openValue,
    allValue,
    weightedPipeline,
    conversionRate:
      opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0,
    averageDealSize,
    staleDeals,
    highValueDeals,
    stageCounts: [...stageMap.entries()].sort(([, a], [, b]) => b - a),
    sourceCounts: [...sourceMap.entries()].sort(([, a], [, b]) => b - a),
    ownerPerformance,
  };
};

export type WingerXTechMetrics = {
  total: number;
  critical: WingerXRecord[];
  stale: WingerXRecord[];
  open: WingerXRecord[];
  statusCounts: Array<[string, number]>;
  priorityCounts: Array<[string, number]>;
};

export const computeWingerXTechMetrics = (
  records: WingerXRecord[],
  now = new Date(),
): WingerXTechMetrics => {
  const statusMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();

  const critical = records.filter((record) => {
    const priority = normalizeWingerXKey(getWingerXPriority(record));
    return ['critical', 'p0', 'p1', 'urgent', 'highest', 'blocker'].some(
      (token) => priority.includes(token),
    );
  });

  const open = records.filter((record) => {
    const status = normalizeWingerXKey(getWingerXStage(record));
    return ![
      'done',
      'closed',
      'resolved',
      'complete',
      'completed',
      'cancelled',
    ].some((token) => status.includes(token));
  });

  const stale = open.filter((record) => {
    const days = wingerXDaysSince(getWingerXUpdatedAt(record), now);
    return days !== null && days >= 7;
  });

  for (const record of records) {
    const status = getWingerXStage(record);
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    const priority = getWingerXPriority(record);
    priorityMap.set(priority, (priorityMap.get(priority) ?? 0) + 1);
  }

  return {
    total: records.length,
    critical,
    stale,
    open,
    statusCounts: [...statusMap.entries()].sort(([, a], [, b]) => b - a),
    priorityCounts: [...priorityMap.entries()].sort(([, a], [, b]) => b - a),
  };
};
