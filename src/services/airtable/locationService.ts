import { base } from './config';
import type { LocationFields } from '../../types/Location';

export const locationService = {
  create: async (fields: Partial<LocationFields>) => {
    const [record] = await base('Locations').create([{ fields }]);
    return record;
  },
  // Add other methods as needed
};