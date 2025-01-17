import Airtable from 'airtable';

const AIRTABLE_BASE_ID = 'apphYtwSYRt7UDukL';

if (!process.env.VITE_AIRTABLE_PAT) {
    throw new Error('VITE_AIRTABLE_PAT environment variable is not set');
}

const base = new Airtable({
    apiKey: process.env.VITE_AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base(AIRTABLE_BASE_ID);

export default base;
