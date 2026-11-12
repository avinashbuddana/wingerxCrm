import { defineView, ViewType } from 'twenty-sdk/define';

import { RESTAURANT_EMAIL_SEND_FIELDS, RESTAURANT_EMAIL_SEND_ID } from '../objects/restaurant-email-send.object';

export const RESTAURANT_EMAIL_SENDS_VIEW_ID = 'ba75fd20-8c0c-4d24-8f35-176d5973b140';
const fields = [
  ['name', 230], ['recipientEmail', 250], ['sendStatus', 205],
  ['dispatchDay', 165], ['sentAt', 190], ['providerMessageId', 300],
] as const;

export default defineView({
  universalIdentifier: RESTAURANT_EMAIL_SENDS_VIEW_ID,
  name: 'Email Sends',
  objectUniversalIdentifier: RESTAURANT_EMAIL_SEND_ID,
  type: ViewType.TABLE,
  icon: 'IconMail',
  position: 0,
  fields: fields.map(([field, size], position) => ({
    universalIdentifier: `ba75fd20-8c0c-4d24-8f35-176d5973b14${position + 1}`,
    fieldMetadataUniversalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS[field],
    position,
    size,
    isVisible: true,
  })),
});
