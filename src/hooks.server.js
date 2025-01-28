import { env } from '$env/dynamic/private';

// Keep server environment check but make it conditional
if (process.env.NODE_ENV === 'development') {
    console.log('Server environment variables:', {
        AIRTABLE_BASE_ID: !!env.AIRTABLE_BASE_ID,
        AIRTABLE_PAT: !!env.AIRTABLE_PAT,
        MAPBOX_TOKEN: !!env.MAPBOX_TOKEN
    });
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    // Ensure environment variables are available
    if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID || !env.MAPBOX_TOKEN) {
        console.error('Missing required environment variables:', {
            AIRTABLE_PAT: !env.AIRTABLE_PAT,
            AIRTABLE_BASE_ID: !env.AIRTABLE_BASE_ID,
            MAPBOX_TOKEN: !env.MAPBOX_TOKEN
        });
        return new Response('Server configuration error', { status: 500 });
    }

    // Keep API request logging for monitoring
    if (event.url.pathname.startsWith('/api/')) {
        console.log('API request:', {
            path: event.url.pathname,
            method: event.request.method,
            timestamp: new Date().toISOString()
        });
    }

    try {
        // Handle API requests
        if (event.url.pathname.startsWith('/api/')) {
            const response = await resolve(event);
            
            console.log('API response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers)
            });
            
            // Only set content-type to application/json if it's not already set
            // and it's not the static map endpoint
            if (!response.headers.has('content-type') && !event.url.pathname.startsWith('/api/staticmap')) {
                response.headers.set('content-type', 'application/json');
            }
            
            return response;
        }

        // Handle all other requests normally
        return await resolve(event);
    } catch (error) {
        console.error('Error in hooks.server.js:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
