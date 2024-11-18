import Airtable from 'airtable';

// Configure Airtable with Personal Access Token
const base = new Airtable({
  apiKey: process.env.VITE_AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com'
}).base('apphYtwSYRt7UDukL');

export { base };