import { json } from '@sveltejs/kit';
import { base, formatRecord, handleAirtableError } from '$lib/server/airtable';

export async function GET({ url }) {
    try {
        const records = await base('Reservations').select().all();
        return json(records.map(formatRecord));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

export async function POST({ request }) {
    try {
        const data = await request.json();
        const record = await base('Reservations').create(data);
        return json(formatRecord(record));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

export async function PATCH({ request, url }) {
    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const data = await request.json();
        const record = await base('Reservations').update(id, data);
        return json(formatRecord(record));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        await base('Reservations').destroy(id);
        return json({ success: true });
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}
