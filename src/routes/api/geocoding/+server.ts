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
        
        if (!response.ok) {
            console.error('Mapbox API error:', {
                status: response.status,
                statusText: response.statusText,
                body: await response.text()
            });
            throw new Error(`Mapbox API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Mapbox API response:', {
            query: address,
            featuresCount: data.features?.length,
            firstFeature: data.features?.[0],
            type: data.type,
            attribution: data.attribution
        });
        
        // Only return necessary data to minimize exposure
        const features = data.features.map(feature => ({
            id: feature.id,
            type: feature.type,
            place_type: feature.place_type,
            place_name: feature.place_name,
            text: feature.text,
            center: feature.center,
            context: feature.context?.map(ctx => ({
                id: ctx.id,
                text: ctx.text,
                short_code: ctx.short_code,
                wikidata: ctx.wikidata
            }))
        }));

        console.log('Returning features:', JSON.stringify(features, null, 2));
        return json({ features }, {
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        return json({ error: 'Geocoding service error' }, { status: 500 });
    }
}

// Reverse geocoding endpoint
export async function POST({ request }) {
    try {
        const { lng, lat } = await request.json();
        console.log('Reverse geocoding request for coordinates:', { lng, lat });
        
        if (!lng || !lat) {
            console.error('Missing coordinates');
            return json({ error: 'Longitude and latitude are required' }, { 
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

        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
            new URLSearchParams({
                access_token: env.MAPBOX_TOKEN,
                types: 'address',
                limit: '1'
            });
            
        console.log('Mapbox reverse geocoding URL:', mapboxUrl);
        
        const response = await fetch(mapboxUrl);
        console.log('Mapbox response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mapbox API error:', errorText);
            throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Mapbox API response:', JSON.stringify(data, null, 2));
        
        return json(data, {
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return json({ error: 'Failed to reverse geocode coordinates', details: error.message }, { 
            status: 500,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
}
