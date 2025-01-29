import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ url }) {
    console.log('Geocoding API called with params:', Object.fromEntries(url.searchParams));
    
    const address = url.searchParams.get('address');
    const language = url.searchParams.get('language') || 'en';
    const types = url.searchParams.get('types') || 'address';
    const countries = url.searchParams.get('countries') || 'NL,BE,DE';
    
    if (!address) {
        console.error('Missing address parameter');
        return json({ error: 'Address parameter is required' }, { 
            status: 400,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }

    if (!env.MAPBOX_TOKEN) {
        console.error('MAPBOX_TOKEN environment variable is not set');
        return json({ error: 'Mapbox configuration error' }, { 
            status: 500,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }

    try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
        const params = new URLSearchParams({
            access_token: env.MAPBOX_TOKEN,
            language,
            types,
            country: countries,
            limit: '5'
        });

        console.log('Geocoding request:', {
            url: mapboxUrl,
            params: Object.fromEntries(params),
            tokenPrefix: env.MAPBOX_TOKEN ? env.MAPBOX_TOKEN.substring(0, 8) + '...' : 'not set'
        });

        const response = await fetch(`${mapboxUrl}?${params}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Mapbox API error:', data);
            return json({ error: 'Geocoding service error', details: data }, {
                status: response.status,
                headers: {
                    'content-type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        return json(data, {
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        return json({ error: 'Geocoding service error', details: error.message }, {
            status: 500,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
}

// Reverse geocoding endpoint
export async function POST({ request }) {
    try {
        const { coordinates } = await request.json();
        
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            return json({ error: 'Invalid coordinates' }, { 
                status: 400,
                headers: {
                    'content-type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        if (!env.MAPBOX_TOKEN) {
            return json({ error: 'Mapbox configuration error' }, { 
                status: 500,
                headers: {
                    'content-type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        const [lng, lat] = coordinates;
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
        const params = new URLSearchParams({
            access_token: env.MAPBOX_TOKEN,
            types: 'address',
            limit: '1'
        });

        const response = await fetch(`${mapboxUrl}?${params}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Mapbox API error:', data);
            return json({ error: 'Reverse geocoding service error', details: data }, {
                status: response.status,
                headers: {
                    'content-type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        return json(data, {
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return json({ error: 'Reverse geocoding service error', details: error.message }, {
            status: 500,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
}
