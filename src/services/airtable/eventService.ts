import { base } from './config';
import type { EventFields } from '../../types/Event';

export const eventService = {
  create: async (fields: Partial<EventFields>) => {
    const [record] = await base('Events').create([{ fields }]);
    return record;
  }
};