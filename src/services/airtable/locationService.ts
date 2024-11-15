import { base } from './config';
import type { Location } from '../../types/Location';

export const locationService = {
  async create(fields: Partial<Location['fields']>) {
    const [record] = await base('Locations').create([{ fields }]);
    return record;
  }
};