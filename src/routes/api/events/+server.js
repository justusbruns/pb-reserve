import { json } from '@sveltejs/kit';
import { base, formatRecord, formatRecords, handleAirtableError } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    // Debug environment variables
    const envDebug = {
        AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set (length: ' + env.AIRTABLE_PAT.length + ')' : 'Not set',
        AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set (value: ' + env.AIRTABLE_BASE_ID + ')' : 'Not set'
    };
    console.log('Environment variables:', envDebug);

    try {
        if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
            throw new Error('Missing required environment variables');
        }

        // Get query parameters
        const id = url.searchParams.get('id');
        const view = url.searchParams.get('view');
        const filterByFormula = url.searchParams.get('filterByFormula');

        console.log('Attempting to fetch events from Airtable...');

        if (id) {
            // Get single record
            return new Promise((resolve, reject) => {
                base.Events.find(id, (err, record) => {
                    if (err) {
                        console.error('Error fetching event:', err);
                        reject(err);
                        return;
                    }
                    resolve(json(formatRecord(record)));
                });
            });
        } else {
            // Get all records with optional filter and view
            return new Promise((resolve, reject) => {
                const query = base.Events.select({
                    view: view || 'Grid view',
                    filterByFormula,
                    sort: [{ field: 'Starts at', direction: 'desc' }]
                });

                const records = [];
                query.eachPage(
                    function page(pageRecords, fetchNextPage) {
                        records.push(...pageRecords);
                        fetchNextPage();
                    },
                    function done(err) {
                        if (err) {
                            console.error('Error fetching events:', err);
                            reject(err);
                            return;
                        }
                        console.log('Successfully fetched events:', records.length);
                        resolve(json(formatRecords(records)));
                    }
                );
            }).catch(error => {
                console.error('Error in events endpoint:', error);
                return json(handleAirtableError(error), { status: error?.statusCode || 500 });
            });
        }
    } catch (error) {
        console.error('Error in events endpoint:', error);
        return json(handleAirtableError(error), { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const data = await request.json();
        return new Promise((resolve, reject) => {
            base.Events.create(data, (err, record) => {
                if (err) {
                    console.error('Error creating event:', err);
                    reject(err);
                    return;
                }
                resolve(json(formatRecord(record)));
            });
        }).catch(error => {
            console.error('Error in events POST:', error);
            return json(handleAirtableError(error), { status: error?.statusCode || 500 });
        });
    } catch (error) {
        console.error('Error in events POST:', error);
        return json(handleAirtableError(error), { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const data = await request.json();
        return new Promise((resolve, reject) => {
            base.Events.update(id, data, (err, record) => {
                if (err) {
                    console.error('Error updating event:', err);
                    reject(err);
                    return;
                }
                resolve(json(formatRecord(record)));
            });
        }).catch(error => {
            console.error('Error in events PATCH:', error);
            return json(handleAirtableError(error), { status: error?.statusCode || 500 });
        });
    } catch (error) {
        console.error('Error in events PATCH:', error);
        return json(handleAirtableError(error), { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, url }) {
    // Check authentication
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 });
        }

        return new Promise((resolve, reject) => {
            base.Events.destroy(id, (err, deletedRecord) => {
                if (err) {
                    console.error('Error deleting event:', err);
                    reject(err);
                    return;
                }
                resolve(json({ id: deletedRecord.id, deleted: true }));
            });
        }).catch(error => {
            console.error('Error in events DELETE:', error);
            return json(handleAirtableError(error), { status: error?.statusCode || 500 });
        });
    } catch (error) {
        console.error('Error in events DELETE:', error);
        return json(handleAirtableError(error), { status: 500 });
    }
}
