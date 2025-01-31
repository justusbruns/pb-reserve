import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { validateSession } from './routes/api/auth/+server';
import { env } from '$env/dynamic/private';

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

// Enhanced IP detection
const getClientIp = (request: Request): string => {
    return request.headers.get('cf-connecting-ip') || 
           request.headers.get('x-real-ip') ||
           request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           'unknown';
};

// Rate limiting middleware
const rateLimit: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/api/')) {
        const ip = getClientIp(event.request);
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
            return new Response('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil((RATE_LIMIT_WINDOW - (now - rateLimit.timestamp)) / 1000).toString(),
                    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(rateLimit.timestamp + RATE_LIMIT_WINDOW).toUTCString()
                }
            });
        }
    }
    
    return await resolve(event);
};

// Authentication middleware
const authenticate: Handle = async ({ event, resolve }) => {
    const sessionToken = event.cookies.get('session');
    const user = sessionToken ? await validateSession(sessionToken) : null;
    event.locals.user = user || 'anonymous';
    event.locals.hasSessionCookie = !!sessionToken;

    // Log authentication attempt without sensitive data
    console.log('[%s] %s { user: %s, hasSessionCookie: %s }',
        event.request.method,
        event.url.pathname,
        event.locals.user,
        event.locals.hasSessionCookie
    );

    return await resolve(event);
};

// Security headers middleware
const securityHeaders: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    
    // Set security headers
    const securityHeadersMap = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.mapbox.com",
            "connect-src 'self' https://*.mapbox.com https://api.airtable.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ')
    };

    // Create new response with all headers
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers({
            ...Object.fromEntries(response.headers.entries()),
            ...securityHeadersMap,
            ...(event.url.pathname.startsWith('/api/') ? {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            } : {})
        })
    });
};

// Apply middlewares in sequence
export const handle = sequence(rateLimit, authenticate, securityHeaders);
