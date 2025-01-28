import Airtable from 'airtable';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Airtable
const base = new Airtable({
    apiKey: process.env.AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base(process.env.AIRTABLE_BASE_ID);

// Mock form data
const mockFormData = {
    accountName: 'Test Company',
    address: 'Test Street 123',
    postalCode: '1234 AB',
    city: 'Amsterdam',
    country: 'Netherlands',
    vatNumber: 'NL123456789B01',
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    contactPhone: '+31612345678',
    eventName: 'Test Event',
    startDate: '2025-02-01',
    endDate: '2025-02-01',
    startTime: '09:00',
    endTime: '17:00',
    selectedLanguages: ['Dutch', 'English'],  // Updated to match allowed values
    brandingAdded: true,
    themaAdded: true,
    getRoastedAdded: true,
    totalDistance: 50,
    deliveryBusinessName: 'Delivery Company',
    deliveryStreet: 'Delivery Street 456',
    deliveryPostalCode: '5678 CD',
    deliveryCity: 'Rotterdam',
    deliveryCountry: 'Netherlands',
    couponCode: 'EVENTPARTNER'
};

async function listTableFields(tableName) {
    try {
        console.log(`\nListing fields for table: ${tableName}`);
        const records = await base(tableName).select({ maxRecords: 1 }).all();
        if (records.length > 0) {
            const fields = Object.keys(records[0].fields);
            console.log('Fields:', fields);
        } else {
            console.log('No records found to inspect fields');
        }
    } catch (error) {
        console.error(`Error listing fields for ${tableName}:`, error);
    }
}

async function testFullFlow() {
    try {
        console.log('Starting full flow test...\n');

        // First, list fields for each table
        await listTableFields('Organizations');
        await listTableFields('Persons');
        await listTableFields('Events');
        await listTableFields('Reservations');

        // 1. Create Organization
        console.log('Creating organization...');
        const organizationRecord = await base('Organizations').create({
            'Name organization': mockFormData.accountName,
            'Account name': mockFormData.accountName,
            'Email': mockFormData.contactEmail,
            'Address': mockFormData.address,
            'Postal code': mockFormData.postalCode,
            'City': mockFormData.city,
            'Country': mockFormData.country,
            'VAT NR': mockFormData.vatNumber,
            'Legal Type': 'Commercial'
        });
        console.log(`Created organization with ID: ${organizationRecord.id}\n`);

        // 2. Create Event (without person for now)
        console.log('Creating event...');
        const formattedDeliveryAddress = [
            mockFormData.deliveryBusinessName,
            mockFormData.deliveryStreet,
            `${mockFormData.deliveryPostalCode} ${mockFormData.deliveryCity}`,
            mockFormData.deliveryCountry
        ].filter(Boolean).join(', ');

        const eventRecord = await base('Events').create({
            'Event name': mockFormData.eventName,
            'Starts at': `${mockFormData.startDate}T${mockFormData.startTime}:00.000Z`,
            'Stops at': `${mockFormData.endDate}T${mockFormData.endTime}:00.000Z`,
            'Reserved by': [organizationRecord.id],
            'Languages': mockFormData.selectedLanguages.join(', '),
            'Location': formattedDeliveryAddress,
            'Total Distance (km)': mockFormData.totalDistance,
            'Status': 'concept',
            'Payment status': 'Proposal requested',
            'Outside / Inside': '🏠 Inside'
        });
        console.log(`Created event with ID: ${eventRecord.id}\n`);

        // Create reservations for each product
        const products = [
            { name: 'Base Poem Booth', orderId: 'reced5JPzn1NAhTpw' },
            mockFormData.brandingAdded && { name: 'Branding', orderId: 'recUFHJDY2tmzopCh' },
            mockFormData.themaAdded && { name: 'Theme', orderId: 'recLNDdHVMnqaNkjs' },
            mockFormData.getRoastedAdded && { name: 'Get Roasted', orderId: 'rec5RFM7APWsxnNLT' }
        ].filter(Boolean);

        for (const product of products) {
            const reservationRecord = await base('Reservations').create({
                'Event name': [eventRecord.id],
                'Order': [product.orderId]
            });
            console.log(`Created reservation for ${product.name} with ID: ${reservationRecord.id}`);
        }

        // Create transport reservation
        const transportRecord = await base('Reservations').create({
            'Event name': [eventRecord.id],
            'Order': ['recWtYRBAWR4k7i1G']  // Transport
        });
        console.log(`Created Transport reservation with ID: ${transportRecord.id}`);

        // Create extra language reservations
        if (mockFormData.selectedLanguages.length > 1) {
            for (let i = 1; i < mockFormData.selectedLanguages.length; i++) {
                const extraLanguageRecord = await base('Reservations').create({
                    'Event name': [eventRecord.id],
                    'Order': ['rec9c2M0Ve1WthmLY']  // Extra Language
                });
                console.log(`Created Extra Language reservation with ID: ${extraLanguageRecord.id}`);
            }
        }

        // Create discount reservation if coupon used
        if (mockFormData.couponCode === 'EVENTPARTNER') {
            const discountRecord = await base('Reservations').create({
                'Event name': [eventRecord.id],
                'Order': ['recAfS1ryMLkw9FuS']  // EVENTPARTNER
            });
            console.log(`Created Event Partner discount reservation with ID: ${discountRecord.id}`);
        } else if (mockFormData.couponCode === 'EVENTSPECIALIST') {
            const discountRecord = await base('Reservations').create({
                'Event name': [eventRecord.id],
                'Order': ['recTN1wn6SzyP8f3N']  // EVENTSPECIALIST
            });
            console.log(`Created Event Specialist discount reservation with ID: ${discountRecord.id}`);
        }

        console.log('\nFull flow test completed successfully!');

    } catch (error) {
        console.error('Error in full flow test:', error);
        if (error.error) {
            console.error('Error details:', error.error);
        }
    }
}

testFullFlow();
