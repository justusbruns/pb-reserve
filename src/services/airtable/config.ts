import Airtable from 'airtable';

export const base = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_PAT,
}).base('apphYtwSYRt7UDukL');