import { defineApplicationRole } from 'twenty-sdk/define';

import { RESTAURANT_PROSPECT_ID } from '../objects/restaurant-prospect.object';

export default defineApplicationRole({
  universalIdentifier: '82dfb03a-bf10-4607-985c-39e9c80eaf02',
  label: 'Restaurant outreach application',
  description: 'Access to restaurant prospects for outreach functions.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: RESTAURANT_PROSPECT_ID,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
});
