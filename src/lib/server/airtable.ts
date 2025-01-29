import Airtable from 'airtable';
import { env } from '$env/dynamic/private';

// Helper function to check Airtable configuration
function checkAirtableConfig() {
    const required = ['AIRTABLE_PAT', 'AIRTABLE_BASE_ID'];
    const missing = required.filter(key => !env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required Airtable environment variables: ${missing.join(', ')}`);
    }
}

// Initialize Airtable base on the server side
function initializeAirtableBase() {
    checkAirtableConfig();
    return new Airtable({
        apiKey: env.AIRTABLE_PAT,
        endpointUrl: 'https://api.airtable.com'
    }).base(env.AIRTABLE_BASE_ID);
}

// Helper function to format a single Airtable record
export function formatRecord(record: any) {
    if (!record) return null;
    return {
        id: record.id,
        ...record.fields
    };
}

// Helper function to format multiple Airtable records
export function formatRecords(records: any[]) {
    if (!records) return [];
    return records.map(formatRecord).filter(Boolean);
}

// Helper function to handle Airtable errors
export function handleAirtableError(error: any) {
    console.error('Airtable error:', {
        message: error?.message || 'Unknown error',
        type: error?.error || 'Unknown',
        status: error?.statusCode || 500
    });
    
    if (error?.error === 'NOT_FOUND' || error?.statusCode === 404) {
        return { error: 'Resource not found', status: 404 };
    }
    if (error?.error === 'INVALID_PERMISSIONS' || error?.statusCode === 403) {
        return { error: 'Permission denied', status: 403 };
    }
    if (error?.error === 'AUTHENTICATION_REQUIRED' || error?.statusCode === 401) {
        return { error: 'Authentication required', status: 401 };
    }
    if (error?.error === 'INVALID_REQUEST' || error?.statusCode === 400) {
        return { error: 'Invalid request', status: 400 };
    }
    
    return { 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error',
        status: 500 
    };
}

// Export initialized base
export const base = initializeAirtableBase();
