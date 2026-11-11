import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { RESTAURANT_REPLY_DRAFTS_VIEW_ID } from '../views/restaurant-reply-drafts.view';
import { RESTAURANT_OUTREACH_FOLDER_ID } from './restaurant-outreach.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eb040',
  folderUniversalIdentifier: RESTAURANT_OUTREACH_FOLDER_ID,
  viewUniversalIdentifier: RESTAURANT_REPLY_DRAFTS_VIEW_ID,
  icon: 'IconMail',
  position: 2,
  type: NavigationMenuItemType.VIEW,
});
