import { base } from './config';
import type { EventFields } from '../../types/Event';
import type { FieldSet, Records } from 'airtable';

import { locationService } from './locationService';
import { personService } from './personService';
import { organizationService } from './organizationService';
import { reservationService } from './reservationService';

import type { LocationFields } from '../../types/Location';
import type { PersonFields } from '../../types/Person';
import type { OrganizationFields } from '../../types/Organization';

export interface CreateEventInput {
  event: {
    name: string;
    startAt: string;
    endAt: string;
    languages: NonNullable<EventFields['Languages']>;
    makeReservationFinal: boolean;
    printOption?: boolean;
    themeOption?: boolean;
    brandingOption?: boolean;
  };
  location: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country: 'Netherlands';
  };
  organization: {
    name: string;
    vatNumber: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email?: string;
    mobileNumber?: string;
  };
}

export const eventService = {
  /**
   * Create a new event
   */
  create: async (fields: Partial<EventFields>) => {
    const [record] = await base('Events').create([{ fields }]);
    return record;
  },

  /**
   * Get an event by ID
   */
  get: async (id: string) => {
    return await base('Events').find(id);
  },

  /**
   * Update an event
   */
  update: async (id: string, fields: Partial<EventFields>) => {
    const [record] = await base('Events').update([{ id, fields }]);
    return record;
  },

  /**
   * Delete an event
   */
  delete: async (id: string) => {
    const [record] = await base('Events').destroy([id]);
    return record;
  },

  /**
   * List all events with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    const records = await base('Events')
      .select({
        filterByFormula,
        sort: [{ field: 'Starts at', direction: 'desc' }]
      })
      .all();
    return records;
  },

  /**
   * List upcoming events (from today onwards)
   */
  listUpcoming: async (): Promise<Records<FieldSet>> => {
    const today = new Date().toISOString().split('T')[0];
    return await eventService.list(`{Starts at} >= '${today}'`);
  },

  /**
   * List events by status
   */
  listByStatus: async (status: EventFields['Status']): Promise<Records<FieldSet>> => {
    return await eventService.list(`{Status} = '${status}'`);
  },

  /**
   * List events by payment status
   */
  listByPaymentStatus: async (paymentStatus: NonNullable<EventFields['Payment status']>): Promise<Records<FieldSet>> => {
    return await eventService.list(`{Payment status} = '${paymentStatus}'`);
  },

  /**
   * List events by location
   */
  listByLocation: async (locationId: string): Promise<Records<FieldSet>> => {
    return await eventService.list(`FIND('${locationId}', {Location})`);
  },

  /**
   * List events by contact person
   */
  listByContactPerson: async (personId: string): Promise<Records<FieldSet>> => {
    return await eventService.list(`FIND('${personId}', {Contact person})`);
  },

  /**
   * List events by chauffeur
   */
  listByChauffeur: async (chauffeurId: string): Promise<Records<FieldSet>> => {
    return await eventService.list(`FIND('${chauffeurId}', {Chauffeur})`);
  },

  /**
   * List events by date range
   */
  listByDateRange: async (startDate: string, endDate: string): Promise<Records<FieldSet>> => {
    return await eventService.list(
      `AND({Starts at} >= '${startDate}', {Starts at} <= '${endDate}')`
    );
  },

  /**
   * List events that need network setup (missing network type or wifi credentials)
   */
  listNeedingNetworkSetup: async (): Promise<Records<FieldSet>> => {
    return await eventService.list(
      `OR({Type of Network} = '', AND({Type of Network} = 'Local Wifi', OR({Wifi name} = '', {Wifi password} = '')))`
    );
  },

  /**
   * Create a complete event with all related records
   */
  createComplete: async (input: CreateEventInput) => {
    try {
      // 1. Create Organization
      const organization = await organizationService.create({
        'Name Organization': input.organization.name,
        'VAT NR': input.organization.vatNumber,
        'Address line 1': input.organization.addressLine1,
        'Address line 2': input.organization.addressLine2,
        'Postal code': input.organization.postalCode,
        'City': input.organization.city,
        'Country': input.organization.country
      });

      // 2. Create Location
      const location = await locationService.create({
        'Location name': input.location.name,
        'Address line 1': input.location.addressLine1,
        'Address line 2': input.location.addressLine2,
        'Postal code': input.location.postalCode,
        'City': input.location.city,
        'Country': input.location.country
      });

      // 3. Create Contact Person
      const contactPerson = await personService.create({
        'Name': input.contactPerson.name,
        'Email': input.contactPerson.email,
        'Mobile number': input.contactPerson.mobileNumber,
        'Type of person': 'Customer employee',
        'Organizations': [organization.id]
      });

      // 4. Create Reservations
      const reservations = await Promise.all([
        // Default reservations
        reservationService.create({ 'Order': 'Poem Booth 1' }),
        reservationService.create({ 'Order': 'Transport' }),
        // Optional reservations
        ...(input.printOption ? [reservationService.create({ 'Order': 'Printer' })] : []),
        ...(input.themeOption ? [reservationService.create({ 'Order': 'Theme' })] : []),
        ...(input.brandingOption ? [reservationService.create({ 'Order': 'Branding' })] : [])
      ]);

      // 5. Finally, create the Event
      const event = await eventService.create({
        'Event name': input.event.name,
        'Starts at': input.event.startAt,
        'Stops at': input.event.endAt,
        'Event created by': 'Online',
        'Contact person': [contactPerson.id],
        'Location': [location.id],
        'Reserved by': [organization.id],
        'Status': 'concept',
        'Payment status': input.event.makeReservationFinal ? 'Invoice requested' : 'Proposal requested',
        'Languages': input.event.languages,
        // Link all reservations
        'Reservations': reservations.map(r => r.id)
      });

      return {
        event,
        organization,
        location,
        contactPerson,
        reservations
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Get events from a specific view
   */
  async getFromView(viewName: string): Promise<Records<FieldSet>> {
    const records = await base('Events')
      .select({
        view: viewName,
        sort: [{ field: 'Starts at', direction: 'asc' }]
      })
      .all();
    return records;
  }
};