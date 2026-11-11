import { defineView, ViewType } from 'twenty-sdk/define';

import {
  RESTAURANT_FIELDS,
  RESTAURANT_PROSPECT_ID,
  RESTAURANT_STAGES,
} from '../objects/restaurant-prospect.object';

export const RESTAURANT_PIPELINE_VIEW_ID = '82dfb03a-bf10-4607-985c-39e9c80eac00';

const PIPELINE_FIELDS = [
  ['name', 240], ['market', 150], ['posStatus', 150], ['nextActionAt', 150],
] as const;

export default defineView({
  universalIdentifier: RESTAURANT_PIPELINE_VIEW_ID,
  objectUniversalIdentifier: RESTAURANT_PROSPECT_ID,
  name: 'Sales Pipeline',
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier: RESTAURANT_FIELDS.stage,
  fields: PIPELINE_FIELDS.map(([name, size], position) => ({
    universalIdentifier: `82dfb03a-bf10-4607-985c-39e9c80eac0${position + 1}`,
    fieldMetadataUniversalIdentifier: RESTAURANT_FIELDS[name],
    position,
    size,
    isVisible: true,
  })),
  groups: RESTAURANT_STAGES.map((stage, position) => ({
    universalIdentifier: `82dfb03a-bf10-4607-985c-39e9c80ead1${position + 1}`,
    fieldValue: stage.value,
    position,
    isVisible: true,
  })),
});
