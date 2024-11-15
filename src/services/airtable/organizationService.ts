import { base } from './config';

export const organizationService = {
  create: async (fields: any) => {
    return await base('Organizations').create([{ fields }]);
  }
};

export * from './organizationService';