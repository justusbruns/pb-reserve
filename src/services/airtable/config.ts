import Airtable from 'airtable';

console.log('Airtable API Key:', import.meta.env.VITE_AIRTABLE_PAT); // Add this line for debugging

// Configure Airtable with Personal Access Token
const base = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com'
}).base('apphYtwSYRt7UDukL');

export { base };