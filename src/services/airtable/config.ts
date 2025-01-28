import Airtable from 'airtable';

let base: any = null;

function initializeAirtable() {
  if (!base && window.env?.AIRTABLE_PAT && window.env?.AIRTABLE_BASE_ID) {
    base = new Airtable({
      apiKey: window.env.AIRTABLE_PAT,
      endpointUrl: 'https://api.airtable.com'
    }).base(window.env.AIRTABLE_BASE_ID);

    // Test API connection
    setTimeout(async () => {
      try {
        const testResult = await base('Reservations').select({ maxRecords: 1 }).firstPage();
        console.log('Airtable connection test: Success');
        console.log('Using base ID:', window.env.AIRTABLE_BASE_ID);
      } catch (error) {
        console.error('Airtable connection test: Failed');
        console.error('Error details:', error.message);
      }
    }, 0);
  }
  return base;
}

// Initialize when the module is imported
if (typeof window !== 'undefined') {
  // If window.env is already available, initialize immediately
  if (window.env) {
    initializeAirtable();
  } else {
    // Otherwise wait for DOMContentLoaded
    window.addEventListener('DOMContentLoaded', () => {
      initializeAirtable();
    });
  }
}

export { base, initializeAirtable };