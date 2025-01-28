import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Get an API token for authenticated client requests
 * This endpoint should be protected by session authentication in production
 */
export async function GET() {
    return json({ token: env.API_TOKEN });
}
