import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendarService } from '../src/lib/services/calendarService';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const calendar = await calendarService.generateCalendar();
        
        response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        response.setHeader('Content-Disposition', 'attachment; filename="pb-reserve-events.ics"');
        response.setHeader('Cache-Control', 'public, max-age=3600');
        
        return response.status(200).send(calendar.toString());
    } catch (error) {
        console.error('Error generating calendar:', error);
        return response.status(500).json({ error: 'Failed to generate calendar' });
    }
}
