import { base } from './config';
import type { OrganizationFields } from '../../types/Organization';

export const organizationService = {
  create: async (fields) => {
    const [record] = await base('Organizations').create([{ fields }]);
    return record;
  },
  // Add other methods as needed
};