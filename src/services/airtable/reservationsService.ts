// src/services/airtable/reservationsService.ts

import Airtable from 'airtable';

const base = new Airtable({ apiKey: import.meta.env.VITE_AIRTABLE_PAT }).base('apphYtwSYRt7UDukL');
const eventsTable = base('Events');
const organizationsTable = base('Organizations');
const table = base('Reservations');

interface OrganizationFields {
  'Name organization': string;
}

interface EventFields {
  'Name': string;
  'Reserved by': string[];  // Organization record IDs
  'Reserved for': string[];  // Organization record IDs
  'Start date': string;
  'End date': string;
  'Start time': string;
  'End time': string;
  'Languages': string;
  'Add branding': boolean;
  'Add theme': boolean;
  'Add printer': boolean;
  'Add get roasted': boolean;
  'Transport fee': number;
  'Total price': number;
  'Status': string;
  'Language': string;
  'Invoice address': string;
  'Invoice contact': string;
  'Invoice email': string;
  'Invoice phone': string;
  'VAT number': string;
  'PO number': string;
  'Is definitive': boolean;
  'Order': string;
}

interface ReservationFields {
  'Order': string;  // Required: 'Poem Booth 1', 'Printer', 'Theme', 'Branding', 'Transport'
  'Event name'?: string[];  // Links to Events table
  [key: string]: any;
}

export const reservationsService = {
  async create(fields: Partial<ReservationFields>) {
    try {
      const [record] = await table.create([{ fields }]);
      return { id: record.id, ...record.fields };
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  async update(id: string, fields: Partial<ReservationFields>) {
    try {
      // Ensure Event name is always an array when provided
      if (fields['Event name'] && !Array.isArray(fields['Event name'])) {
        fields['Event name'] = [fields['Event name']];
      }

      const record = await table.update([{ id, fields }]);
      return { id: record[0].id, ...record[0].fields };
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  },

  async get(id: string) {
    try {
      const record = await table.find(id);
      return { id: record.id, ...record.fields };
    } catch (error) {
      console.error('Error getting reservation:', error);
      throw error;
    }
  },

  async list(filterByFormula?: string) {
    try {
      const records = await table.select({ filterByFormula }).all();
      return records.map(record => ({ id: record.id, ...record.fields }));
    } catch (error) {
      console.error('Error listing reservations:', error);
      throw error;
    }
  }
};