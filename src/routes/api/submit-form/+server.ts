import { json, type RequestHandler } from '@sveltejs/kit';
import { base } from '$lib/server/airtable';
import { requireAuth } from '$lib/server/auth';

interface FormData {
    eventName: string;
    startDate: string;
    endDate: string;
    accountName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    deliveryStreet: string;
    deliveryPostalCode: string;
    deliveryCity: string;
    deliveryCountry: string;
    contactPerson: string;
    deliveryBusinessName?: string;
    vatNumber?: string;
    poNumber?: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Check authentication first
        const authError = await requireAuth(request);
        if (authError) return authError;

        const data = await request.json() as FormData;
        
        // Required fields validation
        const requiredFields = [
            'eventName', 'startDate', 'endDate', 'accountName', 
            'email', 'phone', 'address', 'postalCode', 'city', 
            'country', 'deliveryStreet', 'deliveryPostalCode', 
            'deliveryCity', 'deliveryCountry', 'contactPerson'
        ];

        const missingFields = requiredFields.filter(field => !data[field as keyof FormData]);
        
        if (missingFields.length > 0) {
            return json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            }, { status: 400 });
        }

        // Create organization record
        const organizationResponse = await base('Organizations').create({
            fields: {
                Name: data.accountName,
                'Contact Person': data.contactPerson,
                Email: data.email,
                Phone: data.phone,
                'Street Address': data.address,
                'Postal Code': data.postalCode,
                City: data.city,
                Country: data.country,
                'VAT Number': data.vatNumber || '',
                'PO Number': data.poNumber || ''
            }
        });

        // Create person record
        const personResponse = await base('Persons').create({
            fields: {
                Name: data.contactPerson,
                Email: data.email,
                Phone: data.phone,
                Organization: [organizationResponse.id]
            }
        });

        // Create event record
        const eventResponse = await base('Events').create({
            fields: {
                Name: data.eventName,
                'Start Date': data.startDate,
                'End Date': data.endDate,
                Organization: [organizationResponse.id],
                'Contact Person': [personResponse.id]
            }
        });

        // Create reservation record
        const reservationResponse = await base('Reservations').create({
            fields: {
                Event: [eventResponse.id],
                Organization: [organizationResponse.id],
                'Contact Person': [personResponse.id],
                'Delivery Business Name': data.deliveryBusinessName || '',
                'Delivery Street': data.deliveryStreet,
                'Delivery Postal Code': data.deliveryPostalCode,
                'Delivery City': data.deliveryCity,
                'Delivery Country': data.deliveryCountry
            }
        });

        return json({
            organizationId: organizationResponse.id,
            personId: personResponse.id,
            eventId: eventResponse.id,
            reservationId: reservationResponse.id
        });

    } catch (error) {
        console.error('Error in form submission:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
