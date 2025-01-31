import { json, error, type RequestHandler } from '@sveltejs/kit';
import { base, formatRecord, formatRecords, handleAirtableError } from '$lib/server/airtable';
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

        const records = await base('Events').select().all();
        console.log('Successfully fetched events:', records.length);
        return json(records.map(formatRecord));
    } catch (err: any) {
        console.error('Error in GET /api/events:', err);
        return handleAirtableError(err);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    // Check authentication first - this will throw if not authenticated
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        const record = await base('Events').create(data);
        return json(formatRecord(record));
    } catch (err: any) {
        console.error('Error in POST /api/events:', err);
        return handleAirtableError(err);
    }
};

export const PATCH: RequestHandler = async ({ request, url }) => {
    // Check authentication first - this will throw if not authenticated
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            throw error(400, { message: 'Missing event ID' });
        }

        const data = await request.json();
        const record = await base('Events').update(id, data);
        return json(formatRecord(record));
    } catch (err) {
        console.error('Error in PATCH /api/events:', err);
        throw error(500, { message: 'Failed to update event' });
    }
};

export const DELETE: RequestHandler = async ({ request, url }) => {
    // Check authentication first - this will throw if not authenticated
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            throw error(400, { message: 'Missing event ID' });
        }

        await base('Events').destroy(id);
        return json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/events:', err);
        throw error(500, { message: 'Failed to delete event' });
    }
};
