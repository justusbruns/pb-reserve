import type { APIRoute } from 'astro';
import { calendarService } from '../../services/calendarService';

export const get: APIRoute = async ({ request }) => {
    try {
        const calendar = await calendarService.generateCalendar();
        
        return new Response(calendar.toString(), {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="pb-reserve-events.ics"',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error generating calendar:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate calendar' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
