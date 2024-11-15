import { base } from './config';

interface PersonFields {
  'Name': string;
  'Type of person': string;
  'Organizations': string[];
}

export const personService = {
  create: async (fields: Partial<PersonFields>) => {
    const [record] = await base('People').create([{ fields }]);
    return record;
  }
};