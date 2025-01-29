import { json } from '@sveltejs/kit';
import { base, formatRecord, formatRecords } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';

export async function GET({ url }) {
    console.log('GET /api/persons called');
    
    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        console.log('Attempting to fetch persons from Airtable...');
        const records = await base.Persons.select();
        console.log('Successfully fetched persons:', records.length);
        return json(formatRecords(records));
    } catch (error) {
        console.error('Error in /api/persons:', {
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

export async function POST({ request }) {
    try {
        const data = await request.json();
        const record = await base.Persons.create(data);
        return json(formatRecord(record));
    } catch (error) {
        console.error('Error in POST /api/persons:', error);
        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}
