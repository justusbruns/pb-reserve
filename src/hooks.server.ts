import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { validateSession } from './routes/api/auth/+server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// Clean up old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now - value.timestamp > RATE_LIMIT_WINDOW) {
            requestCounts.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW);

// Rate limiting middleware
const rateLimit: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/api/')) {
        const ip = event.request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        const rateLimit = requestCounts.get(ip) || { count: 0, timestamp: now };
        
        // Reset count if window has passed
        if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
            rateLimit.count = 0;
            rateLimit.timestamp = now;
        }
        
        rateLimit.count++;
        requestCounts.set(ip, rateLimit);
        
        if (rateLimit.count > MAX_REQUESTS) {
            return new Response('Too Many Requests', { status: 429 });
        }
    }
    
    return await resolve(event);
};

// Authentication middleware
const authenticate: Handle = async ({ event, resolve }) => {
    // Skip auth for login endpoint and non-API routes
    if (event.url.pathname === '/api/auth' && event.request.method === 'POST') {
        return await resolve(event);
    }
    
    if (event.url.pathname.startsWith('/api/')) {
        // Validate session for all API endpoints
        if (!validateSession(event.request)) {
            return new Response('Unauthorized', { status: 401 });
        }
    }
    
    return await resolve(event);
};

// Apply middlewares in sequence
export const handle = sequence(rateLimit, authenticate);
