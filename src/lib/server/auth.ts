import { json, error, type Response } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';
import type { Request } from '@sveltejs/kit';
import crypto from 'crypto';

if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
}

const SESSION_SECRET = env.SESSION_SECRET;
const SESSION_EXPIRY = '24h'; // Session expires in 24 hours
const SALT_ROUNDS = 10;

interface User {
    username: string;
    role: string;
    sessionExp?: number;
}

// Hash password with salt
function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// Verify password
function verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, storedHash] = hashedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return storedHash === hash;
}

// Store hashed admin password if not already set
let hashedAdminPassword: string | null = null;
if (env.ADMIN_PASSWORD) {
    hashedAdminPassword = hashPassword(env.ADMIN_PASSWORD);
}

export function validateAdmin(username: string, password: string): User | null {
    // Only log that validation is happening, not the credentials
    console.log('Validating admin credentials');
    
    if (!env.ADMIN_USER || !hashedAdminPassword) {
        console.error('Admin credentials not configured');
        return null;
    }

    // Validate against environment variables with hashed password
    if (username === env.ADMIN_USER && verifyPassword(password, hashedAdminPassword)) {
        console.log('Admin validation successful');
        return {
            username: username,
            role: 'admin',
            sessionExp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        };
    }

    console.log('Admin validation failed');
    return null;
}

export function createSession(user: User): string {
    // Create a session token with expiration
    return jwt.sign(
        { 
            username: user.username, 
            role: user.role,
            sessionExp: user.sessionExp || Date.now() + (24 * 60 * 60 * 1000)
        },
        SESSION_SECRET,
        { expiresIn: SESSION_EXPIRY }
    );
}

export function verifySession(token: string): User | null {
    try {
        const decoded = jwt.verify(token, SESSION_SECRET) as User;
        
        // Check if session has expired
        if (decoded.sessionExp && decoded.sessionExp < Date.now()) {
            console.log('Session expired');
            return null;
        }
        
        return decoded;
    } catch (err) {
        console.error('Session verification failed:', err);
        return null;
    }
}

// Generate CSRF token
export function generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Verify CSRF token
export function verifyCsrfToken(token: string, storedToken: string): boolean {
    return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(storedToken)
    );
}

export async function requireAuth(request: Request, allowPublic: boolean = false): Promise<Response | null> {
    // Skip auth for public routes if allowed
    if (allowPublic) {
        return null;
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return json({ error: 'No authorization header' }, { status: 401 });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return json({ error: 'Invalid authorization header' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user) {
        return json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Verify CSRF token for non-GET requests
    if (request.method !== 'GET') {
        const csrfToken = request.headers.get('x-csrf-token');
        const storedCsrfToken = request.headers.get('x-csrf-token-verify');
        
        if (!csrfToken || !storedCsrfToken || !verifyCsrfToken(csrfToken, storedCsrfToken)) {
            return json({ error: 'Invalid CSRF token' }, { status: 403 });
        }
    }

    return null;
}
