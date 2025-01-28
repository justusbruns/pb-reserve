import { json } from '@sveltejs/kit';

export async function GET() {
    return json({ message: 'Test endpoint working' }, {
        headers: {
            'content-type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}
