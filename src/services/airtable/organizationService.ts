import { base } from './config';
import type { OrganizationFields } from '../../types/Organization';
import type { FieldSet, Records } from 'airtable';

export const organizationService = {
  /**
   * Create a new organization
   */
  create: async (fields: Partial<OrganizationFields>) => {
    const [record] = await base('Organizations').create([{ fields }]);
    return record;
  },

  /**
   * Get an organization by ID
   */
  get: async (id: string) => {
    return await base('Organizations').find(id);
  },

  /**
   * Update an organization
   */
  update: async (id: string, fields: Partial<OrganizationFields>) => {
    const [record] = await base('Organizations').update([{ id, fields }]);
    return record;
  },

  /**
   * Delete an organization
   */
  delete: async (id: string) => {
    const [record] = await base('Organizations').destroy([id]);
    return record;
  },

  /**
   * List all organizations with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    const records = await base('Organizations')
      .select({
        filterByFormula,
        sort: [{ field: 'Name organization', direction: 'asc' }]
      })
      .all();
    return records;
  },

  /**
   * List organizations by legal type
   */
  listByLegalType: async (legalType: NonNullable<OrganizationFields['Legal Type']>): Promise<Records<FieldSet>> => {
    return await organizationService.list(`{Legal Type} = '${legalType}'`);
  },

  /**
   * List organizations by country
   */
  listByCountry: async (country: NonNullable<OrganizationFields['Country']>): Promise<Records<FieldSet>> => {
    return await organizationService.list(`{Country} = '${country}'`);
  },

  /**
   * List organizations with VAT number
   */
  listWithVAT: async (): Promise<Records<FieldSet>> => {
    return await organizationService.list(`NOT({VAT NR} = '')`);
  },

  /**
   * List organizations without VAT number
   */
  listWithoutVAT: async (): Promise<Records<FieldSet>> => {
    return await organizationService.list(`{VAT NR} = ''`);
  },

  /**
   * List organizations by employee
   */
  listByEmployee: async (employeeId: string): Promise<Records<FieldSet>> => {
    return await organizationService.list(`FIND('${employeeId}', {Employees})`);
  },

  /**
   * List organizations that have organized events
   */
  listEventOrganizers: async (): Promise<Records<FieldSet>> => {
    return await organizationService.list(`NOT({Events organized} = '')`);
  },

  /**
   * List organizations that have hosted events
   */
  listEventHosts: async (): Promise<Records<FieldSet>> => {
    return await organizationService.list(`NOT({Events hosted} = '')`);
  },

  /**
   * Search organizations by name
   */
  searchByName: async (name: string): Promise<Records<FieldSet>> => {
    return await organizationService.list(`SEARCH('${name}', LOWER({Name organization}))`);
  },

  /**
   * List organizations by city
   */
  listByCity: async (city: string): Promise<Records<FieldSet>> => {
    return await organizationService.list(`{City} = '${city}'`);
  },

  /**
   * Get organization's full address
   */
  getFullAddress: (org: OrganizationFields): string => {
    const parts = [
      org['Address line 1'],
      org['Address line 2'],
      org['Postal code'],
      org['City'],
      org['Country']
    ].filter(Boolean);
    return parts.join(', ');
  },

  /**
   * Validate VAT number format
   * Basic validation for NL and BE VAT numbers
   */
  validateVATNumber: (vatNumber: string, country: OrganizationFields['Country']): boolean => {
    if (!vatNumber || !country) return false;
    
    const nlPattern = /^NL[0-9]{9}B[0-9]{2}$/;
    const bePattern = /^BE[0-9]{10}$/;
    
    if (country === 'Netherlands') {
      return nlPattern.test(vatNumber.replace(/\s/g, ''));
    } else if (country === 'Belgium') {
      return bePattern.test(vatNumber.replace(/\s/g, ''));
    }
    
    return false;
  }
};