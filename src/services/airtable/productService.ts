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
      console.log(`Fetching product with name: "${name}"`);
      const records = await base('Products / Services')
        .select({
          filterByFormula: `{Name} = '${name}'`
        })
        .all();
      
      if (records.length === 0) {
        console.error(`No product found with name: "${name}"`);
        return null;
      }
      
      if (records.length > 1) {
        console.warn(`Multiple products found with name: "${name}". Using first one.`);
      }
      
      console.log(`Found product: ${name}`, records[0]);
      return records[0];
    } catch (error) {
      console.error(`Error getting product by name "${name}":`, error);
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
