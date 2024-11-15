import { base } from './config';

export const personService = {
  create: async (fields: any) => {
    return await base('People').create([{ fields }]);
  }
};