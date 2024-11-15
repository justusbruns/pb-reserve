import { base } from './config';
import type { OrganizationFields } from '../../types/Organization';

export const organizationService = {
  create: async (fields: Partial<OrganizationFields>) => {
    const [record] = await base('Organizations').create([{ fields }]);
    return record;
  }
};