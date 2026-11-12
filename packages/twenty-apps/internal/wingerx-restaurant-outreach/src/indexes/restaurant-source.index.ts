import { defineIndex } from 'twenty-sdk/define';

import {
  RESTAURANT_FIELDS,
  RESTAURANT_PROSPECT_ID,
} from '../objects/restaurant-prospect.object';

export default defineIndex({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaf04',
  objectUniversalIdentifier: RESTAURANT_PROSPECT_ID,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaf05',
      fieldUniversalIdentifier: RESTAURANT_FIELDS.sourceId,
    },
  ],
});
