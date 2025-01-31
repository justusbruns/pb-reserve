import { json, type RequestHandler } from '@sveltejs/kit';
import { createSession, validateAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username, password } = await request.json();
        console.log('Processing authentication request');
        
        // Input validation
        if (!username || typeof username !== 'string' || username.length < 1) {
            return json({ error: 'Invalid username' }, { status: 400 });
        }
        if (!password || typeof password !== 'string' || password.length < 1) {
            return json({ error: 'Invalid password' }, { status: 400 });
        }
        
        // Handle public access
        if (username === 'public' && password === 'public') {
            const sessionToken = createSession({ username: 'public', role: 'public' });
            console.log('Public session created');

            // Calculate expiry time (24 hours from now)
            const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const cookieValue = `session=${sessionToken}; HttpOnly; Path=/; SameSite=Strict; Secure; Expires=${expiryDate.toUTCString()}`;

            // Return success with session cookie
            return json(
                { success: true },
                {
                    headers: {
                        'Set-Cookie': cookieValue
                    }
                }
            );
        }
        
        // Validate admin credentials
        const user = validateAdmin(username, password);
        if (!user) {
            console.log('Authentication failed');
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session token
        const sessionToken = createSession(user);
        console.log('Admin session created');

        // Calculate expiry time (24 hours from now)
        const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const cookieValue = `session=${sessionToken}; HttpOnly; Path=/; SameSite=Strict; Secure; Expires=${expiryDate.toUTCString()}`;

        // Return success with session cookie
        return json(
            { success: true },
            {
                headers: {
                    'Set-Cookie': cookieValue
                }
            }
        );
    } catch (error) {
        console.error('Error in auth endpoint');
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};
