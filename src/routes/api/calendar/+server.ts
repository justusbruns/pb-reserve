import { calendarService } from '$lib/services/calendarService';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    try {
        const calendar = await calendarService.generateCalendar();
        
        return new Response(calendar.toString(), {
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
