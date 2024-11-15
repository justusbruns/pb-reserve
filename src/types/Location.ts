imimport type { AirtableResponse } from './base';

export type LocationFields = {
  'Location name': string;
  'Address line 1': string;
  'Address line 2'?: string;
  'Postal code': string;
  'City': string;
  'Country': string;
  'Events': string[];
}

export type Location = AirtableResponse<LocationFields>;