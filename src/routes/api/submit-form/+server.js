import { json } from '@sveltejs/kit';
import { base, formatRecord, handleAirtableError } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        // Check authentication first
        const authError = await requireAuth(request);
        if (authError) return authError;

        const formData = await request.json();
        console.log('Received form data:', JSON.stringify(formData, null, 2));

        // Validate required fields
        const requiredFields = [
            'eventName',
            'startDate',
            'endDate',
            'accountName',
            'email',
            'phone',
            'address',
            'postalCode',
            'city',
            'country',
            'deliveryStreet',
            'deliveryPostalCode',
            'deliveryCity',
            'deliveryCountry',
            'destinationCoordinates'
        ];

        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return json({ 
                error: 'Missing required fields', 
                fields: missingFields 
            }, { status: 400 });
        }

        // Create organization record first
        console.log('Creating organization...');
        const organizationData = {
            'Name organization': formData.accountName,
            'Address': formData.address,
            'Postal code': formData.postalCode,
            'City': formData.city,
            'Country': formData.country,
            'Contact person': formData.accountName,
            'Email': formData.email,
            'Phone': formData.phone
        };

        const organizationRecord = await base('Organizations').create(formatRecord(organizationData));
        console.log('Organization created:', organizationRecord.id);

        // Create reservation record
        console.log('Creating reservation...');
        const reservationData = {
            'Organization': [organizationRecord.id],
            'Event name': formData.eventName,
            'Start date': formData.startDate,
            'End date': formData.endDate,
            'Event days': formData.eventDays || 1,
            'Languages': formData.selectedLanguages,
            'Print option': formData.printOption || false,
            'Coupon code': formData.couponCode || '',
            'Delivery business name': formData.deliveryBusinessName || '',
            'Delivery street': formData.deliveryStreet,
            'Delivery postal code': formData.deliveryPostalCode,
            'Delivery city': formData.deliveryCity,
            'Delivery country': formData.deliveryCountry,
            'Destination coordinates': formData.destinationCoordinates,
            'Distance (km)': formData.calculatedDistance || 0,
            'Transport fee': formData.transportFee || 0,
            'Total price': formData.totalPrice || 0,
            'Status': 'New'
        };

        const reservationRecord = await base('Reservations').create(formatRecord(reservationData));
        console.log('Reservation created:', reservationRecord.id);

        return json({
            message: 'Form submitted successfully',
            organizationId: organizationRecord.id,
            reservationId: reservationRecord.id
        });

    } catch (error) {
        console.error('Error processing form submission:', error);
        return handleAirtableError(error);
    }
};
