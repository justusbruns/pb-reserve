import { base } from './config';
import type { Organization } from '../../types/Organization';

export const organizationService = {
  async create(fields: Partial<Organization['fields']>) {
    const [record] = await base('Organizations').create([{ fields }]);
    return record;
  }
};