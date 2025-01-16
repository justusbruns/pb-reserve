import { base } from './config';
import type { PersonFields } from '../../types/Person';
import type { FieldSet, Records } from 'airtable';

export const personService = {
  /**
   * Create a new person
   */
  create: async (fields: Partial<PersonFields>) => {
    const [record] = await base('People').create([{ fields }]);
    return record;
  },

  /**
   * Get a person by ID
   */
  get: async (id: string) => {
    return await base('People').find(id);
  },

  /**
   * Update a person
   */
  update: async (id: string, fields: Partial<PersonFields>) => {
    const [record] = await base('People').update([{ id, fields }]);
    return record;
  },

  /**
   * Delete a person
   */
  delete: async (id: string) => {
    const [record] = await base('People').destroy([id]);
    return record;
  },

  /**
   * List all people with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    const records = await base('People')
      .select({
        filterByFormula,
        sort: [{ field: 'Name', direction: 'asc' }]
      })
      .all();
    return records;
  },

  /**
   * List people by type
   */
  listByType: async (type: NonNullable<PersonFields['Type of person']>): Promise<Records<FieldSet>> => {
    return await personService.list(`{Type of person} = '${type}'`);
  },

  /**
   * List all chauffeurs
   */
  listChauffeurs: async (): Promise<Records<FieldSet>> => {
    return await personService.listByType('Chauffeur');
  },

  /**
   * List all customer employees
   */
  listCustomerEmployees: async (): Promise<Records<FieldSet>> => {
    return await personService.listByType('Customer employee');
  },

  /**
   * List people by organization
   */
  listByOrganization: async (organizationId: string): Promise<Records<FieldSet>> => {
    return await personService.list(`FIND('${organizationId}', {Organizations})`);
  },

  /**
   * List contact persons for an event
   */
  listContactsForEvent: async (eventId: string): Promise<Records<FieldSet>> => {
    return await personService.list(`FIND('${eventId}', {Contact person at})`);
  },

  /**
   * List installers for an event
   */
  listInstallersForEvent: async (eventId: string): Promise<Records<FieldSet>> => {
    return await personService.list(`FIND('${eventId}', {Installation at})`);
  },

  /**
   * Search people by name
   */
  searchByName: async (name: string): Promise<Records<FieldSet>> => {
    return await personService.list(`SEARCH('${name}', LOWER({Name}))`);
  },

  /**
   * List people by availability
   */
  listByAvailability: async (availabilityId: string): Promise<Records<FieldSet>> => {
    return await personService.list(`FIND('${availabilityId}', {Availability})`);
  },

  /**
   * List people involved in events (either as contact or installer)
   */
  listEventInvolved: async (): Promise<Records<FieldSet>> => {
    return await personService.list(
      `OR(NOT({Contact person at} = ''), NOT({Installation at} = ''))`
    );
  },

  /**
   * Format phone number to international format
   * Handles common Dutch and Belgian number formats
   */
  formatPhoneNumber: (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Handle Dutch numbers
    if (digits.startsWith('31') || digits.startsWith('06')) {
      const normalizedNumber = digits.startsWith('06') ? `31${digits.slice(1)}` : digits;
      return `+${normalizedNumber.slice(0, 2)} ${normalizedNumber.slice(2, 4)} ${normalizedNumber.slice(4)}`;
    }

    // Handle Belgian numbers
    if (digits.startsWith('32') || digits.startsWith('0')) {
      const normalizedNumber = digits.startsWith('0') ? `32${digits.slice(1)}` : digits;
      return `+${normalizedNumber.slice(0, 2)} ${normalizedNumber.slice(2, 3)} ${normalizedNumber.slice(3)}`;
    }

    // Return formatted with international prefix if not handled above
    return `+${digits}`;
  },

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Get person by email
   */
  async getByEmail(email: string): Promise<Records<FieldSet>> {
    return await this.list(`{Email} = '${email}'`);
  }
};