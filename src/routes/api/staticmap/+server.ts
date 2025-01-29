import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const bbox = url.searchParams.get('bbox');
  const geojson = url.searchParams.get('geojson');

  console.log('Static map request params:', { bbox, geojson });

  if (!bbox || !geojson) {
    return new Response('Missing required parameters', { status: 400 });
  }

  if (!env.MAPBOX_TOKEN) {
    console.error('Mapbox token not found in environment');
    return new Response('Mapbox token not configured', { status: 500 });
  }

  try {
    // Parse the bbox
    const [west, south, east, north] = bbox.split(',').map(Number);

    // Parse the GeoJSON
    const parsedGeojson = JSON.parse(geojson);
    
    // Create the static map URL
    const mapUrl = new URL('https://api.mapbox.com/styles/v1/mapbox/light-v11/static');

    // Add the GeoJSON features
    const encodedGeoJson = encodeURIComponent(JSON.stringify(parsedGeojson));
    mapUrl.pathname += `/geojson(${encodedGeoJson})`;

    // Add the viewport
    mapUrl.pathname += `/[${bbox}]`;

    // Set the size and pixel ratio
    mapUrl.pathname += '/800x600@2x';

    // Add the access token
    mapUrl.searchParams.append('access_token', env.MAPBOX_TOKEN);

    console.log('Requesting Mapbox static map...');
    const response = await fetch(mapUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Static map request failed: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Static map service error:', error);
    return new Response(`Static map service error: ${error.message}`, { status: 500 });
  }
};
