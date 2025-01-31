import { json, type RequestHandler } from '@sveltejs/kit';
import { createSession, validateAdmin } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Get credentials from request
        const { username, password, formToken } = await request.json();
        
        if (!formToken || formToken !== 'pb-reserve-form-submission') {
            console.error('Invalid form token');
            return json({ error: 'Not authorized' }, { status: 403 });
        }

        // Validate admin credentials
        const user = validateAdmin(username, password);
        if (!user) {
            console.error('Invalid admin credentials');
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session token
        const sessionToken = createSession(user);
        console.log('Created admin session for form submission');

        // Calculate expiry time (24 hours from now)
        const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Return success with session cookie
        return json(
            { success: true },
            {
                headers: {
                    'Set-Cookie': `session=${sessionToken}; HttpOnly; Path=/; SameSite=Strict; Secure; Expires=${expiryDate.toUTCString()}`
                }
            }
        );
    } catch (error) {
        console.error('Error in admin auth endpoint:', error);
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};
