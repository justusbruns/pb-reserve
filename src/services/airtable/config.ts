import Airtable from 'airtable';

// Debug check for environment variables (will be removed after testing)
console.log('Environment Variables Check:');
console.log('VITE_AIRTABLE_BASE_ID:', import.meta.env.VITE_AIRTABLE_BASE_ID ? 'Set ' : 'Not set ');
console.log('VITE_AIRTABLE_PAT:', import.meta.env.VITE_AIRTABLE_PAT ? 'Set ' : 'Not set ');

// Configure Airtable with Personal Access Token
const AIRTABLE_BASE_ID = 'apphYtwSYRt7UDukL';  // Hardcoded for now until env var issue is fixed

const base = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com'
}).base(AIRTABLE_BASE_ID);

// Test API connection
setTimeout(async () => {
  try {
    const testResult = await base('Reservations').select({ maxRecords: 1 }).firstPage();
    console.log('Airtable connection test: Success ');
    console.log('Using base ID:', AIRTABLE_BASE_ID);
  } catch (error) {
    console.error('Airtable connection test: Failed ');
    console.error('Error details:', error.message);
  }
}, 1000);

export { base };