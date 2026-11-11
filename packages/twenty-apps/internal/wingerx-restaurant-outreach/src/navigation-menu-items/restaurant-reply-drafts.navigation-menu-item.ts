import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import { REPLY_DRAFT_ID } from '../objects/restaurant-reply-draft.object';

export default defineNavigationMenuItem({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eb040',
  position: 1,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: REPLY_DRAFT_ID,
});
