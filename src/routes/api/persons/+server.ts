import { json, error, type RequestHandler } from '@sveltejs/kit';
import { base, formatRecord, handleAirtableError } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ request, url }) => {
    // Check authentication first - this will throw if not authenticated
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        // Debug environment variables
        const envDebug = {
            AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set (length: ' + env.AIRTABLE_PAT.length + ')' : 'Not set',
            AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set (value: ' + env.AIRTABLE_BASE_ID + ')' : 'Not set'
        };
        console.log('Environment variables:', envDebug);

        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            console.error('Missing required environment variables');
            throw error(500, { message: 'Server configuration error' });
        }

        // Use the correct table name from Airtable
        const records = await base('People').select().all();
        console.log('Successfully fetched persons:', records.length);
        return json(records.map(formatRecord));
    } catch (err: any) {
        console.error('Error in GET /api/persons:', err);
        return handleAirtableError(err);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    // Check authentication first - this will throw if not authenticated
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        // Use the correct table name from Airtable
        const record = await base('People').create(data);
        return json(formatRecord(record));
    } catch (err: any) {
        console.error('Error in POST /api/persons:', err);
        return handleAirtableError(err);
    }
};
