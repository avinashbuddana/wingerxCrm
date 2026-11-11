import { defineObject, FieldType } from 'twenty-sdk/define';

export const REPLY_DRAFT_ID = '82dfb03a-bf10-4607-985c-39e9c80eb001';

export const REPLY_DRAFT_FIELDS = {
  name: '82dfb03a-bf10-4607-985c-39e9c80eb011',
  incomingReply: '82dfb03a-bf10-4607-985c-39e9c80eb012',
  status: '82dfb03a-bf10-4607-985c-39e9c80eb013',
  intent: '82dfb03a-bf10-4607-985c-39e9c80eb014',
  draftText: '82dfb03a-bf10-4607-985c-39e9c80eb015',
  errorNote: '82dfb03a-bf10-4607-985c-39e9c80eb016',
};

export default defineObject({
  universalIdentifier: REPLY_DRAFT_ID,
  nameSingular: 'restaurantReplyDraft',
  namePlural: 'restaurantReplyDrafts',
  labelSingular: 'Restaurant reply draft',
  labelPlural: 'Restaurant reply drafts',
  description: 'Request a draft for a restaurant reply and review the result.',
  icon: 'IconMail',
  labelIdentifierFieldMetadataUniversalIdentifier: REPLY_DRAFT_FIELDS.name,
  fields: [
    { name: 'name', label: 'Restaurant', icon: 'IconBuildingStore', type: FieldType.TEXT, universalIdentifier: REPLY_DRAFT_FIELDS.name },
    { name: 'incomingReply', label: 'Incoming reply', icon: 'IconMessage', type: FieldType.TEXT, universalIdentifier: REPLY_DRAFT_FIELDS.incomingReply },
    {
      name: 'status',
      label: 'Status',
      icon: 'IconList',
      type: FieldType.SELECT,
      universalIdentifier: REPLY_DRAFT_FIELDS.status,
      defaultValue: "'REQUESTED'",
      options: [
        { id: '82dfb03a-bf10-4607-985c-39e9c80eb021', value: 'REQUESTED', label: 'Requested', position: 0, color: 'blue' },
        { id: '82dfb03a-bf10-4607-985c-39e9c80eb022', value: 'READY', label: 'Ready to review', position: 1, color: 'green' },
        { id: '82dfb03a-bf10-4607-985c-39e9c80eb023', value: 'FAILED', label: 'Needs attention', position: 2, color: 'orange' },
      ],
    },
    { name: 'intent', label: 'Reply intent', icon: 'IconTag', type: FieldType.TEXT, universalIdentifier: REPLY_DRAFT_FIELDS.intent },
    { name: 'draftText', label: 'Draft reply', icon: 'IconPencil', type: FieldType.TEXT, universalIdentifier: REPLY_DRAFT_FIELDS.draftText },
    { name: 'errorNote', label: 'Processing note', icon: 'IconAlertCircle', type: FieldType.TEXT, universalIdentifier: REPLY_DRAFT_FIELDS.errorNote },
  ],
});
