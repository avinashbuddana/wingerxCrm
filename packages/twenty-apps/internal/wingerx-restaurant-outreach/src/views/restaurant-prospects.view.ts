import { defineView, ViewType } from 'twenty-sdk/define';

import {
  RESTAURANT_FIELDS,
  RESTAURANT_PROSPECT_ID,
} from '../objects/restaurant-prospect.object';

export const RESTAURANT_PROSPECTS_VIEW_ID = '82dfb03a-bf10-4607-985c-39e9c80eab00';

const PROSPECT_FIELDS = [
  ['name', 240],
  ['market', 140],
  ['stage', 170],
  ['posStatus', 155],
  ['businessPhone', 165],
  ['businessEmail', 245],
  ['nextActionAt', 155],
] as const;

export default defineView({
  universalIdentifier: RESTAURANT_PROSPECTS_VIEW_ID,
  objectUniversalIdentifier: RESTAURANT_PROSPECT_ID,
  name: 'All Restaurants',
  type: ViewType.TABLE,
  icon: 'IconList',
  position: 0,
  fields: PROSPECT_FIELDS.map(([name, size], position) => ({
    universalIdentifier: `82dfb03a-bf10-4607-985c-39e9c80eab0${position + 1}`,
    fieldMetadataUniversalIdentifier: RESTAURANT_FIELDS[name],
    position,
    size,
    isVisible: true,
  })),
});
