import { base } from './config';
import type { Person } from '../../types/Person';

export const personService = {
  async create(fields: Partial<Person['fields']>) {
    const [record] = await base('People').create([{ fields }]);
    return record;
  }
};