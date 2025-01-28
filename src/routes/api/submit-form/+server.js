import { json } from '@sveltejs/kit';
import { base } from '$lib/server/airtable';
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
            'contactPerson'
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
            'Email': formData.email,
            'Address': formData.address,
            'VAT NR': formData.vatNumber,
            'Postal code': formData.postalCode,
            'City': formData.city,
            'Country': formData.country
        };

        const organizationRecord = await base.Organizations.create(organizationData);
        console.log('Organization created:', organizationRecord.id);

        // Create person record
        console.log('Creating person...');
        const personData = {
            'Name': formData.contactPerson,
            'Mobile number': formData.phone,
            'Email': formData.email,
            'Organizations': [organizationRecord.id],
            'Type of person': 'Customer employee'
        };

        const personRecord = await base.Persons.create(personData);
        console.log('Person created:', personRecord.id);

        // Create event record
        console.log('Creating event...');
        const eventData = {
            'Event name': formData.eventName,
            'Starts at': formData.startDate,
            'Stops at': formData.endDate,
            'Languages': formData.selectedLanguages.join(', '),
            'Total Distance (km)': formData.calculatedDistance || 0,
            'Status': 'concept',
            'Location': `${formData.deliveryBusinessName}, ${formData.deliveryStreet}, ${formData.deliveryPostalCode} ${formData.deliveryCity}, ${formData.deliveryCountry}`,
            'Reserved by': [organizationRecord.id],
            'Contact person': [personRecord.id]
        };

        const eventRecord = await base.Events.create(eventData);
        console.log('Event created:', eventRecord.id);

        // Prepare order array with product IDs
        const orderArray = [
            'reced5JPzn1NAhTpw', // Poem Booth 1
            'recWtYRBAWR4k7i1G'  // Transport
        ];

        if (formData.printOption) {
            orderArray.push('recyFUdF9ocIBu22i'); // Printer 1
        }

        if (formData.themaAdded) {
            orderArray.push('recLNDdHVMnqaNkjs'); // Theme
        }

        if (formData.brandingAdded) {
            orderArray.push('recUFHJDY2tmzopCh'); // Branding
        }

        if (formData.getRoastedAdded) {
            orderArray.push('rec5RFM7APWsxnNLT'); // Roast
        }

        // Add extra language product if more than one language
        if (formData.selectedLanguages.length > 1) {
            orderArray.push('rec9c2M0Ve1WthmLY'); // Extra Language
        }

        if (formData.keynoteAdded) {
            orderArray.push('recz95xob9UOzdd6z'); // Keynote
        }

        // Add discount if coupon code is valid
        if (formData.couponCode === 'EVENTPARTNER') {
            orderArray.push('recAfS1ryMLkw9FuS'); // EVENTPARTNER discount
        } else if (formData.couponCode === 'EVENTSPECIALIST') {
            orderArray.push('recTN1wn6SzyP8f3N'); // EVENTSPECIALIST discount
        }

        // Create reservation record
        console.log('Creating reservation...');
        const reservationData = {
            'Event name': [eventRecord.id],
            'Order': orderArray
        };

        const reservationRecord = await base.Reservations.create(reservationData);
        console.log('Reservation created:', reservationRecord.id);

        return json({
            message: 'Form submitted successfully',
            organizationId: organizationRecord.id,
            personId: personRecord.id,
            eventId: eventRecord.id,
            reservationId: reservationRecord.id
        });

    } catch (error) {
        console.error('Error processing form submission:', error);
        return json({ 
            message: error.message || 'Internal Error',
            error: error.toString()
        }, { status: 500 });
    }
};
