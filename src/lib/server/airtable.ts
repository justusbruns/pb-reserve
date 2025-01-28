import Airtable from 'airtable';
import { env } from '$env/dynamic/private';

// Initialize Airtable base on the server side
const base = new Airtable({
    apiKey: env.AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base(env.AIRTABLE_BASE_ID);

// Helper function to format Airtable record
export function formatRecord(record: any) {
    return {
        id: record.id,
        ...record.fields
    };
}

// Helper function to handle Airtable errors
export function handleAirtableError(error: any) {
    console.error('Airtable error:', error);
    
    if (error.error === 'NOT_FOUND') {
        return { error: 'Resource not found', status: 404 };
    }
    if (error.error === 'INVALID_PERMISSIONS') {
        return { error: 'Permission denied', status: 403 };
    }
    
    return { error: 'Internal server error', status: 500 };
}

export { base };
