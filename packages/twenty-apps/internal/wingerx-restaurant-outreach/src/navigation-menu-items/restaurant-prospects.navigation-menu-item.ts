import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { RESTAURANT_PROSPECTS_VIEW_ID } from '../views/restaurant-prospects.view';
import { RESTAURANT_OUTREACH_FOLDER_ID } from './restaurant-outreach.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaa01',
  folderUniversalIdentifier: RESTAURANT_OUTREACH_FOLDER_ID,
  viewUniversalIdentifier: RESTAURANT_PROSPECTS_VIEW_ID,
  icon: 'IconList',
  position: 1,
  type: NavigationMenuItemType.VIEW,
});
