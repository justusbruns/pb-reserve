import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'security-headers',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					// Set security headers
					res.setHeader('X-Frame-Options', 'DENY');
					res.setHeader('X-Content-Type-Options', 'nosniff');
					res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
					res.setHeader('X-XSS-Protection', '1; mode=block');
					res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

					// Set CSP
					const cspDirectives = [
						"default-src 'self'",
						"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
						"style-src 'self' 'unsafe-inline'",
						"img-src 'self' data: https://*.mapbox.com",
						"connect-src 'self' https://*.mapbox.com https://api.airtable.com",
						"frame-ancestors 'none'",
						"base-uri 'self'",
						"form-action 'self'"
					];
					res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

					// Set cache control for API requests
					if (req.url?.startsWith('/api/')) {
						res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
						res.setHeader('Pragma', 'no-cache');
						res.setHeader('Expires', '0');
					}

					next();
				});
			}
		}
	]
});
