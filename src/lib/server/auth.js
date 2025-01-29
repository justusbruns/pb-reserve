import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'crypto';

// Verify required environment variables at runtime
function checkAuthConfig() {
    const required = ['ADMIN_USER', 'ADMIN_PASSWORD', 'SESSION_SECRET'];
    const missing = required.filter(key => !env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Middleware to protect API endpoints using session-based authentication
 * @param {Request} request - The incoming request
 * @returns {Response|null} - Returns error response if unauthorized, null if authorized
 */
export async function requireAuth(request) {
    try {
        // Check config at runtime
        checkAuthConfig();

        // Get session token from cookie
        const cookies = request.headers.get('cookie');
        if (!cookies) {
            return json(
                { error: 'No session cookie found' },
                { status: 401 }
            );
        }

        // Parse cookies to get session token
        const sessionToken = cookies.split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith('session='))
            ?.split('=')[1];

        if (!sessionToken) {
            return json(
                { error: 'No session token found' },
                { status: 401 }
            );
        }

        // Verify JWT token
        try {
            const decoded = jwt.verify(sessionToken, env.SESSION_SECRET);
            request.locals = { user: decoded };
            return null;
        } catch (error) {
            console.error('Session token verification failed:', error);
            return json(
                { error: 'Invalid session token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return json(
            { error: 'Authentication failed', details: error.message },
            { status: 500 }
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

/**
 * Create a new session for a user
 * @param {object} user - User object containing id, username, and role
 * @returns {string} - JWT token for the session
 */
export function createSession(user) {
    try {
        checkAuthConfig();
        return jwt.sign(
            {
                username: user.username,
                role: user.role
            },
            env.SESSION_SECRET,
            { expiresIn: '24h' }
        );
    } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
    }
}

/**
 * Validate admin credentials using timing-safe comparison
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {object|null} - User object if valid, null if invalid
 */
export function validateAdmin(username, password) {
    try {
        checkAuthConfig();

        // Use timing-safe comparison for both username and password
        const usernameBuffer = Buffer.from(username);
        const storedUsernameBuffer = Buffer.from(env.ADMIN_USER);
        const passwordBuffer = Buffer.from(password);
        const storedPasswordBuffer = Buffer.from(env.ADMIN_PASSWORD);

        const usernameMatch = usernameBuffer.length === storedUsernameBuffer.length &&
            timingSafeEqual(usernameBuffer, storedUsernameBuffer);
        const passwordMatch = passwordBuffer.length === storedPasswordBuffer.length &&
            timingSafeEqual(passwordBuffer, storedPasswordBuffer);

        if (usernameMatch && passwordMatch) {
            return {
                username: env.ADMIN_USER,
                role: 'admin'
            };
        }

        return null;
    } catch (error) {
        console.error('Validation error:', error);
        throw error;
    }
}
