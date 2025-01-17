import Airtable from 'airtable';

const AIRTABLE_BASE_ID = 'apphYtwSYRt7UDukL';

if (!process.env.VITE_AIRTABLE_PAT) {
    console.error('Missing required environment variable: VITE_AIRTABLE_PAT');
    throw new Error('VITE_AIRTABLE_PAT environment variable is not set');
}

const airtable = new Airtable({
    apiKey: process.env.VITE_AIRTABLE_PAT
});

const base = airtable.base(AIRTABLE_BASE_ID);

// Verify the connection
try {
    console.log('Initializing Airtable connection...');
    console.log('Base ID:', AIRTABLE_BASE_ID);
    console.log('API Key present:', !!process.env.VITE_AIRTABLE_PAT);
} catch (error) {
    console.error('Error initializing Airtable:', error);
    throw error;
}

export default base;
