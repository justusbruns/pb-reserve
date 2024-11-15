import { base } from './config';
import type { EventFields, Event } from '../../types/Event';

export const eventService = {
  async create(fields: Partial<EventFields>): Promise<Event> {
    const [record] = await base('Events').create([{ fields }]);
    return record;
  },

  async list(params?: Airtable.SelectOptions<EventFields>): Promise<Event[]> {
    const records = await base('Events').select(params).all();
    return records;
  },

  async find(id: string): Promise<Event> {
    const record = await base('Events').find(id);
    return record;
  }
};