import { json, type RequestEvent } from '@sveltejs/kit';
import { base, formatRecord, formatRecords } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';

export async function GET({ url }: RequestEvent) {
    console.log('GET /api/products called');
    
    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        console.log('Attempting to fetch products from Airtable...');
        const records = await base.Products.select();
        console.log('Successfully fetched products:', records.length);
        return json(formatRecords(records));
    } catch (error) {
        console.error('Error in /api/products:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined
        });

        return json({
            error: error instanceof Error ? error.message : 'Unknown error',
            type: error instanceof Error ? error.name : 'Unknown',
            details: error instanceof Error ? error.stack?.split('\n')[0] : 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}

export async function POST({ request }: RequestEvent) {
    try {
        const data = await request.json();
        const record = await base.Products.create(data);
        return json(formatRecord(record));
    } catch (error) {
        console.error('Error in POST /api/products:', error);
        return json({
            error: error instanceof Error ? error.message : 'Unknown error',
            type: error instanceof Error ? error.name : 'Unknown',
            details: error instanceof Error ? error.stack?.split('\n')[0] : 'No stack trace available'
        }, { 
            status: 500 
        });
    }
}
