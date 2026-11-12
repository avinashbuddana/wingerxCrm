import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

export const RESTAURANT_OUTREACH_FOLDER_ID = '82dfb03a-bf10-4607-985c-39e9c80eaa02';

export default defineNavigationMenuItem({
  universalIdentifier: RESTAURANT_OUTREACH_FOLDER_ID,
  name: 'Restaurant Outreach',
  icon: 'IconBuildingStore',
  position: 0,
  type: NavigationMenuItemType.FOLDER,
});
