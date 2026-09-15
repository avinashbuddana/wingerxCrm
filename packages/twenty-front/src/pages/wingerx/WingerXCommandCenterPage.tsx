import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const DASHBOARD_RECORD_LIMIT = 500;

type DashboardTab = 'sales' | 'tech';
type DashboardRecord = ObjectRecord & Record<string, unknown>;

type ObjectCandidate = {
  names: string[];
  labels?: string[];
};

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow: auto;
  padding: 24px;
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
`;

const StyledTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: rgba(128, 128, 128, 0.95);
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  max-width: 780px;
`;

const StyledTabs = styled.div`
  background: rgba(128, 128, 128, 0.09);
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 10px;
  display: flex;
  gap: 4px;
  padding: 4px;
`;

const StyledTabButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: 7px;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;

  &[data-active='true'] {
    background: rgba(128, 128, 128, 0.2);
  }
`;

const StyledGrid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(12, minmax(0, 1fr));

  @media (max-width: 1100px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledMetricCard = styled.div`
  background: rgba(128, 128, 128, 0.055);
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  grid-column: span 2;
  min-height: 94px;
  padding: 14px;
`;

const StyledMetricLabel = styled.div`
  color: rgba(128, 128, 128, 0.95);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const StyledMetricHint = styled.div`
  color: rgba(128, 128, 128, 0.9);
  font-size: 11px;
`;

const StyledPanel = styled.section`
  background: rgba(128, 128, 128, 0.045);
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  grid-column: span 6;
  min-height: 220px;
  padding: 16px;

  @media (max-width: 700px) {
    grid-column: span 2;
  }
`;

const StyledWidePanel = styled(StyledPanel)`
  grid-column: span 12;

  @media (max-width: 1100px) {
    grid-column: span 6;
  }

  @media (max-width: 700px) {
    grid-column: span 2;
  }
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledPanelTitle = styled.h2`
  font-size: 14px;
  font-weight: 650;
  margin: 0;
`;

const StyledBadge = styled.span`
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 999px;
  color: rgba(128, 128, 128, 0.95);
  font-size: 10px;
  padding: 4px 7px;
`;

const StyledBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const StyledBarRow = styled.div`
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: 110px minmax(80px, 1fr) 48px;
`;

const StyledBarLabel = styled.div`
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBarTrack = styled.div`
  background: rgba(128, 128, 128, 0.11);
  border-radius: 999px;
  height: 9px;
  overflow: hidden;
`;

const StyledBarFill = styled.div`
  background: currentColor;
  border-radius: 999px;
  height: 100%;
  opacity: 0.55;
`;

const StyledBarValue = styled.div`
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const StyledTable = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StyledTableRow = styled.div`
  align-items: center;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(160px, 2fr) minmax(90px, 1fr) minmax(90px, 1fr) minmax(90px, 1fr);
  min-height: 40px;
  padding: 0 4px;

  &:last-child {
    border-bottom: 0;
  }
`;

const StyledTableHeader = styled(StyledTableRow)`
  color: rgba(128, 128, 128, 0.95);
  font-size: 10px;
  font-weight: 700;
  min-height: 32px;
  text-transform: uppercase;
`;

const StyledTableCell = styled.div`
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: rgba(128, 128, 128, 0.95);
  display: flex;
  flex: 1;
  font-size: 12px;
  justify-content: center;
  line-height: 1.5;
  min-height: 130px;
  padding: 16px;
  text-align: center;
`;

const StyledObjectCoverage = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledObjectChip = styled.div`
  align-items: center;
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  gap: 6px;
  padding: 6px 9px;
`;

const StyledDot = styled.span`
  background: currentColor;
  border-radius: 50%;
  display: inline-block;
  height: 7px;
  opacity: 0.6;
  width: 7px;
