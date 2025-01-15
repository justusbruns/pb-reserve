// src/services/airtable/productService.ts

import { base } from './config';
import type { FieldSet, Records } from 'airtable';

interface ProductFields {
  'Name': string;
  'Description'?: string;
  'Price'?: number;
  'Category'?: string;
  'Status'?: string;
}

export const productService = {
  /**
   * Get a product by name
   */
  async getByName(name: string) {
    try {
      const records = await base('Products / Services')
        .select({
          filterByFormula: `{Name} = '${name}'`
        })
        .all();
      return records[0];
    } catch (error) {
      console.error('Error getting product by name:', error);
      throw error;
    }
  },

  /**
   * List all products
   */
  async list(): Promise<Records<FieldSet>> {
    try {
      const records = await base('Products / Services')
        .select()
        .all();
      return records;
    } catch (error) {
      console.error('Error listing products:', error);
      throw error;
    }
  }
};
