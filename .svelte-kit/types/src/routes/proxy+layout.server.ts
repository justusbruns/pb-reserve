// @ts-nocheck
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

/** */
export function load() {
  // Validate required environment variables
  const requiredVars = ['MAPBOX_TOKEN', 'API_TOKEN'];
  const missingVars = requiredVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    throw error(500, `Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    mapboxToken: env.MAPBOX_TOKEN,
    PUBLIC_API_TOKEN: env.API_TOKEN // Make API token available to client
  };
}
