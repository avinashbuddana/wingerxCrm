import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type WingerXAiHealthSnapshot = {
  model: string | null;
  reachable: boolean | null;
  medianLatencyMs: number | null;
  checkedAt: string | null;
};

type WingerXAiHealthCardProps = {
  snapshot: WingerXAiHealthSnapshot;
  isFixture: boolean;
};

const StyledMetrics = styled.dl`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  margin: 0;
`;

const StyledValue = styled.dd`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 4px 0 0;
  overflow-wrap: anywhere;
`;

export const WingerXAiHealthCard = ({
  snapshot,
  isFixture,
}: WingerXAiHealthCardProps) => (
  <>
    {isFixture && <p><Trans>Local benchmark (synthetic data)</Trans></p>}
    <StyledMetrics>
      <div>
        <dt><Trans>Model</Trans></dt>
        <StyledValue>{snapshot.model ?? <Trans>Unknown</Trans>}</StyledValue>
      </div>
      <div>
        <dt><Trans>Reachability</Trans></dt>
        <StyledValue>
          {snapshot.reachable === null ? <Trans>Unchecked</Trans> :
            snapshot.reachable ? <Trans>Reachable</Trans> : <Trans>Unreachable</Trans>}
        </StyledValue>
      </div>
      <div>
        <dt><Trans>Median latency</Trans></dt>
        <StyledValue>
          {snapshot.medianLatencyMs === null ? <Trans>Unavailable</Trans> :
            <Trans>{snapshot.medianLatencyMs} ms</Trans>}
        </StyledValue>
      </div>
      <div>
        <dt><Trans>Last checked</Trans></dt>
        <StyledValue>
          {snapshot.checkedAt === null ? <Trans>Never</Trans> :
            <time dateTime={snapshot.checkedAt}>{new Date(snapshot.checkedAt).toLocaleString()}</time>}
        </StyledValue>
      </div>
    </StyledMetrics>
  </>
);
