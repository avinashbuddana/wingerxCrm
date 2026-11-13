import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { RESTAURANT_EMAIL_SENDS_VIEW_ID } from '../views/restaurant-email-sends.view';
import { RESTAURANT_OUTREACH_FOLDER_ID } from './restaurant-outreach.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'ba75fd20-8c0c-4d24-8f35-176d5973b150',
  folderUniversalIdentifier: RESTAURANT_OUTREACH_FOLDER_ID,
  viewUniversalIdentifier: RESTAURANT_EMAIL_SENDS_VIEW_ID,
  icon: 'IconMail',
  position: 3,
  type: NavigationMenuItemType.VIEW,
});
