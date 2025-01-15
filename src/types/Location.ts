import type { AirtableResponse } from './base';

export interface LocationFields {
  'Location name': string;
  'Address line 1': string;
  'Address line 2'?: string;
  'City'?: string;
  'Postal code'?: string;
  'Country': string;
  'Events'?: string[];
}

export type Location = AirtableResponse<LocationFields>;