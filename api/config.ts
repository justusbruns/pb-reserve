import Airtable from 'airtable';

const AIRTABLE_BASE_ID = 'apphYtwSYRt7UDukL';

const base = new Airtable({
    apiKey: process.env.VITE_AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base(AIRTABLE_BASE_ID);

export { base };
