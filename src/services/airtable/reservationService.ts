import { base } from './config';
import type { ReservationFields } from '../../types/Reservation';
import type { FieldSet, Records } from 'airtable';

export const reservationService = {
  /**
   * Create a new reservation
   */
  create: async (fields: Partial<ReservationFields>) => {
    const [record] = await base('Reservations').create([{ fields }]);
    return record;
  },

  /**
   * Get a reservation by ID
   */
  get: async (id: string) => {
    return await base('Reservations').find(id);
  },

  /**
   * Update a reservation
   */
  update: async (id: string, fields: Partial<ReservationFields>) => {
    const [record] = await base('Reservations').update([{ id, fields }]);
    return record;
  },

  /**
   * Delete a reservation
   */
  delete: async (id: string) => {
    const [record] = await base('Reservations').destroy([id]);
    return record;
  },

  /**
   * List all reservations with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    const records = await base('Reservations')
      .select({
        filterByFormula,
        sort: [{ field: 'Created at', direction: 'desc' }]
      })
      .all();
    return records;
  },

  /**
   * List reservations by event
   */
  listByEvent: async (eventId: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`FIND('${eventId}', {Event name})`);
  },

  /**
   * List reservations by status
   */
  listByStatus: async (status: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`{Status} = '${status}'`);
  },

  /**
   * List reservations by date range
   */
  listByDateRange: async (startDate: string, endDate: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(
      `AND({Starts at} >= '${startDate}', {Starts at} <= '${endDate}')`
    );
  },

  /**
   * List reservations by conflict status
   */
  listByConflictStatus: async (status: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`{Conflict Status} = '${status}'`);
  },

  /**
   * List reservations by order type
   */
  listByOrder: async (orderId: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`FIND('${orderId}', {Order})`);
  },

  /**
   * List reservations with VAT requirements (non-Netherlands clients without VAT number)
   */
  listRequiringVAT: async (): Promise<Records<FieldSet>> => {
    return await reservationService.list(
      `AND({Client's Country} != 'Netherlands', {VAT %} > 0)`
    );
  },

  /**
   * List reservations by configuration
   */
  listByConfig: async (configId: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`FIND('${configId}', {Config})`);
  },

  /**
   * List reservations with potential conflicts (double bookings)
   */
  listConflicts: async (): Promise<Records<FieldSet>> => {
    return await reservationService.list(`{Conflict Status} = '🔴 Double Booked'`);
  },

  /**
   * Calculate reservation duration in days
   */
  calculateDuration: (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Calculate total price including VAT
   */
  calculateTotalWithVAT: (total: number, vatPercentage: number): number => {
    return total * (1 + vatPercentage);
  },

  /**
   * List upcoming reservations (from today onwards)
   */
  listUpcoming: async (): Promise<Records<FieldSet>> => {
    const today = new Date().toISOString().split('T')[0];
    return await reservationService.list(`{Starts at} >= '${today}'`);
  },

  /**
   * List reservations by unit type
   */
  listByUnit: async (unit: string): Promise<Records<FieldSet>> => {
    return await reservationService.list(`{Unit} = '${unit}'`);
  }
};
