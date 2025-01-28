import { env } from '$env/dynamic/private';

// Log environment variables on server start
console.log('Server environment variables:', {
    AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set' : 'Not set',
    AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set' : 'Not set',
    MAPBOX_TOKEN: env.MAPBOX_TOKEN ? 'Set' : 'Not set'
});

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

    console.log('Incoming request:', {
        method: event.request.method,
        url: event.url.pathname,
        headers: Object.fromEntries(event.request.headers)
    });

    try {
        // Handle API requests
        if (event.url.pathname.startsWith('/api/')) {
            console.log('Handling API request:', event.url.pathname);
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
