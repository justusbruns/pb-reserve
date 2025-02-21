import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const origin = url.searchParams.get('origin');
  const destination = url.searchParams.get('destination');

  if (!origin || !destination) {
    return new Response('Origin and destination parameters are required', { status: 400 });
  }

  if (!env.MAPBOX_TOKEN) {
    return new Response('Mapbox token not configured', { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=geojson&access_token=${env.MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Directions request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Directions service error:', error);
    return new Response(`Directions service error: ${error.message}`, { status: 500 });
  }
};
