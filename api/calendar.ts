import type { VercelRequest, VercelResponse } from '@vercel/node';
import ical from 'ical-generator';
import base from './config.js';

const TABLE_NAME = 'Events';

async function getReservedEvents() {
    try {
        if (!process.env.VITE_AIRTABLE_PAT) {
            console.error('Missing environment variable: VITE_AIRTABLE_PAT');
            throw new Error('Airtable PAT not found in environment variables');
        }

        console.log('Starting to fetch reserved events from Airtable...');
        
        if (!base) {
            console.error('Airtable base is undefined');
            throw new Error('Failed to initialize Airtable base');
        }

        console.log('Base object:', {
            hasSelect: !!base(TABLE_NAME).select,
            baseId: base._airtable?._base || 'undefined'
        });
        
        const records = await base(TABLE_NAME)
            .select({
                filterByFormula: "{Status} = 'reserved'",
                fields: ['Event name', 'Starts at', 'Stops at', 'Location', 'Notes']
            })
            .all();

        console.log(`Found ${records.length} reserved events in Airtable`);
        
        if (!records.length) {
            console.log('No reserved events found in Airtable');
            return [];
        }

        return records.map(record => {
            const fields = record.fields;
            console.log('Processing record:', record.id, 'Fields:', fields);
            
            const event = {
                name: fields['Event name'] as string,
                start: new Date(fields['Starts at'] as string),
                end: new Date(fields['Stops at'] as string),
                location: fields['Location'] as string,
                description: fields['Notes'] as string
            };
            console.log('Processed event:', event.name, 'starting at:', event.start);
            return event;
        });
    } catch (error) {
        console.error('Error fetching reserved events:', error);
        throw error;
    }
}

async function generateCalendar() {
    try {
        const events = await getReservedEvents();
        console.log(`Starting calendar generation with ${events.length} events`);
        
        const calendar = ical({
            name: 'PB Reserve Events',
            timezone: 'Europe/Amsterdam',
            prodId: {
                company: 'PB Reserve',
                product: 'Events Calendar',
                language: 'EN'
            }
        });

        events.forEach(event => {
            calendar.createEvent({
                start: event.start,
                end: event.end,
                summary: event.name,
                location: event.location,
                description: event.description || '',
                url: 'https://pb-reserve.vercel.app'
            });
            console.log('Added event to calendar:', event.name);
        });

        return calendar;
    } catch (error) {
        console.error('Error generating calendar:', error);
        throw error;
    }
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    console.log('Calendar API handler called - v1.0.2');
    console.log('Request method:', request.method);
    console.log('Environment check - VITE_AIRTABLE_PAT:', process.env.VITE_AIRTABLE_PAT ? 'Set' : 'Not set');

    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Starting calendar generation process...');
        const calendar = await generateCalendar();
        
        response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        response.setHeader('Content-Disposition', 'attachment; filename="pb-reserve-events.ics"');
        response.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
        
        const calendarString = calendar.toString();
        console.log('Calendar generated successfully, sending response');
        
        return response.status(200).send(calendarString);
    } catch (error) {
        console.error('Error in calendar handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Detailed error:', errorMessage);
        
        return response.status(500).json({ 
            error: 'Failed to generate calendar',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}
