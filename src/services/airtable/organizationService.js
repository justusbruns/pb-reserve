// src/services/airtable/organizationService.js

import { base } from './config';

export const organizationService = {
  create: async (fields) => {
    const [record] = await base('Organizations').create([{ fields }]);
    return record;
  },
  // Add other methods as needed
};