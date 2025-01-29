// Get environment variables from process.env or $env/dynamic/private
let envVars;
try {
    const { env } = await import('$env/dynamic/private');
    envVars = env;
    
    // Validate required environment variables
    if (!envVars.AIRTABLE_PAT) {
        throw new Error('AIRTABLE_PAT environment variable is not set');
    }
    if (!envVars.AIRTABLE_BASE_ID) {
        throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }
    
    console.log('Airtable environment variables loaded successfully');
} catch (error) {
    console.error('Error loading environment variables:', error);
    envVars = process.env;
}

// Debug log the environment variables
console.log('Initializing Airtable client with:', {
    AIRTABLE_PAT: envVars.AIRTABLE_PAT ? 'Set' : 'Not set',
    AIRTABLE_BASE_ID: envVars.AIRTABLE_BASE_ID ? 'Set' : 'Not set'
});

// Table IDs from Airtable
const TABLES = {
    Events: 'tblbE17oxiSW6dMRu',
    Reservations: 'tblcpzyw4RpwUqk8M',
    Organizations: 'tbl9a7ZWAlnu8BuCD',
    Persons: 'tblz3XLyxVLE35lw9',
    Products: 'tbl71K5MsJCD0goFZ',
    ProductGroups: 'tbl1Yze5UK4ORaICf',
    Availability: 'tbl0xNLbp0S7hzgvo',
    Configuration: 'tblotNICLMcUsCBrD'
};

// Helper function to make authenticated requests to Airtable
async function airtableRequest(endpoint, options = {}) {
    const baseUrl = 'https://api.airtable.com/v0';
    const url = `${baseUrl}/${envVars.AIRTABLE_BASE_ID}${endpoint}`;
    
    if (!envVars.AIRTABLE_PAT) {
        console.error('AIRTABLE_PAT is missing');
        throw new Error('AIRTABLE_PAT environment variable is not set');
    }

    if (!envVars.AIRTABLE_BASE_ID) {
        console.error('AIRTABLE_BASE_ID is missing');
        throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }
    
    console.log('Making Airtable request:', {
        url: url.replace(envVars.AIRTABLE_BASE_ID, '[BASE_ID]'),
        method: options.method || 'GET',
        endpoint,
        headers: options.headers ? Object.keys(options.headers) : undefined,
        body: options.body ? 'Present' : 'None'
    });
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${envVars.AIRTABLE_PAT}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'Could not parse error response' };
            }

            console.error('Airtable request failed:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                endpoint,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            throw new Error(
                errorData?.error?.message || 
                `Airtable request failed: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        console.log('Airtable response successful:', {
            endpoint,
            recordCount: Array.isArray(data.records) ? data.records.length : 'N/A',
            dataKeys: Object.keys(data)
        });
        return data;
    } catch (error) {
        console.error('Error making Airtable request:', {
            error: error.message,
            name: error.name,
            stack: error.stack,
            endpoint
        });
        throw error;
    }
}

// Base class to handle table operations
class Table {
    constructor(tableName) {
        if (!TABLES[tableName]) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
        this.tableName = TABLES[tableName];
        console.log(`Initialized table: ${tableName} with ID: ${this.tableName}`);
    }

    async create(fields) {
        console.log(`Creating record in ${this.tableName}:`, fields);
        return airtableRequest(`/${this.tableName}`, {
            method: 'POST',
            body: JSON.stringify({ fields })
        });
    }

    async find(recordId) {
        console.log(`Finding record ${recordId} in ${this.tableName}`);
        return airtableRequest(`/${this.tableName}/${recordId}`);
    }

    async select(params = {}) {
        console.log(`Selecting records from ${this.tableName}:`, params);
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `/${this.tableName}${queryParams ? `?${queryParams}` : ''}`;
        const response = await airtableRequest(endpoint);
        return response.records || [];
    }

    async update(recordId, fields) {
        console.log(`Updating record ${recordId} in ${this.tableName}:`, fields);
        return airtableRequest(`/${this.tableName}/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({ fields })
        });
    }

    async destroy(recordId) {
        console.log(`Deleting record ${recordId} from ${this.tableName}`);
        return airtableRequest(`/${this.tableName}/${recordId}`, {
            method: 'DELETE'
        });
    }

    async all() {
        return this.select();
    }
}

// Export base with table functions
export const base = {
    Organizations: new Table('Organizations'),
    Persons: new Table('Persons'),
    Events: new Table('Events'),
    Reservations: new Table('Reservations'),
    Products: new Table('Products'),
    ProductGroups: new Table('ProductGroups'),
    Availability: new Table('Availability'),
    Configuration: new Table('Configuration')
};

// Helper functions
export function formatRecord(record) {
    if (!record) {
        console.warn('Attempted to format null/undefined record');
        return null;
    }
    return {
        id: record.id,
        ...record.fields
    };
}

export function formatRecords(records) {
    if (!Array.isArray(records)) {
        console.warn('formatRecords received non-array input:', records);
        return [];
    }
    return records.map(formatRecord).filter(Boolean);
}

export function handleAirtableError(error) {
    console.error('Handling Airtable error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
    });
    
    if (error.message.includes('AIRTABLE_PAT')) {
        return {
            error: 'Airtable authentication error. Please check your environment variables.',
            status: 500
        };
    }
    
    if (error.message.includes('not found')) {
        return {
            error: 'Resource not found',
            status: 404
        };
    }
    
    return {
        error: error.message || 'Internal server error',
        status: 500
    };
}
