import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { agentChatPrepromptState } from '@/ai/states/agentChatPrepromptState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import {
  type WingerXAutomationCandidate,
  type WingerXAutomationRule,
  useWingerXAutomation,
} from '@/wingerx/hooks/useWingerXAutomation';
import { useWingerXNotifications } from '@/wingerx/hooks/useWingerXNotifications';
import { useWingerXObjectRecords } from '@/wingerx/hooks/useWingerXObjectRecords';
import {
  computeWingerXSalesMetrics,
  computeWingerXTechMetrics,
} from '@/wingerx/utils/wingerxAnalytics';
import {
  getWingerXAmount,
  getWingerXCreatedAt,
  getWingerXOwner,
  getWingerXPriority,
  getWingerXRecordName,
  getWingerXRecordValue,
  getWingerXSource,
  getWingerXStage,
  getWingerXUpdatedAt,
  normalizeWingerXKey,
  wingerXDateValue,
  wingerXDaysSince,
  wingerXFormatCompactNumber,
  wingerXFormatCurrency,
  wingerXNumericValue,
  wingerXTextValue,
} from '@/wingerx/utils/wingerxRecordUtils';

const RECORD_LIMIT = 500;
const STALE_DEAL_DAYS = 14;
const STALE_TECH_DAYS = 7;

type Tab = 'sales' | 'tech' | 'automation' | 'outreach';

type DataResult = ReturnType<typeof useWingerXObjectRecords>;

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow: auto;
  padding: 22px;
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
  gap: 5px;
`;

const StyledTitle = styled.h1`
  font-size: 25px;
  font-weight: 680;
  letter-spacing: -0.025em;
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  max-width: 760px;
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
`;

const StyledButton = styled.button`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 620;
  padding: 9px 12px;

  &:hover {
    background: ${themeCssVariables.background.transparent.medium};
  }
`;

const StyledPrimaryButton = styled(StyledButton)`
  background: ${themeCssVariables.background.invertedPrimary};
  color: ${themeCssVariables.font.color.inverted};

  &:hover {
    background: ${themeCssVariables.background.invertedSecondary};
  }
`;

const StyledTabs = styled.div`
  align-self: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: 4px;
  padding: 4px;
`;

const StyledTab = styled.button`
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 620;
  padding: 8px 13px;

  &[data-active='true'] {
    background: ${themeCssVariables.background.transparent.medium};
  }
