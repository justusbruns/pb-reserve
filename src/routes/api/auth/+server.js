import { json } from '@sveltejs/kit';
import { validateAdmin, createSession } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

/**
 * Login endpoint - returns a session token as an HttpOnly cookie
 */
export async function POST({ request }) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Debug log environment variables and request
        console.log('Login attempt:', {
            providedUsername: username,
            providedPasswordLength: password?.length,
            envUsername: env.ADMIN_USER,
            envPasswordLength: env.ADMIN_PASSWORD?.length,
            usernameMatch: username === env.ADMIN_USER,
            passwordMatch: password === env.ADMIN_PASSWORD
        });

        // Validate credentials
        const user = validateAdmin(username, password);
        
        if (!user) {
            console.log('Authentication failed:', { 
                reason: username !== env.ADMIN_USER ? 'username mismatch' : 'password mismatch'
            });
            
            return json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create session token
        const sessionToken = createSession(user);
        console.log('Authentication successful, created session for:', user.username);

        // Return success with session cookie
        return json(
            { 
                success: true,
                user: {
                    username: user.username,
                    role: user.role
                }
            },
            {
                headers: {
                    'Set-Cookie': `session=${sessionToken}; HttpOnly; Path=/; SameSite=Strict`
                }
            }
        );
    } catch (error) {
        console.error('Authentication error:', error);
        return json(
            { error: 'Authentication failed', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Logout endpoint - clears the session cookie
 */
export async function DELETE() {
    return json(
        { success: true },
        {
            headers: {
                'Set-Cookie': 'session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
        }
    );
}
