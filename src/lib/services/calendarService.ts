import ical from 'ical-generator';
import { base } from '../../services/airtable/config';

const TABLE_NAME = 'Events';

export const calendarService = {
    async getReservedEvents() {
        try {
            console.log('Fetching reserved events from Airtable...');
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
            throw new Error('Failed to fetch events from Airtable');
        }
    },

    async generateCalendar() {
        try {
            const events = await this.getReservedEvents();
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
};
