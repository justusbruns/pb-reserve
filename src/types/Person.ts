import type { AirtableResponse } from './base';

export interface PersonFields {
  'Name': string;
  'Organizations'?: string[];
  'Contact person at'?: string[];
  'Installation at'?: string[];
  'Notes'?: string;
  'Email'?: string;
  'Mobile number'?: string;
  'Contactperson at copy'?: string;
  'Events'?: string[];
  'Type of person'?: 'Chauffeur' | 'Customer employee';
  'Availability'?: string[];
}

export type Person = AirtableResponse<PersonFields>;
