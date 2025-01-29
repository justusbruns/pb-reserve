import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  // Validate required environment variables
  const requiredVars = ['MAPBOX_TOKEN', 'API_TOKEN', 'AIRTABLE_PAT', 'AIRTABLE_BASE_ID'];
  const missingVars = requiredVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    throw error(500, `Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Only expose the Mapbox token which is needed for client-side geocoding
  return {
    mapboxToken: env.MAPBOX_TOKEN,
    initialized: true
  };
}
