import type { VercelRequest, VercelResponse } from '@vercel/node';
import ical from 'ical-generator';
import base from './config.js';

const TABLE_NAME = 'Events';

async function getReservedEvents() {
    try {
        if (!process.env.VITE_AIRTABLE_PAT) {
            throw new Error('Airtable PAT not found in environment variables');
        }

        console.log('Fetching reserved events from Airtable...');
        console.log('Using base ID:', base._airtable._base);
        
        const records = await base(TABLE_NAME)
            .select({
                filterByFormula: "{Status} = 'reserved'",
                fields: ['Event name', 'Starts at', 'Stops at', 'Location', 'Notes']
            })
            .all();

        console.log(`Found ${records.length} reserved events`);
        
        if (!records.length) {
            console.log('No reserved events found');
            return [];
        }

        return records.map(record => {
            const event = {
                name: record.fields['Event name'] as string,
                start: new Date(record.fields['Starts at'] as string),
                end: new Date(record.fields['Stops at'] as string),
                location: record.fields['Location'] as string,
                description: record.fields['Notes'] as string
            };
            console.log('Processed event:', event.name);
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
        console.log(`Generating calendar with ${events.length} events`);
        
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
    console.log('Calendar API handler called');
    console.log('Request method:', request.method);
    console.log('Environment check - VITE_AIRTABLE_PAT:', process.env.VITE_AIRTABLE_PAT ? 'Set' : 'Not set');

    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Starting calendar generation...');
        const calendar = await generateCalendar();
        
        response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        response.setHeader('Content-Disposition', 'attachment; filename="pb-reserve-events.ics"');
        response.setHeader('Cache-Control', 'public, max-age=3600');
        
        const calendarString = calendar.toString();
        console.log('Calendar generated successfully');
        
        return response.status(200).send(calendarString);
    } catch (error) {
        console.error('Error in calendar handler:', error);
        return response.status(500).json({ 
            error: 'Failed to generate calendar',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
