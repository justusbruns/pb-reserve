import { json } from '@sveltejs/kit';
import { base, formatRecord, handleAirtableError } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        // Get query parameters
        const id = url.searchParams.get('id');
        const view = url.searchParams.get('view');
        const filterByFormula = url.searchParams.get('filterByFormula');

        let query = base('Events');

        if (id) {
            // Get single record
            const record = await query.find(id);
            return json(formatRecord(record));
        } else if (view) {
            // Get records from specific view
            const records = await query
                .select({
                    view,
                    sort: [{ field: 'Starts at', direction: 'asc' }]
                })
                .all();
            return json(records.map(formatRecord));
        } else {
            // Get all records with optional filter
            const records = await query
                .select({
                    filterByFormula,
                    sort: [{ field: 'Starts at', direction: 'desc' }]
                })
                .all();
            return json(records.map(formatRecord));
        }
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        const record = await base('Events').create(data);
        return json(formatRecord(record));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing event ID' }, { status: 400 });
        }

        const data = await request.json();
        const record = await base('Events').update([{ id, fields: data }]);
        return json(formatRecord(record[0]));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing event ID' }, { status: 400 });
        }

        const record = await base('Events').destroy([id]);
        return json(formatRecord(record[0]));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}
