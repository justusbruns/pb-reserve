import { base } from './config';
import type { Event, EventFields } from '../../types/Event';

export const eventService = {
  async create(fields: Partial<EventFields>) {
    const [record] = await base('Events').create([{ fields }]);
    return record;
  }
};