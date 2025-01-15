import { base } from './config';
import type { LocationFields } from '../../types/Location';
import type { FieldSet, Records } from 'airtable';

export const locationService = {
  /**
   * Create a new location
   */
  create: async (fields: Partial<LocationFields>) => {
    const [record] = await base('Locations').create([{ fields }]);
    return record;
  },

  /**
   * Get a location by ID
   */
  get: async (id: string) => {
    return await base('Locations').find(id);
  },

  /**
   * Update a location
   */
  update: async (id: string, fields: Partial<LocationFields>) => {
    const [record] = await base('Locations').update([{ id, fields }]);
    return record;
  },

  /**
   * Delete a location
   */
  delete: async (id: string) => {
    const [record] = await base('Locations').destroy([id]);
    return record;
  },

  /**
   * List all locations with optional filter formula
   */
  list: async (filterByFormula?: string): Promise<Records<FieldSet>> => {
    const records = await base('Locations')
      .select({
        filterByFormula,
        sort: [{ field: 'Location name', direction: 'asc' }]
      })
      .all();
    return records;
  },

  /**
   * Search locations by name
   */
  searchByName: async (name: string): Promise<Records<FieldSet>> => {
    return await locationService.list(
      `SEARCH('${name}', LOWER({Location name}))`
    );
  },

  /**
   * List locations by city
   */
  listByCity: async (city: string): Promise<Records<FieldSet>> => {
    return await locationService.list(`{City} = '${city}'`);
  },

  /**
   * List locations with upcoming events
   */
  listWithUpcomingEvents: async (): Promise<Records<FieldSet>> => {
    return await locationService.list('NOT({Events} = "")');
  },

  /**
   * Format full address
   */
  formatAddress: (location: LocationFields): string => {
    const parts = [
      location['Address line 1'],
      location['Address line 2'],
      location['Postal code'],
      location['City'],
      location['Country']
    ].filter(Boolean);

    return parts.join(', ');
  },

  /**
   * Validate postal code format
   * Supports both Dutch (1234 AB) and Belgian (1234) formats
   */
  validatePostalCode: (postalCode: string): boolean => {
    // Dutch format: 4 digits followed by 2 letters, with or without space
    const dutchRegex = /^\d{4}\s?[A-Z]{2}$/i;
    // Belgian format: 4 digits
    const belgianRegex = /^\d{4}$/;

    return dutchRegex.test(postalCode) || belgianRegex.test(postalCode);
  },

  /**
   * Format postal code to standard format
   * For Dutch postal codes: adds space between digits and letters if missing
   */
  formatPostalCode: (postalCode: string): string => {
    if (!postalCode) return '';

    // Remove all spaces and convert to uppercase
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

    // If it's a Dutch postal code (4 digits + 2 letters)
    if (/^\d{4}[A-Z]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }

    return cleaned;
  },

  /**
   * Get locations near a specific location
   * This is a simple implementation based on postal code prefix
   * For more accurate results, consider using a geocoding service
   */
  getNearbyLocations: async (postalCode: string): Promise<Records<FieldSet>> => {
    const prefix = postalCode.slice(0, 2); // First 2 digits of postal code
    return await locationService.list(
      `AND(LEFT({Postal code}, 2) = '${prefix}', NOT(RECORD_ID() = ''))`
    );
  }
};