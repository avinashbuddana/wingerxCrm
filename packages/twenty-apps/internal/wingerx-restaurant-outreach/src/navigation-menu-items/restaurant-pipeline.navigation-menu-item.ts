import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { RESTAURANT_PIPELINE_VIEW_ID } from '../views/restaurant-pipeline.view';
import { RESTAURANT_OUTREACH_FOLDER_ID } from './restaurant-outreach.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaa03',
  folderUniversalIdentifier: RESTAURANT_OUTREACH_FOLDER_ID,
  viewUniversalIdentifier: RESTAURANT_PIPELINE_VIEW_ID,
  icon: 'IconLayoutKanban',
  position: 0,
  type: NavigationMenuItemType.VIEW,
});
