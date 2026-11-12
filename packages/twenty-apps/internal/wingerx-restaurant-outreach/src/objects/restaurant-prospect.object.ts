import { defineObject, FieldType } from 'twenty-sdk/define';

export const RESTAURANT_PROSPECT_ID = '82dfb03a-bf10-4607-985c-39e9c80eaf03';

export const RESTAURANT_FIELDS = {
  name: '82dfb03a-bf10-4607-985c-39e9c80eaf10',
  sourceId: '82dfb03a-bf10-4607-985c-39e9c80eaf11',
  market: '82dfb03a-bf10-4607-985c-39e9c80eaf12',
  state: '82dfb03a-bf10-4607-985c-39e9c80eaf13',
  category: '82dfb03a-bf10-4607-985c-39e9c80eaf14',
  businessPhone: '82dfb03a-bf10-4607-985c-39e9c80eaf15',
  businessEmail: '82dfb03a-bf10-4607-985c-39e9c80eaf16',
  website: '82dfb03a-bf10-4607-985c-39e9c80eaf17',
  address: '82dfb03a-bf10-4607-985c-39e9c80eaf18',
  stage: '82dfb03a-bf10-4607-985c-39e9c80eaf19',
  emailPermissionAt: '82dfb03a-bf10-4607-985c-39e9c80eaf20',
  whatsappPermissionAt: '82dfb03a-bf10-4607-985c-39e9c80eaf21',
  permissionNotes: '82dfb03a-bf10-4607-985c-39e9c80eaf22',
  nextActionAt: '82dfb03a-bf10-4607-985c-39e9c80eaf23',
  latestReplyAt: '82dfb03a-bf10-4607-985c-39e9c80eaf24',
  emailSuppressed: '82dfb03a-bf10-4607-985c-39e9c80eaf25',
  whatsappSuppressed: '82dfb03a-bf10-4607-985c-39e9c80eaf26',
  posStatus: '82dfb03a-bf10-4607-985c-39e9c80eaf27',
};

export const RESTAURANT_STAGES = [
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae01', value: 'NEW', label: 'New', color: 'gray' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae02', value: 'QUALIFIED', label: 'Qualified', color: 'blue' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae03', value: 'READY', label: 'Ready for outreach', color: 'orange' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae04', value: 'CONTACTED', label: 'Contacted', color: 'purple' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae05', value: 'REPLIED', label: 'Replied', color: 'turquoise' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae06', value: 'DEMO_BOOKED', label: 'Demo booked', color: 'green' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae07', value: 'CLOSED', label: 'Closed', color: 'gray' },
  { id: '82dfb03a-bf10-4607-985c-39e9c80eae08', value: 'DO_NOT_CONTACT', label: 'Do not contact', color: 'red' },
] as const;

const textFields = [
  ['name', 'Restaurant', 'IconBuildingStore'],
  ['market', 'Market', 'IconMapPin'],
  ['state', 'State', 'IconMap'],
  ['category', 'Category', 'IconList'],
  ['businessPhone', 'Business phone', 'IconPhone'],
  ['businessEmail', 'Business email', 'IconMail'],
  ['website', 'Website', 'IconLink'],
  ['address', 'Address', 'IconMapPin'],
  ['permissionNotes', 'Permission notes', 'IconNotes'],
] as const;

const dateFields = [
  ['emailPermissionAt', 'Email permission recorded at', 'IconMail'],
  ['whatsappPermissionAt', 'WhatsApp permission recorded at', 'IconMessage'],
  ['nextActionAt', 'Next action at', 'IconCalendar'],
  ['latestReplyAt', 'Latest reply at', 'IconMessage'],
] as const;

const suppressionFields = [
  ['emailSuppressed', 'Suppress email', 'IconMailOff'],
  ['whatsappSuppressed', 'Suppress WhatsApp', 'IconMessageOff'],
] as const;

export default defineObject({
  universalIdentifier: RESTAURANT_PROSPECT_ID,
  nameSingular: 'restaurantProspect',
  namePlural: 'restaurantProspects',
  labelSingular: 'Restaurant prospect',
  labelPlural: 'Restaurant prospects',
  description: 'Restaurant outlets and their outreach history.',
  icon: 'IconBuildingStore',
  labelIdentifierFieldMetadataUniversalIdentifier: RESTAURANT_FIELDS.name,
  fields: [
    {
      name: 'sourceId',
      label: 'Source ID',
      icon: 'IconHash',
      type: FieldType.TEXT,
      universalIdentifier: RESTAURANT_FIELDS.sourceId,
      isNullable: true,
      defaultValue: null,
    },
    ...textFields.map(([name, label, icon]) => ({
      name,
      label,
      icon,
      type: FieldType.TEXT as const,
      universalIdentifier: RESTAURANT_FIELDS[name],
    })),
    ...dateFields.map(([name, label, icon]) => ({
      name,
      label,
      icon,
      type: FieldType.DATE_TIME as const,
      universalIdentifier: RESTAURANT_FIELDS[name],
      isNullable: true,
      defaultValue: null,
    })),
    ...suppressionFields.map(([name, label, icon]) => ({
      name,
      label,
      icon,
      type: FieldType.BOOLEAN as const,
      universalIdentifier: RESTAURANT_FIELDS[name],
      defaultValue: false,
    })),
    {
      name: 'stage',
      label: 'Stage',
      icon: 'IconLayoutKanban',
      type: FieldType.SELECT,
      universalIdentifier: RESTAURANT_FIELDS.stage,
      defaultValue: "'NEW'",
      options: RESTAURANT_STAGES.map((stage, position) => ({ ...stage, position })),
    },
    {
      name: 'posStatus',
      label: 'Current POS',
      icon: 'IconDeviceDesktop',
      type: FieldType.SELECT,
      universalIdentifier: RESTAURANT_FIELDS.posStatus,
      defaultValue: "'UNKNOWN'",
      options: [
        { id: '82dfb03a-bf10-4607-985c-39e9c80ead01', value: 'UNKNOWN', label: 'Unknown', color: 'gray', position: 0 },
        { id: '82dfb03a-bf10-4607-985c-39e9c80ead02', value: 'NO_POS', label: 'No POS', color: 'green', position: 1 },
        { id: '82dfb03a-bf10-4607-985c-39e9c80ead03', value: 'PETPOOJA', label: 'Uses Petpooja', color: 'orange', position: 2 },
        { id: '82dfb03a-bf10-4607-985c-39e9c80ead04', value: 'OTHER_POS', label: 'Uses another POS', color: 'blue', position: 3 },
      ],
    },
  ],
});
