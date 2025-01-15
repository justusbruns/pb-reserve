import type { AirtableResponse } from './base';

export interface OrganizationFields {
  'Name organization': string;
  'Employees'?: string[];
  'Reservations'?: string;
  'Updated at'?: string;
  'Created at': string;
  'Email'?: string;
  'Address line 1'?: string;
  'Address line 2'?: string;
  'Postal code'?: string;
  'City'?: string;
  'Country'?: string;
  'VAT NR'?: string;
  'Legal Type'?: 'Person' | 'Commercial' | 'Foundation';
  'Events organized'?: string[];
  'Events hosted'?: string[];
}

export type Organization = AirtableResponse<OrganizationFields>;