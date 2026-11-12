import { defineView, ViewType } from 'twenty-sdk/define';

import { REPLY_DRAFT_FIELDS, REPLY_DRAFT_ID } from '../objects/restaurant-reply-draft.object';

export const RESTAURANT_REPLY_DRAFTS_VIEW_ID = '82dfb03a-bf10-4607-985c-39e9c80eb030';

const FIELDS = [
  ['name', 220], ['status', 150], ['intent', 130],
  ['draftText', 360], ['errorNote', 260],
] as const;

export default defineView({
  universalIdentifier: RESTAURANT_REPLY_DRAFTS_VIEW_ID,
  name: 'Reply Drafts',
  objectUniversalIdentifier: REPLY_DRAFT_ID,
  type: ViewType.TABLE,
  icon: 'IconMail',
  position: 0,
  fields: FIELDS.map(([name, size], position) => ({
    universalIdentifier: `82dfb03a-bf10-4607-985c-39e9c80eb03${position + 1}`,
    fieldMetadataUniversalIdentifier: REPLY_DRAFT_FIELDS[name],
    position,
    size,
    isVisible: true,
  })),
});
