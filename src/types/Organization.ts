imimimport type { AirtableResponse } from './base';

export type OrganizationFields = {
  'Name Organization': string;
  'VAT NR': string;
  'Address line 1': string;
  'Address line 2'?: string;
  'Postal code': string;
  'City': string;
  'Country': string;
  'Events organized': string[];
  'Contacts': string[];
}

export type Organization = AirtableResponse<OrganizationFields>;