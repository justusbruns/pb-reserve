import { env } from '$env/dynamic/private';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    // Debug log on startup
    console.log('Server environment check:', {
        MAPBOX_TOKEN: env.MAPBOX_TOKEN ? 'Set' : 'Not set',
        AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set' : 'Not set',
        AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set' : 'Not set',
        API_TOKEN: env.API_TOKEN ? 'Set' : 'Not set',
        ADMIN_USER: env.ADMIN_USER ? 'Set' : 'Not set',
        ADMIN_PASSWORD: env.ADMIN_PASSWORD ? 'Set' : 'Not set',
        SESSION_SECRET: env.SESSION_SECRET ? 'Set' : 'Not set'
    });

    // Check required environment variables on first request
    const required = {
        AIRTABLE_PAT: 'Airtable Personal Access Token',
        AIRTABLE_BASE_ID: 'Airtable Base ID',
        MAPBOX_TOKEN: 'Mapbox API Token',
        API_TOKEN: 'API Token',
        ADMIN_USER: 'Admin Username',
        ADMIN_PASSWORD: 'Admin Password',
        SESSION_SECRET: 'Session Secret'
    };

    // Only check on API requests to avoid build issues
    if (event.url.pathname.startsWith('/api/')) {
        const missing = Object.entries(required)
            .filter(([key]) => !env[key])
            .map(([key, desc]) => `${desc} (${key})`);

        if (missing.length > 0) {
            console.error('Missing required environment variables:', missing.join(', '));
            return new Response('Server configuration error: Missing environment variables', { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Log request details for API calls
        console.log(`[${event.request.method}] ${event.url.pathname}`, {
            hasSessionCookie: event.request.headers.get('cookie')?.includes('session=') || false
        });
    }

    // Ensure environment variables are available
    if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID || !env.MAPBOX_TOKEN) {
        console.error('Missing required environment variables:', {
            AIRTABLE_PAT: !env.AIRTABLE_PAT,
            AIRTABLE_BASE_ID: !env.AIRTABLE_BASE_ID,
            MAPBOX_TOKEN: !env.MAPBOX_TOKEN
        });
        return new Response('Server configuration error', { status: 500 });
    }

    // Add user info to event.locals if available
    const user = event.locals.user;
    
    // Log request details
    console.log(`[${event.request.method}] ${event.url.pathname}`, {
        user: user?.username || 'anonymous',
        hasSessionCookie: event.request.headers.get('cookie')?.includes('session=') || false
    });

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
