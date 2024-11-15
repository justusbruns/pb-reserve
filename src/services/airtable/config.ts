import Airtable from 'airtable';

Airtable.configure({
  apiKey: import.meta.env.VITE_AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

export const base = Airtable.base('apphYtwSYRt7UDukL');