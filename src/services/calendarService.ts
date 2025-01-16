import ical from 'ical-generator';
import { base } from './airtable/config';

const TABLE_NAME = 'Events';

export const calendarService = {
    async getReservedEvents() {
        try {
            const records = await base(TABLE_NAME)
                .select({
                    filterByFormula: "{Status} = 'reserved'",
                    fields: ['Event name', 'Starts at', 'Stops at', 'Location', 'Notes']
                })
                .all();

            return records.map(record => ({
                name: record.fields['Event name'] as string,
                start: new Date(record.fields['Starts at'] as string),
                end: new Date(record.fields['Stops at'] as string),
                location: record.fields['Location'] as string,
                description: record.fields['Notes'] as string
            }));
        } catch (error) {
            console.error('Error fetching reserved events:', error);
            throw error;
        }
    },

    async generateCalendar() {
        const events = await this.getReservedEvents();
        
        const calendar = ical({
            name: 'PB Reserve Events',
            timezone: 'Europe/Amsterdam'
        });

        events.forEach(event => {
            calendar.createEvent({
                start: event.start,
                end: event.end,
                summary: event.name,
                location: event.location,
                description: event.description
            });
        });

        return calendar;
    }
};
