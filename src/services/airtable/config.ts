import Airtable from 'airtable';

let base: any = null;

function initializeAirtable() {
  if (!base && window.env?.AIRTABLE_PAT && window.env?.AIRTABLE_BASE_ID) {
    const config = {
      apiKey: window.env.AIRTABLE_PAT,
      endpointUrl: 'https://api.airtable.com'
    };

    // Test API connection only in development
    if (process.env.NODE_ENV === 'development') {
      base = new Airtable(config).base(window.env.AIRTABLE_BASE_ID);
      base('Reservations').select({ maxRecords: 1 }).firstPage().then(() => {
        console.log('Airtable connection test: Success');
      }).catch((error) => {
        console.error('Airtable connection test: Failed');
        console.error('Error details:', error.message);
      });
    } else {
      base = new Airtable(config).base(window.env.AIRTABLE_BASE_ID);
    }
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