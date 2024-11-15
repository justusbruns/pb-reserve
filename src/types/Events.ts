import type { AirtableResponse } from './base';

export type EventFields = {
  'Event name': string;
  'Start at': string;
  'Ends at': string;
  'Event created by': string;
  'Contact person': string[];
  'Location': string[];
  'Reserved by': string[];
  'Event info sent': boolean;
  'Status': 'concept' | 'confirmed' | 'cancelled';
  'Payment status': 'Invoice requested' | 'Proposal requested';
  'Total amount': number;
}

export type Event = AirtableResponse<EventFields>;