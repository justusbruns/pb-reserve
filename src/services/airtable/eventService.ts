import { apiRequest } from '../../lib/client/apiClient';
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
    try {
      return await apiRequest('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
      });
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Get an event by ID
   */
  get: async (id: string) => {
    try {
      return await apiRequest(`/api/events/${id}`);
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  /**
   * Update an event
   */
  update: async (id: string, fields: Partial<EventFields>) => {
    try {
      return await apiRequest(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  /**
   * Delete an event
   */
  delete: async (id: string) => {
    try {
      return await apiRequest(`/api/events/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  /**
   * List all events with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    try {
      return await apiRequest('/api/events', {
        params: {
          filterByFormula
        }
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
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
      return await apiRequest('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Get events from a specific view
   */
  async getFromView(viewName: string): Promise<Records<FieldSet>> {
    try {
      return await apiRequest('/api/events');
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
};