`;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const getRecordValue = (record: DashboardRecord, candidateFields: string[]) => {
  const recordEntries = Object.entries(record);

  for (const candidate of candidateFields) {
    const normalizedCandidate = normalize(candidate);
    const matchingEntry = recordEntries.find(
      ([key]) => normalize(key) === normalizedCandidate,
    );

    if (matchingEntry) {
      return matchingEntry[1];
    }
  }

  return undefined;
};

const numericValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object') {
    const typedValue = value as Record<string, unknown>;
    const amount = typedValue.amount ?? typedValue.value ?? typedValue.amountMicros;

    if (typeof amount === 'number') {
      return 'amountMicros' in typedValue ? amount / 1_000_000 : amount;
    }
  }

  return 0;
};

const textValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    const typedValue = value as Record<string, unknown>;
    const label = typedValue.label ?? typedValue.name ?? typedValue.value;
    return typeof label === 'string' ? label : '';
  }

  return '';
};

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    notation: value >= 100000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 100000 ? 1 : 0,
  }).format(value);

const isWonStage = (stage: string) => {
  const normalizedStage = normalize(stage);
  return ['won', 'closedwon', 'customer', 'signed', 'success'].some((token) =>
    normalizedStage.includes(token),
  );
};

const isLostStage = (stage: string) => {
  const normalizedStage = normalize(stage);
  return ['lost', 'closedlost', 'rejected', 'cancelled', 'canceled'].some((token) =>
    normalizedStage.includes(token),
  );
};

const getStage = (record: DashboardRecord) =>
  textValue(getRecordValue(record, ['stage', 'status', 'salesStage', 'pipelineStage'])) ||
  'Unspecified';

const getRecordName = (record: DashboardRecord) =>
  textValue(getRecordValue(record, ['name', 'title', 'subject'])) || 'Untitled';

const getAmount = (record: DashboardRecord) =>
  numericValue(
    getRecordValue(record, [
      'amount',
      'dealValue',
      'value',
      'annualValue',
      'arr',
      'revenue',
    ]),
  );

const findObject = (
  objectMetadataItems: ReturnType<typeof useObjectMetadataItems>['objectMetadataItems'],
  candidate: ObjectCandidate,
) => {
  const normalizedNames = candidate.names.map(normalize);
  const normalizedLabels = (candidate.labels ?? []).map(normalize);

  return objectMetadataItems.find((item) => {
    const nameCandidates = [item.nameSingular, item.namePlural].map(normalize);
    const labelCandidates = [item.labelSingular, item.labelPlural].map(normalize);

    return (
      nameCandidates.some((value) => normalizedNames.includes(value)) ||
      labelCandidates.some((value) => normalizedLabels.includes(value))
    );
  });
};

const useOptionalObjectRecords = ({
  candidate,
  fallbackObjectName = 'person',
  fields,
}: {
  candidate: ObjectCandidate;
  fallbackObjectName?: string;
  fields: string[];
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const objectMetadataItem = useMemo(
    () => findObject(objectMetadataItems, candidate),
    [candidate, objectMetadataItems],
  );

  const recordGqlFields = useMemo(
    () => Object.fromEntries(['id', ...fields].map((field) => [field, true])),
    [fields],
  );

  const result = useFindManyRecords<DashboardRecord>({
    objectNameSingular: objectMetadataItem?.nameSingular ?? fallbackObjectName,
    recordGqlFields,
    limit: DASHBOARD_RECORD_LIMIT,
    skip: !objectMetadataItem,
    fetchPolicy: 'cache-and-network',
  });

  return {
    ...result,
    matchedObjectMetadataItem: objectMetadataItem,
  };
};

const MetricCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <StyledMetricCard>
    <StyledMetricLabel>{label}</StyledMetricLabel>
    <StyledMetricValue>{value}</StyledMetricValue>
    {hint ? <StyledMetricHint>{hint}</StyledMetricHint> : null}
  </StyledMetricCard>
);

const StageBars = ({ records }: { records: DashboardRecord[] }) => {
  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const record of records) {
      const stage = getStage(record);
      counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [records]);

  const max = Math.max(...stageCounts.map(([, count]) => count), 1);

  if (stageCounts.length === 0) {
    return <StyledEmptyState>No opportunity stage data yet.</StyledEmptyState>;
  }

  return (
    <StyledBars>
      {stageCounts.map(([stage, count]) => (
        <StyledBarRow key={stage}>
          <StyledBarLabel title={stage}>{stage}</StyledBarLabel>
          <StyledBarTrack>
            <StyledBarFill style={{ width: `${Math.max((count / max) * 100, 3)}%` }} />
          </StyledBarTrack>
          <StyledBarValue>{count}</StyledBarValue>
        </StyledBarRow>
      ))}
    </StyledBars>
  );
};

const SalesDashboard = () => {
  const leadResult = useOptionalObjectRecords({
    candidate: { names: ['lead', 'leads'], labels: ['lead', 'leads'] },
    fields: ['name', 'status', 'source', 'owner', 'createdAt', 'updatedAt'],
  });
  const peopleResult = useOptionalObjectRecords({
    candidate: { names: ['person', 'people'], labels: ['person', 'people'] },
    fields: ['name', 'jobTitle', 'createdAt', 'updatedAt'],
  });
  const companyResult = useOptionalObjectRecords({
    candidate: { names: ['company', 'companies'], labels: ['company', 'companies'] },
    fields: ['name', 'employees', 'annualRecurringRevenue', 'createdAt', 'updatedAt'],
  });
  const opportunityResult = useOptionalObjectRecords({
    candidate: {
      names: ['opportunity', 'opportunities', 'deal', 'deals'],
      labels: ['opportunity', 'opportunities', 'deal', 'deals'],
    },
    fields: [
      'name',
      'stage',
      'status',
      'amount',
      'dealValue',
      'value',
      'closeDate',
      'expectedCloseDate',
      'createdAt',
      'updatedAt',
    ],
  });
  const taskResult = useOptionalObjectRecords({
    candidate: { names: ['task', 'tasks'], labels: ['task', 'tasks'] },
    fields: ['title', 'name', 'status', 'dueAt', 'createdAt', 'updatedAt'],
  });

  const opportunities = opportunityResult.records;
  const leadCount = leadResult.matchedObjectMetadataItem
    ? (leadResult.totalCount ?? leadResult.records.length)
    : (peopleResult.totalCount ?? peopleResult.records.length);

  const salesMetrics = useMemo(() => {
    const won = opportunities.filter((record) => isWonStage(getStage(record)));
    const lost = opportunities.filter((record) => isLostStage(getStage(record)));
    const open = opportunities.filter((record) => {
      const stage = getStage(record);
      return !isWonStage(stage) && !isLostStage(stage);
    });
    const wonValue = won.reduce((sum, record) => sum + getAmount(record), 0);
    const openValue = open.reduce((sum, record) => sum + getAmount(record), 0);
    const allValue = opportunities.reduce((sum, record) => sum + getAmount(record), 0);

    return {
      won,
      lost,
      open,
      wonValue,
      openValue,
      allValue,
      conversionRate:
        opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0,
      averageDealSize: won.length > 0 ? wonValue / won.length : 0,
    };
  }, [opportunities]);

  const largestOpenDeals = useMemo(
    () =>
      [...salesMetrics.open]
        .sort((a, b) => getAmount(b) - getAmount(a))
        .slice(0, 8),
    [salesMetrics.open],
  );

  return (
    <StyledGrid>
      <MetricCard
        label={leadResult.matchedObjectMetadataItem ? 'Total leads' : 'People / leads'}
        value={formatCompactNumber(leadCount ?? 0)}
        hint={leadResult.matchedObjectMetadataItem ? 'Lead object detected' : 'Using People until a Lead object exists'}
      />
      <MetricCard
        label="Open opportunities"
        value={formatCompactNumber(salesMetrics.open.length)}
        hint={`Loaded up to ${DASHBOARD_RECORD_LIMIT} records`}
      />
      <MetricCard
        label="Pipeline value"
        value={formatCurrency(salesMetrics.openValue)}
        hint="Open opportunity value"
      />
      <MetricCard
        label="Closed won"
        value={formatCompactNumber(salesMetrics.won.length)}
        hint={formatCurrency(salesMetrics.wonValue)}
      />
      <MetricCard
        label="Conversion rate"
        value={`${salesMetrics.conversionRate.toFixed(1)}%`}
        hint="Won / loaded opportunities"
      />
      <MetricCard
        label="Average deal size"
        value={formatCurrency(salesMetrics.averageDealSize)}
        hint="Average closed-won value"
      />

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Pipeline funnel</StyledPanelTitle>
          <StyledBadge>Live CRM data</StyledBadge>
        </StyledPanelHeader>
        <StageBars records={opportunities} />
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Sales data coverage</StyledPanelTitle>
          <StyledBadge>Schema aware</StyledBadge>
        </StyledPanelHeader>
        <StyledObjectCoverage>
          {[
            ['Leads', leadResult.matchedObjectMetadataItem],
            ['People', peopleResult.matchedObjectMetadataItem],
            ['Companies', companyResult.matchedObjectMetadataItem],
            ['Opportunities', opportunityResult.matchedObjectMetadataItem],
            ['Tasks', taskResult.matchedObjectMetadataItem],
          ].map(([label, metadata]) => (
            <StyledObjectChip key={String(label)}>
              <StyledDot />
              {String(label)}: {metadata ? 'connected' : 'not found'}
            </StyledObjectChip>
          ))}
        </StyledObjectCoverage>
        <StyledEmptyState>
          WingerX automatically detects standard and custom Twenty objects. More KPIs will activate as the corresponding fields and objects are present in your workspace.
        </StyledEmptyState>
      </StyledPanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Largest open opportunities</StyledPanelTitle>
          <StyledBadge>{largestOpenDeals.length} shown</StyledBadge>
        </StyledPanelHeader>
        {largestOpenDeals.length === 0 ? (
          <StyledEmptyState>No open opportunities with value data yet.</StyledEmptyState>
        ) : (
          <StyledTable>
            <StyledTableHeader>
              <StyledTableCell>Opportunity</StyledTableCell>
              <StyledTableCell>Stage</StyledTableCell>
              <StyledTableCell>Value</StyledTableCell>
              <StyledTableCell>Signal</StyledTableCell>
            </StyledTableHeader>
            {largestOpenDeals.map((record) => {
              const amount = getAmount(record);
              return (
                <StyledTableRow key={record.id}>
                  <StyledTableCell>{getRecordName(record)}</StyledTableCell>
                  <StyledTableCell>{getStage(record)}</StyledTableCell>
                  <StyledTableCell>{formatCurrency(amount)}</StyledTableCell>
                  <StyledTableCell>{amount > salesMetrics.averageDealSize && amount > 0 ? 'High value' : 'Normal'}</StyledTableCell>
                </StyledTableRow>
              );
            })}
          </StyledTable>
        )}
      </StyledWidePanel>
    </StyledGrid>
  );
};

const TechDashboard = () => {
  const projects = useOptionalObjectRecords({
    candidate: { names: ['project', 'projects'], labels: ['project', 'projects'] },
    fields: ['name', 'status', 'priority', 'progress', 'dueDate', 'createdAt', 'updatedAt'],
  });
  const technicalRequests = useOptionalObjectRecords({
    candidate: {
      names: ['technicalRequest', 'technicalRequests', 'techRequest', 'techRequests'],
      labels: ['technical request', 'technical requests', 'tech request', 'tech requests'],
    },
    fields: ['name', 'title', 'status', 'priority', 'severity', 'createdAt', 'updatedAt'],
  });
  const bugs = useOptionalObjectRecords({
    candidate: { names: ['bug', 'bugs'], labels: ['bug', 'bugs'] },
    fields: ['name', 'title', 'status', 'priority', 'severity', 'createdAt', 'updatedAt'],
  });
  const incidents = useOptionalObjectRecords({
    candidate: { names: ['incident', 'incidents'], labels: ['incident', 'incidents'] },
    fields: ['name', 'title', 'status', 'priority', 'severity', 'createdAt', 'updatedAt'],
  });
  const deployments = useOptionalObjectRecords({
    candidate: { names: ['deployment', 'deployments'], labels: ['deployment', 'deployments'] },
    fields: ['name', 'status', 'environment', 'result', 'createdAt', 'updatedAt'],
  });
  const featureRequests = useOptionalObjectRecords({
    candidate: {
      names: ['featureRequest', 'featureRequests'],
      labels: ['feature request', 'feature requests'],
    },
    fields: ['name', 'title', 'status', 'priority', 'createdAt', 'updatedAt'],
  });

  const criticalItems = useMemo(() => {
    const combined = [
      ...bugs.records,
      ...incidents.records,
      ...technicalRequests.records,
    ];

    return combined.filter((record) => {
      const priority = textValue(
        getRecordValue(record, ['priority', 'severity', 'urgency']),
      );
      const normalizedPriority = normalize(priority);
      return ['critical', 'p0', 'p1', 'urgent', 'highest'].some((token) =>
        normalizedPriority.includes(token),
      );
    });
  }, [bugs.records, incidents.records, technicalRequests.records]);

  const detectedObjects = [
    ['Projects', projects],
    ['Technical requests', technicalRequests],
    ['Bugs', bugs],
    ['Incidents', incidents],
    ['Deployments', deployments],
    ['Feature requests', featureRequests],
  ] as const;

  const detectedCount = detectedObjects.filter(([, result]) =>
    Boolean(result.matchedObjectMetadataItem),
  ).length;

  return (
    <StyledGrid>
      <MetricCard
        label="Active projects"
        value={formatCompactNumber(projects.totalCount ?? projects.records.length)}
        hint={projects.matchedObjectMetadataItem ? 'Project object detected' : 'Create a Project object to activate'}
      />
      <MetricCard
        label="Technical requests"
        value={formatCompactNumber(technicalRequests.totalCount ?? technicalRequests.records.length)}
        hint={technicalRequests.matchedObjectMetadataItem ? 'Connected' : 'Waiting for technical data model'}
      />
      <MetricCard
        label="Bugs"
        value={formatCompactNumber(bugs.totalCount ?? bugs.records.length)}
        hint={bugs.matchedObjectMetadataItem ? 'Connected' : 'Bug object not found'}
      />
      <MetricCard
        label="Critical items"
        value={formatCompactNumber(criticalItems.length)}
        hint="P0/P1/urgent/critical signals"
      />
      <MetricCard
        label="Incidents"
        value={formatCompactNumber(incidents.totalCount ?? incidents.records.length)}
        hint={incidents.matchedObjectMetadataItem ? 'Connected' : 'Incident object not found'}
      />
      <MetricCard
        label="Deployments"
        value={formatCompactNumber(deployments.totalCount ?? deployments.records.length)}
        hint={deployments.matchedObjectMetadataItem ? 'Connected' : 'Deployment object not found'}
      />

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Technical data coverage</StyledPanelTitle>
          <StyledBadge>{detectedCount}/6 detected</StyledBadge>
        </StyledPanelHeader>
        <StyledObjectCoverage>
          {detectedObjects.map(([label, result]) => (
            <StyledObjectChip key={label}>
              <StyledDot />
              {label}: {result.matchedObjectMetadataItem ? 'connected' : 'not found'}
            </StyledObjectChip>
          ))}
        </StyledObjectCoverage>
        <StyledEmptyState>
          This dashboard is intentionally schema-aware. Once your technical objects are added to Twenty, these cards populate automatically without hard-coding workspace IDs.
        </StyledEmptyState>
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Critical work queue</StyledPanelTitle>
          <StyledBadge>{criticalItems.length} flagged</StyledBadge>
        </StyledPanelHeader>
        {criticalItems.length === 0 ? (
          <StyledEmptyState>No critical technical records detected.</StyledEmptyState>
        ) : (
          <StyledTable>
            <StyledTableHeader>
              <StyledTableCell>Item</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Priority</StyledTableCell>
              <StyledTableCell>Type</StyledTableCell>
            </StyledTableHeader>
            {criticalItems.slice(0, 8).map((record) => (
              <StyledTableRow key={record.id}>
                <StyledTableCell>{getRecordName(record)}</StyledTableCell>
                <StyledTableCell>
                  {textValue(getRecordValue(record, ['status', 'stage'])) || 'Unspecified'}
                </StyledTableCell>
                <StyledTableCell>
                  {textValue(getRecordValue(record, ['priority', 'severity', 'urgency'])) || 'Critical'}
                </StyledTableCell>
                <StyledTableCell>Technical</StyledTableCell>
              </StyledTableRow>
            ))}
          </StyledTable>
        )}
      </StyledPanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>WingerX automation & AI readiness</StyledPanelTitle>
          <StyledBadge>Foundation enabled</StyledBadge>
        </StyledPanelHeader>
        <StyledObjectCoverage>
          <StyledObjectChip><StyledDot />Schema auto-detection</StyledObjectChip>
          <StyledObjectChip><StyledDot />Live Twenty record queries</StyledObjectChip>
          <StyledObjectChip><StyledDot />Sales + Tech command center</StyledObjectChip>
          <StyledObjectChip><StyledDot />AI-ready data layer</StyledObjectChip>
          <StyledObjectChip><StyledDot />Workflow-ready architecture</StyledObjectChip>
        </StyledObjectCoverage>
        <StyledEmptyState>
          Next implementation layers will add lead scoring, stale-deal detection, forecast/risk signals, SLA alerts, assignment rules, manager digests, and AI actions against the exact fields in your workspace.
        </StyledEmptyState>
      </StyledWidePanel>
    </StyledGrid>
  );
};

export const WingerXCommandCenterPage = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales');

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitleBlock>
          <StyledTitle>WingerX Command Center</StyledTitle>
          <StyledSubtitle>
            Automated revenue and technical operations dashboard powered directly by your Twenty workspace data. The page detects available objects and activates metrics without embedding workspace-specific IDs.
          </StyledSubtitle>
        </StyledTitleBlock>
        <StyledTabs aria-label="WingerX dashboard section">
          <StyledTabButton
            data-active={activeTab === 'sales'}
            onClick={() => setActiveTab('sales')}
            type="button"
          >
            Sales
          </StyledTabButton>
          <StyledTabButton
            data-active={activeTab === 'tech'}
            onClick={() => setActiveTab('tech')}
            type="button"
          >
            Tech
          </StyledTabButton>
        </StyledTabs>
      </StyledHeader>

      {activeTab === 'sales' ? <SalesDashboard /> : <TechDashboard />}
    </StyledPage>
  );
};
