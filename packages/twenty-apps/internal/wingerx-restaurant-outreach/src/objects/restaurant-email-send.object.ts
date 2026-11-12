import { defineObject, FieldType } from 'twenty-sdk/define';

export const RESTAURANT_EMAIL_SEND_ID = 'ba75fd20-8c0c-4d24-8f35-176d5973b100';
export const RESTAURANT_EMAIL_SEND_FIELDS = {
  name: 'ba75fd20-8c0c-4d24-8f35-176d5973b101',
  recipientEmail: 'ba75fd20-8c0c-4d24-8f35-176d5973b102',
  prospectReference: 'ba75fd20-8c0c-4d24-8f35-176d5973b103',
  dispatchKey: 'ba75fd20-8c0c-4d24-8f35-176d5973b104',
  dispatchSlot: 'ba75fd20-8c0c-4d24-8f35-176d5973b105',
  dispatchDay: 'ba75fd20-8c0c-4d24-8f35-176d5973b106',
  sendStatus: 'ba75fd20-8c0c-4d24-8f35-176d5973b107',
  providerMessageId: 'ba75fd20-8c0c-4d24-8f35-176d5973b108',
  sentAt: 'ba75fd20-8c0c-4d24-8f35-176d5973b109',
};

const textFields = [
  ['name', 'Restaurant'],
  ['recipientEmail', 'Recipient email'],
  ['prospectReference', 'Restaurant record ID'],
  ['dispatchKey', 'Send key'],
  ['dispatchSlot', 'Daily slot'],
  ['dispatchDay', 'Outreach date (IST)'],
  ['providerMessageId', 'Message ID'],
] as const;

export default defineObject({
  universalIdentifier: RESTAURANT_EMAIL_SEND_ID,
  nameSingular: 'restaurantEmailSend',
  namePlural: 'restaurantEmailSends',
  labelSingular: 'Restaurant email send',
  labelPlural: 'Restaurant email sends',
  description: 'Daily POS outreach attempts and SMTP acceptance.',
  icon: 'IconMail',
  labelIdentifierFieldMetadataUniversalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS.name,
  fields: [
    ...textFields.map(([name, label]) => ({
      name,
      label,
      type: FieldType.TEXT as const,
      universalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS[name],
    })),
    {
      name: 'sendStatus',
      label: 'Status',
      type: FieldType.SELECT,
      universalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS.sendStatus,
      defaultValue: "'RESERVED'",
      options: [
        { id: 'ba75fd20-8c0c-4d24-8f35-176d5973b121', value: 'RESERVED', label: 'Reserved', position: 0, color: 'blue' },
        { id: 'ba75fd20-8c0c-4d24-8f35-176d5973b122', value: 'SENT', label: 'Sent (SMTP accepted)', position: 1, color: 'green' },
        { id: 'ba75fd20-8c0c-4d24-8f35-176d5973b123', value: 'REVIEW', label: 'Needs review', position: 2, color: 'orange' },
        { id: 'ba75fd20-8c0c-4d24-8f35-176d5973b124', value: 'SKIPPED', label: 'Skipped before sending', position: 3, color: 'gray' },
      ],
    },
    {
      name: 'sentAt',
      label: 'Sent at',
      type: FieldType.DATE_TIME,
      universalIdentifier: RESTAURANT_EMAIL_SEND_FIELDS.sentAt,
      isNullable: true,
      defaultValue: null,
    },
  ],
});
