// Get environment variables from process.env or $env/dynamic/private
let envVars;
try {
    const { env } = await import('$env/dynamic/private');
    envVars = env;
} catch (error) {
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
    
    console.log('Making Airtable request:', {
        url,
        method: options.method || 'GET',
        headers: {
            'Authorization': 'Bearer [PAT]', // Don't log the actual token
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${envVars.AIRTABLE_PAT}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Airtable request failed:', {
            status: response.status,
            statusText: response.statusText,
            error
        });
        throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();
    console.log('Airtable response:', data);
    return data;
}

// Base class to handle table operations
class Table {
    constructor(tableName) {
        this.tableName = TABLES[tableName];
        console.log(`Initialized table: ${tableName} with ID: ${this.tableName}`);
    }

    async create(fields) {
        console.log(`Creating record in ${this.tableName}:`, fields);
        const response = await airtableRequest(`/${this.tableName}`, {
            method: 'POST',
            body: JSON.stringify({
                records: [{
                    fields
                }]
            })
        });
        return response.records[0];
    }

    async destroy(recordId) {
        console.log(`Deleting record ${recordId} from ${this.tableName}`);
        return airtableRequest(`/${this.tableName}/${recordId}`, {
            method: 'DELETE'
        });
    }

    async find(recordId) {
        console.log(`Finding record ${recordId} in ${this.tableName}`);
        return airtableRequest(`/${this.tableName}/${recordId}`);
    }

    async select(params = {}) {
        console.log(`Selecting records from ${this.tableName}:`, params);
        const queryParams = new URLSearchParams();
        
        if (params.maxRecords) {
            queryParams.append('maxRecords', params.maxRecords);
        }
        if (params.view) {
            queryParams.append('view', params.view);
        }
        if (params.filterByFormula) {
            queryParams.append('filterByFormula', params.filterByFormula);
        }
        if (params.sort) {
            queryParams.append('sort', JSON.stringify(params.sort));
        }
        if (params.offset) {
            queryParams.append('offset', params.offset);
        }

        const queryString = queryParams.toString();
        return airtableRequest(`/${this.tableName}${queryString ? `?${queryString}` : ''}`);
    }

    async update(recordId, fields) {
        console.log(`Updating record ${recordId} in ${this.tableName}:`, fields);
        const response = await airtableRequest(`/${this.tableName}/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                fields
            })
        });
        return response;
    }

    async createBatch(records) {
        console.log(`Creating batch records in ${this.tableName}:`, records);
        const response = await airtableRequest(`/${this.tableName}`, {
            method: 'POST',
            body: JSON.stringify({
                records: records.map(fields => ({ fields }))
            })
        });
        return response.records;
    }

    async updateBatch(records) {
        console.log(`Updating batch records in ${this.tableName}:`, records);
        const response = await airtableRequest(`/${this.tableName}`, {
            method: 'PATCH',
            body: JSON.stringify({
                records: records.map(({ id, fields }) => ({
                    id,
                    fields
                }))
            })
        });
        return response.records;
    }

    async destroyBatch(recordIds) {
        console.log(`Deleting batch records from ${this.tableName}:`, recordIds);
        const queryParams = new URLSearchParams();
        recordIds.forEach(id => queryParams.append('records[]', id));
        return airtableRequest(`/${this.tableName}?${queryParams.toString()}`, {
            method: 'DELETE'
        });
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
    Configuration: new Table('Configuration'),
};

// Helper functions
export function formatRecord(record) {
    if (!record) return null;
    return {
        id: record.id,
        ...record.fields
    };
}

export function formatRecords(records) {
    return records.map(formatRecord);
}

export function handleAirtableError(error) {
    console.error('Airtable error:', error);
    
    if (error.error === 'NOT_FOUND') {
        return json({ error: 'Record not found' }, { status: 404 });
    }
    
    if (error.error === 'INVALID_PERMISSIONS') {
        return json({ error: 'Invalid permissions' }, { status: 403 });
    }
    
    if (error.error === 'AUTHENTICATION_REQUIRED') {
        return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return json({ error: 'Internal server error' }, { status: 500 });
}
