import { base } from './config';

interface LocationFields {
  'Location name': string;
  'Address line 1': string;
  'Address line 2'?: string;
  'Postal code'?: string;
  'City'?: string;
  'Country': string;
}

export const locationService = {
  create: async (fields: Partial<LocationFields>) => {
    const [record] = await base('Locations').create([{ fields }]);
    return record;
  }
};

// Remove redundant export