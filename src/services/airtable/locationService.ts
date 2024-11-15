import { base } from './config';

export const locationService = {
  create: async (fields: any) => {
    return await base('Locations').create([{ fields }]);
  }
};

export * from './locationService';