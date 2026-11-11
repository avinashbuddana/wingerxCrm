import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { RESTAURANT_PROSPECT_ID } from '../objects/restaurant-prospect.object';

export default defineNavigationMenuItem({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaa01',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: RESTAURANT_PROSPECT_ID,
});
