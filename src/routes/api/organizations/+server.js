import { json } from '@sveltejs/kit';
import { base, formatRecord, formatRecords, handleAirtableError } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/auth';

export async function GET({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;
    
    console.log('GET /api/organizations called');
    
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

        console.log('Attempting to fetch organizations from Airtable...');
        const records = await base.Organizations.select();
        console.log('Successfully fetched organizations:', records.length);
        return json(formatRecords(records));
    } catch (error) {
        console.error('Error in /api/organizations:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        // Return more detailed error information
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
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        const record = await base.Organizations.create(data);
        return json(formatRecord(record));
    } catch (error) {
        console.error('Error in POST /api/organizations:', error);
        return json({
            error: error.message,
            type: error.name,
            details: error.stack?.split('\n')[0] || 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}
