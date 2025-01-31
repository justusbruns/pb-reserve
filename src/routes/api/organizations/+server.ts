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

        // Get query parameters
        const id = url.searchParams.get('id');
        const view = url.searchParams.get('view');
        const filterByFormula = url.searchParams.get('filterByFormula');

        console.log('Attempting to fetch organizations from Airtable...');

        let query = base('Organizations').select();
        if (id) {
            const record = await base('Organizations').find(id);
            return json(formatRecord(record));
        }

        const records = await query.all();
        return json(records.map(formatRecord));
    } catch (err: any) {
        console.error('Error in GET /api/organizations:', err);
        return handleAirtableError(err);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        const record = await base('Organizations').create(data);
        return json(formatRecord(record));
    } catch (err: any) {
        console.error('Error in organizations POST:', err);
        return handleAirtableError(err);
    }
};

export const PATCH: RequestHandler = async ({ request, url }) => {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const data = await request.json();
        const record = await base('Organizations').update(id, data);
        return json(formatRecord(record));
    } catch (err: any) {
        console.error('Error in organizations PATCH:', err);
        return handleAirtableError(err);
    }
};

export const DELETE: RequestHandler = async ({ request, url }) => {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const deletedRecord = await base('Organizations').destroy(id);
        return json({ id: deletedRecord.id, deleted: true });
    } catch (err: any) {
        console.error('Error in organizations DELETE:', err);
        return handleAirtableError(err);
    }
};
