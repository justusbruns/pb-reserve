import { json } from '@sveltejs/kit';
import { base, formatRecord, formatRecords, handleAirtableError } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    // Debug environment variables
    const envDebug = {
        AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set (length: ' + env.AIRTABLE_PAT.length + ')' : 'Not set',
        AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set (value: ' + env.AIRTABLE_BASE_ID + ')' : 'Not set'
    };
    console.log('Environment variables:', envDebug);

    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        // Get query parameters
        const id = url.searchParams.get('id');
        const view = url.searchParams.get('view');
        const filterByFormula = url.searchParams.get('filterByFormula');

        console.log('Attempting to fetch events from Airtable...');

        if (id) {
            // Get single record
            const record = await base.Events.find(id);
            return json(formatRecord(record));
        } else if (view) {
            // Get records from specific view
            const records = await base.Events
                .select({
                    view,
                    sort: [{ field: 'Starts at', direction: 'asc' }]
                })
                .all();
            console.log('Successfully fetched events:', records.length);
            return json(formatRecords(records));
        } else {
            // Get all records with optional filter
            const records = await base.Events
                .select({
                    filterByFormula,
                    sort: [{ field: 'Starts at', direction: 'desc' }]
                })
                .all();
            console.log('Successfully fetched events:', records.length);
            return json(formatRecords(records));
        }
    } catch (error) {
        console.error('Error in /api/events:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        const data = await request.json();
        const record = await base.Events.create(data);
        return json(formatRecord(record));
    } catch (error) {
        console.error('Error in POST /api/events:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing event ID' }, { status: 400 });
        }

        const data = await request.json();
        const record = await base.Events.update([{ id, fields: data }]);
        return json(formatRecord(record[0]));
    } catch (error) {
        console.error('Error in PATCH /api/events:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing event ID' }, { status: 400 });
        }

        const record = await base.Events.destroy([id]);
        return json(formatRecord(record[0]));
    } catch (error) {
        console.error('Error in DELETE /api/events:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}
