import { VercelRequest, VercelResponse } from '@vercel/node';
import { calendarService } from '../src/services/calendarService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const calendar = await calendarService.generateCalendar();
        
        // Set headers for calendar content
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="pb-reserve-events.ics"');
        
        // Set cache control headers (cache for 1 hour)
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Send calendar content
        res.send(calendar.toString());
    } catch (error) {
        console.error('Error generating calendar:', error);
        res.status(500).json({ error: 'Failed to generate calendar' });
    }
}
