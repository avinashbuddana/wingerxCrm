import { styled } from '@linaria/react';
import { Link, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledLink = styled(Link)`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  min-height: 28px;
  padding: 0 ${themeCssVariables.spacing[2]};
  text-align: left;
  text-decoration: none;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &[data-active='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledMark = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: 6px;
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  height: 20px;
  justify-content: center;
  width: 20px;
`;

export const WingerXNavigationShortcut = () => {
  const location = useLocation();

  return (
    <StyledLink
      data-active={location.pathname === AppPath.WingerXCommandCenter}
      to={AppPath.WingerXCommandCenter}
    >
      <StyledMark>WX</StyledMark>
      WingerX Command Center
    </StyledLink>
  );
};
