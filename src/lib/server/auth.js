import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Middleware to protect API endpoints
 * @param {Request} request - The incoming request
 * @returns {Response|null} - Returns error response if unauthorized, null if authorized
 */
export async function requireAuth(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Authorization header missing or invalid' }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        const token = authHeader.split(' ')[1];
        
        // In a real application, you would validate the token here
        // For now, we're using a simple environment variable comparison
        if (token !== env.API_TOKEN) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return null; // Auth successful
    } catch (error) {
        console.error('Auth error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

/**
 * Helper to validate specific roles
 * @param {string[]} allowedRoles - Array of roles that are allowed
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user has permission
 */
export function hasRole(allowedRoles, userRole) {
    return allowedRoles.includes(userRole);
}
