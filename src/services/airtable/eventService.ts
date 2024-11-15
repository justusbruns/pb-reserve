import { base } from './config';
import type { EventFields } from '../../types/Event';

export const eventService = {
  create: async (fields: Partial<EventFields>) => {
    return await base('Events').create([{ fields }]);
  }
};