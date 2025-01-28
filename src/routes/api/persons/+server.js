import { json } from '@sveltejs/kit';
import { base, formatRecord, handleAirtableError } from '$lib/server/airtable';

export async function GET({ url }) {
    try {
        const records = await base('Persons').select().all();
        return json(records.map(formatRecord));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}

export async function POST({ request }) {
    try {
        const data = await request.json();
        const record = await base('Persons').create(data);
        return json(formatRecord(record));
    } catch (error) {
        const { error: errorMessage, status } = handleAirtableError(error);
        return json({ error: errorMessage }, { status });
    }
}
