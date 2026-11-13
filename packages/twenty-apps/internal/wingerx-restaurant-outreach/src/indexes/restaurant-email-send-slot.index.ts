import { defineIndex } from 'twenty-sdk/define';

import { RESTAURANT_EMAIL_SEND_FIELDS, RESTAURANT_EMAIL_SEND_ID } from '../objects/restaurant-email-send.object';

export default defineIndex({
  universalIdentifier: 'ba75fd20-8c0c-4d24-8f35-176d5973b133',
  objectUniversalIdentifier: RESTAURANT_EMAIL_SEND_ID,
  isUnique: true,
  fields: [{
    universalIdentifier: 'ba75fd20-8c0c-4d24-8f35-176d5973b134',
    fieldUniversalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS.dispatchSlot,
  }],
});