`;

const StyledGrid = styled.div`
  display: grid;
  gap: 13px;
  grid-template-columns: repeat(12, minmax(0, 1fr));

  @media (max-width: 1120px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledMetric = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: span 2;
  min-height: 88px;
  padding: 13px;
`;

const StyledMetricLabel = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.025em;
`;

const StyledMetricHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 10px;
  line-height: 1.35;
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: 12px;
  grid-column: span 6;
  min-height: 220px;
  overflow: hidden;
  padding: 15px;

  @media (max-width: 720px) {
    grid-column: span 2;
  }
`;

const StyledWidePanel = styled(StyledPanel)`
  grid-column: span 12;

  @media (max-width: 1120px) {
    grid-column: span 6;
  }

  @media (max-width: 720px) {
    grid-column: span 2;
  }
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
`;

const StyledPanelTitle = styled.h2`
  font-size: 14px;
  font-weight: 660;
  margin: 0;
`;

const StyledBadge = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  font-size: 10px;
  padding: 4px 7px;
  white-space: nowrap;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledListRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(130px, 2fr) minmax(80px, 1fr) minmax(
      70px,
      1fr
    ) minmax(70px, 1fr);
  min-height: 39px;
  padding: 0 3px;

  &:last-child {
    border-bottom: 0;
  }
`;

const StyledListHeader = styled(StyledListRow)`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 9px;
  font-weight: 720;
  min-height: 30px;
  text-transform: uppercase;
`;

const StyledCell = styled.div`
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const StyledBarRow = styled.div`
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 105px minmax(90px, 1fr) 48px;
`;

const StyledBarLabel = styled.div`
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTrack = styled.div`
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.pill};
  height: 8px;
  overflow: hidden;
`;

const StyledFill = styled.div`
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  height: 100%;
  opacity: 0.5;
`;

const StyledBarValue = styled.div`
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: 11px;
  justify-content: center;
  line-height: 1.5;
  min-height: 125px;
  padding: 12px;
  text-align: center;
`;

const StyledChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const StyledChip = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  display: inline-flex;
  font-size: 10px;
  gap: 6px;
  padding: 5px 8px;
`;

const StyledDot = styled.span`
  background: currentColor;
  border-radius: 50%;
  height: 6px;
  opacity: 0.55;
  width: 6px;
`;

const StyledRule = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px;
`;

const StyledRuleTop = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
`;

const StyledRuleTitle = styled.div`
  font-size: 12px;
  font-weight: 650;
`;

const StyledRuleText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 10px;
  line-height: 1.45;
`;

const StyledRuleActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  margin-top: auto;
`;

const StyledRunSummary = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: 620;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledTextArea = styled.textarea`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 110px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;

const StyledFullField = styled(StyledField)`
  grid-column: 1 / -1;
`;

const StyledConsent = styled.label`
  align-items: flex-start;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  line-height: 1.45;
`;

const StyledHistoryRow = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 86px minmax(120px, 1fr) 110px;
  padding: ${themeCssVariables.spacing[2]} 0;

  &:last-child {
    border-bottom: 0;
  }
`;

const Metric = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <StyledMetric>
    <StyledMetricLabel>{label}</StyledMetricLabel>
    <StyledMetricValue>{value}</StyledMetricValue>
    {hint ? <StyledMetricHint>{hint}</StyledMetricHint> : null}
  </StyledMetric>
);

const DistributionBars = ({
  entries,
  emptyText,
}: {
  entries: Array<[string, number]>;
  emptyText: string;
}) => {
  const rows = entries.slice(0, 8);
  const max = Math.max(...rows.map(([, value]) => value), 1);

  if (rows.length === 0) return <StyledEmpty>{emptyText}</StyledEmpty>;

  return (
    <StyledBars>
      {rows.map(([label, value]) => (
        <StyledBarRow key={label}>
          <StyledBarLabel title={label}>{label}</StyledBarLabel>
          <StyledTrack>
            <StyledFill
              style={{ width: `${Math.max((value / max) * 100, 3)}%` }}
            />
          </StyledTrack>
          <StyledBarValue>{value}</StyledBarValue>
        </StyledBarRow>
      ))}
    </StyledBars>
  );
};

const Coverage = ({ items }: { items: Array<[string, DataResult]> }) => (
  <StyledChips>
    {items.map(([label, result]) => (
      <StyledChip key={label}>
        <StyledDot />
        {label}: {result.isDetected ? 'connected' : 'not found'}
      </StyledChip>
    ))}
  </StyledChips>
);

const useWingerXData = () => {
  const leads = useWingerXObjectRecords({
    candidate: { names: ['lead', 'leads'], labels: ['lead', 'leads'] },
    fields: [
      'name',
      'title',
      'status',
      'source',
      'leadSource',
      'owner',
      'assignee',
      'email',
      'emails',
      'phone',
      'phoneNumber',
      'phones',
      'createdAt',
      'updatedAt',
      'lastContactedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const people = useWingerXObjectRecords({
    candidate: { names: ['person', 'people'], labels: ['person', 'people'] },
    fields: [
      'name',
      'jobTitle',
      'email',
      'emails',
      'phone',
      'phoneNumber',
      'phones',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const companies = useWingerXObjectRecords({
    candidate: {
      names: ['company', 'companies'],
      labels: ['company', 'companies'],
    },
    fields: [
      'name',
      'employees',
      'annualRecurringRevenue',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const opportunities = useWingerXObjectRecords({
    candidate: {
      names: ['opportunity', 'opportunities', 'deal', 'deals'],
      labels: ['opportunity', 'opportunities', 'deal', 'deals'],
    },
    fields: [
      'name',
      'title',
      'stage',
      'status',
      'amount',
      'dealValue',
      'value',
      'annualValue',
      'arr',
      'owner',
      'assignee',
      'salesperson',
      'source',
      'leadSource',
      'closeDate',
      'expectedCloseDate',
      'createdAt',
      'updatedAt',
      'lastActivityAt',
      'lastContactedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const tasks = useWingerXObjectRecords({
    candidate: { names: ['task', 'tasks'], labels: ['task', 'tasks'] },
    fields: [
      'title',
      'name',
      'status',
      'dueAt',
      'dueDate',
      'owner',
      'assignee',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const projects = useWingerXObjectRecords({
    candidate: {
      names: ['project', 'projects'],
      labels: ['project', 'projects'],
    },
    fields: [
      'name',
      'title',
      'status',
      'priority',
      'progress',
      'dueDate',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const technicalRequests = useWingerXObjectRecords({
    candidate: {
      names: [
        'technicalRequest',
        'technicalRequests',
        'techRequest',
        'techRequests',
      ],
      labels: [
        'technical request',
        'technical requests',
        'tech request',
        'tech requests',
      ],
    },
    fields: [
      'name',
      'title',
      'status',
      'priority',
      'severity',
      'owner',
      'assignee',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const bugs = useWingerXObjectRecords({
    candidate: { names: ['bug', 'bugs'], labels: ['bug', 'bugs'] },
    fields: [
      'name',
      'title',
      'status',
      'priority',
      'severity',
      'owner',
      'assignee',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const incidents = useWingerXObjectRecords({
    candidate: {
      names: ['incident', 'incidents'],
      labels: ['incident', 'incidents'],
    },
    fields: [
      'name',
      'title',
      'status',
      'priority',
      'severity',
      'owner',
      'assignee',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const deployments = useWingerXObjectRecords({
    candidate: {
      names: ['deployment', 'deployments'],
      labels: ['deployment', 'deployments'],
    },
    fields: [
      'name',
      'title',
      'status',
      'result',
      'environment',
      'createdAt',
      'updatedAt',
    ],
    limit: RECORD_LIMIT,
  });
  const featureRequests = useWingerXObjectRecords({
    candidate: {
      names: ['featureRequest', 'featureRequests'],
      labels: ['feature request', 'feature requests'],
    },
    fields: ['name', 'title', 'status', 'priority', 'createdAt', 'updatedAt'],
    limit: RECORD_LIMIT,
  });

  return {
    leads,
    people,
    companies,
    opportunities,
    tasks,
    projects,
    technicalRequests,
    bugs,
    incidents,
    deployments,
    featureRequests,
  };
};

const SalesView = ({ data }: { data: ReturnType<typeof useWingerXData> }) => {
  const metrics = useMemo(
    () => computeWingerXSalesMetrics(data.opportunities.records),
    [data.opportunities.records],
  );

  const leadRecords = data.leads.isDetected
    ? data.leads.records
    : data.people.records;
  const leadCount = data.leads.isDetected
    ? (data.leads.totalCount ?? data.leads.records.length)
    : (data.people.totalCount ?? data.people.records.length);

  const leadSources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of leadRecords) {
      const source = getWingerXSource(record);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([, a], [, b]) => b - a);
  }, [leadRecords]);

  const staleTasks = useMemo(
    () =>
      data.tasks.records.filter((record) => {
        const status = normalizeWingerXKey(getWingerXStage(record));
        const dueDate = wingerXDateValue(
          getWingerXRecordValue(record, ['dueAt', 'dueDate']),
        );
        return (
          dueDate !== null &&
          dueDate.valueOf() < Date.now() &&
          !['done', 'closed', 'complete', 'completed'].some((token) =>
            status.includes(token),
          )
        );
      }),
    [data.tasks.records],
  );

  const largestOpen = useMemo(
    () =>
      [...metrics.open]
        .sort((a, b) => getWingerXAmount(b) - getWingerXAmount(a))
        .slice(0, 8),
    [metrics.open],
  );

  return (
    <StyledGrid>
      <Metric
        label={data.leads.isDetected ? 'Total leads' : 'People / leads'}
        value={wingerXFormatCompactNumber(leadCount ?? 0)}
        hint={
          data.leads.isDetected
            ? 'Lead object detected'
            : 'Using People as lead pool'
        }
      />
      <Metric
        label="Open opportunities"
        value={wingerXFormatCompactNumber(metrics.open.length)}
        hint={`${metrics.staleDeals.length} stale ≥ ${STALE_DEAL_DAYS} days`}
      />
      <Metric
        label="Open pipeline"
        value={wingerXFormatCurrency(metrics.openValue)}
        hint="Value of open opportunities"
      />
      <Metric
        label="Weighted forecast"
        value={wingerXFormatCurrency(metrics.weightedPipeline)}
        hint="Stage-probability forecast"
      />
      <Metric
        label="Closed won"
        value={wingerXFormatCompactNumber(metrics.won.length)}
        hint={wingerXFormatCurrency(metrics.wonValue)}
      />
      <Metric
        label="Win rate"
        value={`${metrics.conversionRate.toFixed(1)}%`}
        hint={`Avg deal ${wingerXFormatCurrency(metrics.averageDealSize)}`}
      />
      <Metric
        label="Companies"
        value={wingerXFormatCompactNumber(
          data.companies.totalCount ?? data.companies.records.length,
        )}
        hint={
          data.companies.isDetected
            ? 'Accounts connected'
            : 'Company object unavailable'
        }
      />
      <Metric
        label="Overdue tasks"
        value={wingerXFormatCompactNumber(staleTasks.length)}
        hint="Open tasks past due date"
      />
      <Metric
        label="High-value deals"
        value={wingerXFormatCompactNumber(metrics.highValueDeals.length)}
        hint="Above 1.5× average won deal"
      />
      <Metric
        label="Lost deals"
        value={wingerXFormatCompactNumber(metrics.lost.length)}
        hint="Closed-lost / rejected"
      />
      <Metric
        label="Loaded opportunities"
        value={wingerXFormatCompactNumber(metrics.total)}
        hint={`Dashboard analyzes up to ${RECORD_LIMIT}`}
      />
      <Metric
        label="Total opportunity value"
        value={wingerXFormatCurrency(metrics.allValue)}
        hint="Open + won + lost loaded value"
      />

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Pipeline funnel</StyledPanelTitle>
          <StyledBadge>live</StyledBadge>
        </StyledPanelHeader>
        <DistributionBars
          entries={metrics.stageCounts}
          emptyText="No stage data available yet."
        />
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Lead sources</StyledPanelTitle>
          <StyledBadge>{leadRecords.length} analyzed</StyledBadge>
        </StyledPanelHeader>
        <DistributionBars
          entries={leadSources}
          emptyText="No lead source field data available yet."
        />
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Salesperson performance</StyledPanelTitle>
          <StyledBadge>{metrics.ownerPerformance.length} owners</StyledBadge>
        </StyledPanelHeader>
        {metrics.ownerPerformance.length === 0 ? (
          <StyledEmpty>
            Add a readable owner/assignee field to opportunities to populate the
            leaderboard.
          </StyledEmpty>
        ) : (
          <StyledList>
            <StyledListHeader>
              <StyledCell>Owner</StyledCell>
              <StyledCell>Deals</StyledCell>
              <StyledCell>Won</StyledCell>
              <StyledCell>Win rate</StyledCell>
            </StyledListHeader>
            {metrics.ownerPerformance.slice(0, 8).map((row) => (
              <StyledListRow key={row.owner}>
                <StyledCell>{row.owner}</StyledCell>
                <StyledCell>{row.opportunities}</StyledCell>
                <StyledCell>{row.won}</StyledCell>
                <StyledCell>{row.winRate.toFixed(0)}%</StyledCell>
              </StyledListRow>
            ))}
          </StyledList>
        )}
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Pipeline risk</StyledPanelTitle>
          <StyledBadge>{metrics.staleDeals.length} stale</StyledBadge>
        </StyledPanelHeader>
        {metrics.staleDeals.length === 0 ? (
          <StyledEmpty>No stale open opportunities detected.</StyledEmpty>
        ) : (
          <StyledList>
            <StyledListHeader>
              <StyledCell>Opportunity</StyledCell>
              <StyledCell>Owner</StyledCell>
              <StyledCell>Value</StyledCell>
              <StyledCell>Idle</StyledCell>
            </StyledListHeader>
            {metrics.staleDeals.slice(0, 8).map((record) => (
              <StyledListRow key={record.id}>
                <StyledCell>{getWingerXRecordName(record)}</StyledCell>
                <StyledCell>{getWingerXOwner(record)}</StyledCell>
                <StyledCell>
                  {wingerXFormatCurrency(getWingerXAmount(record))}
                </StyledCell>
                <StyledCell>
                  {wingerXDaysSince(getWingerXUpdatedAt(record)) ?? 0}d
                </StyledCell>
              </StyledListRow>
            ))}
          </StyledList>
        )}
      </StyledPanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Largest open opportunities</StyledPanelTitle>
          <StyledBadge>{largestOpen.length} shown</StyledBadge>
        </StyledPanelHeader>
        {largestOpen.length === 0 ? (
          <StyledEmpty>
            No open opportunities with readable value fields yet.
          </StyledEmpty>
        ) : (
          <StyledList>
            <StyledListHeader>
              <StyledCell>Opportunity</StyledCell>
              <StyledCell>Stage</StyledCell>
              <StyledCell>Owner</StyledCell>
              <StyledCell>Value</StyledCell>
            </StyledListHeader>
            {largestOpen.map((record) => (
              <StyledListRow key={record.id}>
                <StyledCell>{getWingerXRecordName(record)}</StyledCell>
                <StyledCell>{getWingerXStage(record)}</StyledCell>
                <StyledCell>{getWingerXOwner(record)}</StyledCell>
                <StyledCell>
                  {wingerXFormatCurrency(getWingerXAmount(record))}
                </StyledCell>
              </StyledListRow>
            ))}
          </StyledList>
        )}
      </StyledWidePanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Sales data coverage</StyledPanelTitle>
          <StyledBadge>schema aware</StyledBadge>
        </StyledPanelHeader>
        <Coverage
          items={[
            ['Leads', data.leads],
            ['People', data.people],
            ['Companies', data.companies],
            ['Opportunities', data.opportunities],
            ['Tasks', data.tasks],
          ]}
        />
      </StyledWidePanel>
    </StyledGrid>
  );
};

const TechView = ({ data }: { data: ReturnType<typeof useWingerXData> }) => {
  const combined = useMemo(
    () => [
      ...data.technicalRequests.records,
      ...data.bugs.records,
      ...data.incidents.records,
      ...data.featureRequests.records,
    ],
    [
      data.bugs.records,
      data.featureRequests.records,
      data.incidents.records,
      data.technicalRequests.records,
    ],
  );
  const metrics = useMemo(
    () => computeWingerXTechMetrics(combined),
    [combined],
  );

  const deploymentSuccess = useMemo(() => {
    if (data.deployments.records.length === 0) return 0;
    const successful = data.deployments.records.filter((record) => {
      const status = normalizeWingerXKey(
        wingerXTextValue(getWingerXRecordValue(record, ['result', 'status'])),
      );
      return ['success', 'successful', 'passed', 'complete', 'completed'].some(
        (token) => status.includes(token),
      );
    }).length;
    return (successful / data.deployments.records.length) * 100;
  }, [data.deployments.records]);

  const avgProjectProgress = useMemo(() => {
    const values = data.projects.records
      .map((record) =>
        wingerXNumericValue(getWingerXRecordValue(record, ['progress'])),
      )
      .filter((value) => value > 0);
    if (values.length === 0) return 0;
    const raw = values.reduce((sum, value) => sum + value, 0) / values.length;
    return raw <= 1 ? raw * 100 : raw;
  }, [data.projects.records]);

  const techQueue = useMemo(
    () =>
      [...metrics.critical, ...metrics.stale]
        .filter(
          (record, index, records) =>
            records.findIndex((item) => item.id === record.id) === index,
        )
        .slice(0, 10),
    [metrics.critical, metrics.stale],
  );

  return (
    <StyledGrid>
      <Metric
        label="Projects"
        value={wingerXFormatCompactNumber(
          data.projects.totalCount ?? data.projects.records.length,
        )}
        hint={`${avgProjectProgress.toFixed(0)}% average progress`}
      />
      <Metric
        label="Technical requests"
        value={wingerXFormatCompactNumber(
          data.technicalRequests.totalCount ??
            data.technicalRequests.records.length,
        )}
        hint={
          data.technicalRequests.isDetected ? 'Connected' : 'Object not found'
        }
      />
      <Metric
        label="Bugs"
        value={wingerXFormatCompactNumber(
          data.bugs.totalCount ?? data.bugs.records.length,
        )}
        hint={data.bugs.isDetected ? 'Connected' : 'Object not found'}
      />
      <Metric
        label="Incidents"
        value={wingerXFormatCompactNumber(
          data.incidents.totalCount ?? data.incidents.records.length,
        )}
        hint={data.incidents.isDetected ? 'Connected' : 'Object not found'}
      />
      <Metric
        label="Critical items"
        value={wingerXFormatCompactNumber(metrics.critical.length)}
        hint="P0/P1/critical/urgent/blocker"
      />
      <Metric
        label="Stale technical work"
        value={wingerXFormatCompactNumber(metrics.stale.length)}
        hint={`Open and unchanged ≥ ${STALE_TECH_DAYS} days`}
      />
      <Metric
        label="Open technical work"
        value={wingerXFormatCompactNumber(metrics.open.length)}
        hint="Not resolved/closed/completed"
      />
      <Metric
        label="Deployments"
        value={wingerXFormatCompactNumber(
          data.deployments.totalCount ?? data.deployments.records.length,
        )}
        hint={`${deploymentSuccess.toFixed(0)}% success in loaded records`}
      />
      <Metric
        label="Feature requests"
        value={wingerXFormatCompactNumber(
          data.featureRequests.totalCount ??
            data.featureRequests.records.length,
        )}
        hint={
          data.featureRequests.isDetected ? 'Connected' : 'Object not found'
        }
      />
      <Metric
        label="Tech objects"
        value={`${
          [
            data.projects,
            data.technicalRequests,
            data.bugs,
            data.incidents,
            data.deployments,
            data.featureRequests,
          ].filter((item) => item.isDetected).length
        }/6`}
        hint="Auto-detected data model coverage"
      />
      <Metric
        label="Loaded work items"
        value={wingerXFormatCompactNumber(metrics.total)}
        hint="Requests + bugs + incidents + features"
      />
      <Metric
        label="Attention queue"
        value={wingerXFormatCompactNumber(techQueue.length)}
        hint="Critical or stale records"
      />

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Status distribution</StyledPanelTitle>
          <StyledBadge>live</StyledBadge>
        </StyledPanelHeader>
        <DistributionBars
          entries={metrics.statusCounts}
          emptyText="No technical status data yet."
        />
      </StyledPanel>

      <StyledPanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Priority distribution</StyledPanelTitle>
          <StyledBadge>{metrics.total} items</StyledBadge>
        </StyledPanelHeader>
        <DistributionBars
          entries={metrics.priorityCounts}
          emptyText="No priority/severity data yet."
        />
      </StyledPanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Engineering attention queue</StyledPanelTitle>
          <StyledBadge>{techQueue.length} shown</StyledBadge>
        </StyledPanelHeader>
        {techQueue.length === 0 ? (
          <StyledEmpty>
            No critical or stale technical work detected.
          </StyledEmpty>
        ) : (
          <StyledList>
            <StyledListHeader>
              <StyledCell>Item</StyledCell>
              <StyledCell>Status</StyledCell>
              <StyledCell>Priority</StyledCell>
              <StyledCell>Idle</StyledCell>
            </StyledListHeader>
            {techQueue.map((record) => (
              <StyledListRow key={record.id}>
                <StyledCell>{getWingerXRecordName(record)}</StyledCell>
                <StyledCell>{getWingerXStage(record)}</StyledCell>
                <StyledCell>{getWingerXPriority(record)}</StyledCell>
                <StyledCell>
                  {wingerXDaysSince(getWingerXUpdatedAt(record)) ?? 0}d
                </StyledCell>
              </StyledListRow>
            ))}
          </StyledList>
        )}
      </StyledWidePanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Technical data coverage</StyledPanelTitle>
          <StyledBadge>schema aware</StyledBadge>
        </StyledPanelHeader>
        <Coverage
          items={[
            ['Projects', data.projects],
            ['Technical requests', data.technicalRequests],
            ['Bugs', data.bugs],
            ['Incidents', data.incidents],
            ['Deployments', data.deployments],
            ['Feature requests', data.featureRequests],
          ]}
        />
      </StyledWidePanel>
    </StyledGrid>
  );
};

const getClientEmail = (record: WingerXRecord) => {
  for (const key of ['email', 'workEmail', 'primaryEmail']) {
    const value = record[key];
    if (typeof value === 'string' && value.includes('@')) return value;
  }

  for (const key of ['emails', 'emailAddress']) {
    const value = record[key];
    if (!value || typeof value !== 'object') continue;
    const primaryEmail = (value as Record<string, unknown>).primaryEmail;
    if (typeof primaryEmail === 'string' && primaryEmail.includes('@')) {
      return primaryEmail;
    }
  }

  return '';
};

const getClientPhone = (record: WingerXRecord) => {
  for (const key of ['phone', 'phoneNumber', 'mobilePhone']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  const phones = record.phones;
  if (phones && typeof phones === 'object') {
    const primaryPhoneNumber = (phones as Record<string, unknown>)
      .primaryPhoneNumber;
    if (
      typeof primaryPhoneNumber === 'string' &&
      primaryPhoneNumber.trim().length > 0
    ) {
      return primaryPhoneNumber;
    }
  }

  return '';
};

type DeliveryHistoryItem = {
  id: string;
  channel: 'Email' | 'WhatsApp';
  recipient: string;
  status: string;
  sentAt: Date;
};

const OutreachView = ({
  data,
}: {
  data: ReturnType<typeof useWingerXData>;
}) => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const {
    configuration,
    isLoadingConfiguration,
    isSending,
    sendEmail,
    sendWhatsApp,
  } = useWingerXNotifications();

  const contacts = useMemo(() => {
    const records = [...data.people.records, ...data.leads.records];

    return records.filter(
      (record, index) =>
        records.findIndex((candidate) => candidate.id === record.id) === index,
    );
  }, [data.leads.records, data.people.records]);

  const [selectedContactId, setSelectedContactId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('WingerX follow-up');
  const [message, setMessage] = useState(
    'Thank you for speaking with us. We are following up with the next steps and will be happy to answer any questions.',
  );
  const [templateName, setTemplateName] = useState('client_follow_up');
  const [languageCode, setLanguageCode] = useState('en_US');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [history, setHistory] = useState<DeliveryHistoryItem[]>([]);

  const selectedContact = contacts.find(
    (record) => record.id === selectedContactId,
  );
  const clientName = selectedContact
    ? getWingerXRecordName(selectedContact)
    : 'Client';

  useEffect(() => {
    if (selectedContactId.length === 0 && contacts[0]) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (!selectedContact) return;
    setEmail(getClientEmail(selectedContact));
    setPhone(getClientPhone(selectedContact));
    setConsentConfirmed(false);
  }, [selectedContact]);

  useEffect(() => {
    if (!configuration) return;
    setTemplateName(configuration.whatsapp.defaultTemplate);
    setLanguageCode(configuration.whatsapp.defaultLanguage);
  }, [configuration]);

  const remember = (
    channel: DeliveryHistoryItem['channel'],
    recipient: string,
    status: string,
  ) => {
    setHistory((current) =>
      [
        {
          id: crypto.randomUUID(),
          channel,
          recipient,
          status,
          sentAt: new Date(),
        },
        ...current,
      ].slice(0, 12),
    );
  };

  const handleEmail = async () => {
    try {
      const result = await sendEmail({
        to: email,
        subject,
        message,
        consentConfirmed,
        clientName,
        clientReference: selectedContact?.id,
      });
      remember('Email', email, result.status);
      enqueueSuccessSnackBar({ message: `Email ${result.status}.` });
    } catch (error) {
      enqueueErrorSnackBar({
        message: error instanceof Error ? error.message : 'Email failed.',
      });
    }
  };

  const handleWhatsApp = async () => {
    try {
      const result = await sendWhatsApp({
        to: phone,
        templateName,
        languageCode,
        variables: [clientName, message],
        consentConfirmed,
        clientName,
        clientReference: selectedContact?.id,
      });
      remember('WhatsApp', phone, result.status);
      enqueueSuccessSnackBar({
        message: `WhatsApp message ${result.status} by Meta.`,
      });
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error ? error.message : 'WhatsApp message failed.',
      });
    }
  };

  const handleBoth = async () => {
    await handleEmail();
    await handleWhatsApp();
  };

  const emailConfigured = configuration?.email.configured === true;
  const whatsAppConfigured = configuration?.whatsapp.configured === true;

  return (
    <StyledGrid>
      <StyledWidePanel>
        <StyledPanelHeader>
          <div>
            <StyledPanelTitle>Client outreach</StyledPanelTitle>
            <StyledRuleText>
              Send a queued email and an approved Meta WhatsApp template from
              the CRM. Provider secrets remain on the server.
            </StyledRuleText>
          </div>
          <StyledChips>
            <StyledChip>
              <StyledDot />
              Email:{' '}
              {isLoadingConfiguration
                ? 'checking'
                : emailConfigured
                  ? 'ready'
                  : 'setup required'}
            </StyledChip>
            <StyledChip>
              <StyledDot />
              WhatsApp:{' '}
              {isLoadingConfiguration
                ? 'checking'
                : whatsAppConfigured
                  ? 'ready'
                  : 'setup required'}
            </StyledChip>
          </StyledChips>
        </StyledPanelHeader>

        <StyledFormGrid>
          <StyledFullField>
            Client
            <StyledSelect
              value={selectedContactId}
              onChange={(event) => setSelectedContactId(event.target.value)}
            >
              {contacts.length === 0 ? (
                <option value="">No People or Leads found</option>
              ) : null}
              {contacts.map((record) => (
                <option key={record.id} value={record.id}>
                  {getWingerXRecordName(record)}
                </option>
              ))}
            </StyledSelect>
          </StyledFullField>

          <StyledField>
            Client email
            <StyledInput
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </StyledField>
          <StyledField>
            WhatsApp number (E.164)
            <StyledInput
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </StyledField>
          <StyledField>
            Email subject
            <StyledInput
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </StyledField>
          <StyledField>
            Approved WhatsApp template
            <StyledInput
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
          </StyledField>
          <StyledField>
            Template language
            <StyledInput
              value={languageCode}
              onChange={(event) => setLanguageCode(event.target.value)}
            />
          </StyledField>
          <StyledFullField>
            Client message
            <StyledTextArea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </StyledFullField>
        </StyledFormGrid>

        <StyledRuleText>
          The WhatsApp template is sent with two body variables in this order:
          client name, then client message. Create the approved Meta template
          with matching placeholders.
        </StyledRuleText>
        <StyledConsent>
          <input
            checked={consentConfirmed}
            type="checkbox"
            onChange={(event) => setConsentConfirmed(event.target.checked)}
          />
          I confirm this client consented to receive messages through the
          selected channel(s), and the WhatsApp template is approved for this
          use.
        </StyledConsent>

        <StyledHeaderActions>
          <StyledButton
            disabled={
              isSending ||
              !emailConfigured ||
              !consentConfirmed ||
              email.length === 0
            }
            type="button"
            onClick={handleEmail}
          >
            Send email
          </StyledButton>
          <StyledButton
            disabled={
              isSending ||
              !whatsAppConfigured ||
              !consentConfirmed ||
              phone.length === 0
            }
            type="button"
            onClick={handleWhatsApp}
          >
            Send WhatsApp
          </StyledButton>
          <StyledPrimaryButton
            disabled={
              isSending ||
              !emailConfigured ||
              !whatsAppConfigured ||
              !consentConfirmed ||
              email.length === 0 ||
              phone.length === 0
            }
            type="button"
            onClick={handleBoth}
          >
            {isSending ? 'Sending…' : 'Send both'}
          </StyledPrimaryButton>
        </StyledHeaderActions>
      </StyledWidePanel>

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Recent sends</StyledPanelTitle>
          <StyledBadge>this session</StyledBadge>
        </StyledPanelHeader>
        {history.length === 0 ? (
          <StyledEmpty>
            No messages sent in this browser session. Server logs retain the
            workspace and client reference for operational auditing.
          </StyledEmpty>
        ) : (
          <div>
            {history.map((item) => (
              <StyledHistoryRow key={item.id}>
                <div>{item.channel}</div>
                <div>{item.recipient}</div>
                <div>
                  {item.status} · {item.sentAt.toLocaleTimeString()}
                </div>
              </StyledHistoryRow>
            ))}
          </div>
        )}
      </StyledWidePanel>
    </StyledGrid>
  );
};

const AutomationView = ({
  data,
}: {
  data: ReturnType<typeof useWingerXData>;
}) => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const sales = useMemo(
    () => computeWingerXSalesMetrics(data.opportunities.records),
    [data.opportunities.records],
  );
  const techCandidates = useMemo<WingerXAutomationCandidate[]>(() => {
    const toCandidates = (result: DataResult) =>
      result.records.map((record) => ({
        objectNameSingular:
          result.matchedObjectMetadataItem?.nameSingular ?? '',
        record,
      }));

    return [
      ...toCandidates(data.technicalRequests),
      ...toCandidates(data.bugs),
      ...toCandidates(data.incidents),
      ...toCandidates(data.featureRequests),
    ].filter((candidate) => candidate.objectNameSingular.length > 0);
  }, [data.bugs, data.featureRequests, data.incidents, data.technicalRequests]);
  const techRecords = useMemo(
    () => techCandidates.map((candidate) => candidate.record),
    [techCandidates],
  );
  const tech = useMemo(
    () => computeWingerXTechMetrics(techRecords),
    [techRecords],
  );

  const overdueTasks = useMemo(
    () =>
      data.tasks.records.filter((record) => {
        const due = wingerXDateValue(
          getWingerXRecordValue(record, ['dueAt', 'dueDate']),
        );
        const status = normalizeWingerXKey(getWingerXStage(record));
        return (
          due !== null &&
          due.valueOf() < Date.now() &&
          !['done', 'closed', 'complete', 'completed'].some((token) =>
            status.includes(token),
          )
        );
      }),
    [data.tasks.records],
  );

  const newLeadCandidates = useMemo<WingerXAutomationCandidate[]>(() => {
    const records = data.leads.isDetected
      ? data.leads.records
      : data.people.records;
    const objectNameSingular = data.leads.isDetected
      ? data.leads.matchedObjectMetadataItem?.nameSingular
      : data.people.matchedObjectMetadataItem?.nameSingular;

    if (!objectNameSingular) return [];

    return records
      .filter((record) => {
        const createdAt = getWingerXCreatedAt(record);
        return (
          createdAt !== null && Date.now() - createdAt.valueOf() <= 86_400_000
        );
      })
      .map((record) => ({ objectNameSingular, record }));
  }, [data.leads, data.people]);

  const opportunityObjectName =
    data.opportunities.matchedObjectMetadataItem?.nameSingular ?? '';
  const staleTechIds = new Set(tech.stale.map((record) => record.id));
  const criticalTechIds = new Set(tech.critical.map((record) => record.id));

  const rules: WingerXAutomationRule[] = [
    {
      key: 'stale-deal',
      title: 'Stale opportunity escalation',
      taskPrefix: 'Follow up on stale opportunity',
      description: `This opportunity has had no update for ${STALE_DEAL_DAYS}+ days. Review the deal, contact the customer, and record the next step.`,
      candidates: sales.staleDeals.map((record) => ({
        objectNameSingular: opportunityObjectName,
        record,
      })),
      dueInHours: 24,
    },
    {
      key: 'high-value',
      title: 'High-value deal watch',
      taskPrefix: 'Review high-value opportunity',
      description:
        'This open opportunity is above 1.5× the average won deal size. Confirm the close plan, risks, owner, and next customer action.',
      candidates: sales.highValueDeals.map((record) => ({
        objectNameSingular: opportunityObjectName,
        record,
      })),
      dueInHours: 12,
    },
    {
      key: 'critical-tech',
      title: 'Critical technical escalation',
      taskPrefix: 'Resolve critical technical item',
      description:
        'This P0/P1/critical/urgent/blocker item requires immediate triage, ownership, and a documented resolution plan.',
      candidates: techCandidates.filter((candidate) =>
        criticalTechIds.has(candidate.record.id),
      ),
      dueInHours: 4,
    },
    {
      key: 'stale-tech',
      title: 'Stale engineering work',
      taskPrefix: 'Update stale technical item',
      description: `This unresolved technical item has not been updated for ${STALE_TECH_DAYS}+ days. Confirm status, owner, blocker, and next action.`,
      candidates: techCandidates.filter((candidate) =>
        staleTechIds.has(candidate.record.id),
      ),
      dueInHours: 24,
    },
    {
      key: 'new-lead',
      title: 'New lead intake',
      taskPrefix: 'Contact new lead',
      description:
        'This lead was created in the last 24 hours. Qualify it and record the first response and next step.',
      candidates: newLeadCandidates,
      dueInHours: 4,
    },
  ].map((rule) => ({
    ...rule,
    candidates: rule.candidates.filter(
      (candidate) => candidate.objectNameSingular.length > 0,
    ),
  }));

  const { isRunning, lastRunAt, runRule, runRules } = useWingerXAutomation({
    taskRecords: data.tasks.records,
  });

  const showRunResult = ({
    created,
    skipped,
    failed,
  }: {
    created: number;
    skipped: number;
    failed: number;
  }) => {
    if (failed > 0) {
      enqueueErrorSnackBar({
        message: `Automation finished: ${created} task(s) created, ${skipped} already existed, ${failed} failed.`,
      });
      return;
    }

    enqueueSuccessSnackBar({
      message: `Automation finished: ${created} task(s) created, ${skipped} already existed.`,
    });
  };

  return (
    <StyledGrid>
      <StyledWidePanel>
        <StyledPanelHeader>
          <div>
            <StyledPanelTitle>Automation control center</StyledPanelTitle>
            <StyledRuleText>
              Creates real, assigned Twenty tasks and links them to the source
              CRM record. Re-running is safe: existing WingerX tasks are
              skipped.
            </StyledRuleText>
          </div>
          <StyledPrimaryButton
            disabled={isRunning}
            type="button"
            onClick={async () => showRunResult(await runRules(rules))}
          >
            {isRunning ? 'Running…' : 'Run all automations'}
          </StyledPrimaryButton>
        </StyledPanelHeader>
        <StyledChips>
          <StyledChip>
            <StyledDot />
            {rules.reduce((sum, rule) => sum + rule.candidates.length, 0)}{' '}
            actionable records
          </StyledChip>
          <StyledChip>
            <StyledDot />
            {overdueTasks.length} overdue tasks already need attention
          </StyledChip>
          <StyledChip>
            <StyledDot />
            {lastRunAt
              ? `Last run ${lastRunAt.toLocaleTimeString()}`
              : 'Not run in this session'}
          </StyledChip>
        </StyledChips>
      </StyledWidePanel>

      {rules.map((rule) => (
        <StyledPanel key={rule.title}>
          <StyledRule>
            <StyledRuleTop>
              <StyledRuleTitle>{rule.title}</StyledRuleTitle>
              <StyledBadge>{rule.candidates.length} active</StyledBadge>
            </StyledRuleTop>
            <StyledRuleText>{rule.description}</StyledRuleText>
          </StyledRule>
          <StyledRuleActions>
            <StyledRunSummary>
              Creates a linked task due in {rule.dueInHours} hours
            </StyledRunSummary>
            <StyledButton
              disabled={isRunning || rule.candidates.length === 0}
              type="button"
              onClick={async () => showRunResult(await runRule(rule))}
            >
              Run now
            </StyledButton>
          </StyledRuleActions>
        </StyledPanel>
      ))}

      <StyledWidePanel>
        <StyledPanelHeader>
          <StyledPanelTitle>Automation behavior</StyledPanelTitle>
          <StyledBadge>live CRM mutations</StyledBadge>
        </StyledPanelHeader>
        <StyledChips>
          <StyledChip>
            <StyledDot />
            Permission-controlled task creation
          </StyledChip>
          <StyledChip>
            <StyledDot />
            Source-record linking
          </StyledChip>
          <StyledChip>
            <StyledDot />
            Owner assignment with current-user fallback
          </StyledChip>
          <StyledChip>
            <StyledDot />
            Duplicate-safe execution
          </StyledChip>
          <StyledChip>
            <StyledDot />
            Due-date SLA by rule
          </StyledChip>
          <StyledChip>
            <StyledDot />
            Immediate success/error feedback
          </StyledChip>
        </StyledChips>
        <StyledRuleText>
          Automations use the signed-in user's Twenty permissions. They create
          tasks directly in the CRM, assign the detected record owner when
          available, fall back to the current user, and link each task to its
          originating opportunity, lead, bug, incident, request, or feature.
        </StyledRuleText>
      </StyledWidePanel>
    </StyledGrid>
  );
};

export const WingerXCommandCenterV2Page = () => {
  const [tab, setTab] = useState<Tab>('sales');
  const data = useWingerXData();
  const navigate = useNavigate();
  const setAgentChatPreprompt = useSetAtomState(agentChatPrepromptState);

  const askAi = (prompt: string) => {
    setAgentChatPreprompt({ text: prompt, mode: 'PREFILL' });
    navigate('/chat');
  };

  const executivePrompt = `Act as the WingerX revenue and operations copilot. Analyze the current Twenty workspace CRM data, including opportunities, leads/people, companies, tasks, projects, technical requests, bugs, incidents, deployments and feature requests. Give me: (1) revenue forecast and biggest deals, (2) stale or at-risk opportunities, (3) follow-ups that need attention today, (4) salesperson performance issues, (5) critical technical blockers that could threaten customers or deals, and (6) the five highest-priority actions for the team. Use current workspace records and do not invent missing values.`;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitleBlock>
          <StyledTitle>WingerX Command Center</StyledTitle>
          <StyledSubtitle>
            Live sales, pipeline, team, technical, outreach and automation
            intelligence built directly on Twenty's metadata-aware record layer.
            Custom objects are detected automatically, so the dashboard grows
            with your workspace without hard-coded record IDs.
          </StyledSubtitle>
        </StyledTitleBlock>
        <StyledHeaderActions>
          <StyledButton
            type="button"
            onClick={() =>
              askAi(
                'Analyze my current sales pipeline. Focus on deals likely to close, stale deals, high-value risk, overdue follow-ups, and the next actions for each sales owner.',
              )
            }
          >
            Ask AI: Sales
          </StyledButton>
          <StyledButton
            type="button"
            onClick={() =>
              askAi(
                'Analyze current technical operations in this workspace. Focus on critical bugs/incidents, stale work, risky projects, deployment health, customer-impacting blockers, and next actions.',
              )
            }
          >
            Ask AI: Tech
          </StyledButton>
          <StyledPrimaryButton
            type="button"
            onClick={() => askAi(executivePrompt)}
          >
            Executive AI Brief
          </StyledPrimaryButton>
        </StyledHeaderActions>
      </StyledHeader>

      <StyledTabs aria-label="WingerX dashboard section">
        <StyledTab
          data-active={tab === 'sales'}
          type="button"
          onClick={() => setTab('sales')}
        >
          Sales
        </StyledTab>
        <StyledTab
          data-active={tab === 'tech'}
          type="button"
          onClick={() => setTab('tech')}
        >
          Tech
        </StyledTab>
        <StyledTab
          data-active={tab === 'outreach'}
          type="button"
          onClick={() => setTab('outreach')}
        >
          Outreach
        </StyledTab>
        <StyledTab
          data-active={tab === 'automation'}
          type="button"
          onClick={() => setTab('automation')}
        >
          Automation
        </StyledTab>
      </StyledTabs>

      {tab === 'sales' ? <SalesView data={data} /> : null}
      {tab === 'tech' ? <TechView data={data} /> : null}
      {tab === 'outreach' ? <OutreachView data={data} /> : null}
      {tab === 'automation' ? <AutomationView data={data} /> : null}
    </StyledPage>
  );
};
