import { json } from '@sveltejs/kit';
import { base, formatRecord } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';

const testData = {
    // Organization details
    accountName: "Test Company BV",
    address: "Teststraat 123",
    postalCode: "1234 AB",
    city: "Amsterdam",
    country: "Netherlands",
    vatNumber: "NL123456789B01",
    
    // Contact details
    contactName: "John Doe",
    contactEmail: "test@example.com",
    contactPhone: "+31612345678",
    
    // Event details
    eventName: "Test Event 2024",
    startDate: "2024-03-01",
    endDate: "2024-03-02",
    startTime: "09:00",
    endTime: "17:00",
    
    // Languages and options
    selectedLanguages: ["Dutch", "English"],
    brandingAdded: true,
    themaAdded: false,
    printOptionSelected: true,
    getRoastedAdded: false,
    keynoteAdded: true,
    
    // Delivery address
    deliveryBusinessName: "Test Event Location",
    deliveryStreet: "Eventstraat 456",
    deliveryPostalCode: "5678 CD",
    deliveryCity: "Rotterdam",
    deliveryCountry: "Netherlands",
    destinationCoordinates: "4.4777,51.9244",
    
    // Pricing
    transportFee: 150,
    totalPrice: 2500,
    couponCode: "EVENTPARTNER"
};

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    let createdOrganization = null;
    let createdPerson = null;
    let createdEvent = null;

    try {
        // Log environment variables
        console.log('Environment variables:', {
            AIRTABLE_PAT: env.AIRTABLE_PAT ? 'Set' : 'Not set',
            AIRTABLE_BASE_ID: env.AIRTABLE_BASE_ID ? 'Set' : 'Not set'
        });

        // Create organization
        console.log('Creating test organization...');
        const organizationData = {
            'Name organization': testData.accountName,
            'Address': testData.address,
            'Postal code': testData.postalCode,
            'City': testData.city,
            'Country': testData.country,
            'VAT NR': testData.vatNumber,
            'Email': testData.contactEmail
        };
        console.log('Organization data:', organizationData);
        
        createdOrganization = await base.Organizations.create(organizationData);
        console.log('Organization created:', createdOrganization.id);

        // Create person
        console.log('Creating test person...');
        const personData = {
            'Name': testData.contactName,
            'Email': testData.contactEmail,
            'Mobile number': testData.contactPhone,
            'Type of person': 'Customer employee',
            'Organizations': [createdOrganization.id]
        };
        console.log('Person data:', personData);
        
        createdPerson = await base.Persons.create(personData);
        console.log('Person created:', createdPerson.id);

        // Format the complete address
        const completeAddress = [
            testData.deliveryBusinessName,
            testData.deliveryStreet,
            [testData.deliveryPostalCode, testData.deliveryCity].filter(Boolean).join(' '),
            testData.deliveryCountry
        ].filter(Boolean).join(', ');

        // Create event
        console.log('Creating test event...');
        const eventData = {
            'Event name': testData.eventName,
            'Starts at': `${testData.startDate}T${testData.startTime}:00.000+01:00`,
            'Stops at': `${testData.endDate}T${testData.endTime}:00.000+01:00`,
            'Organization': [createdOrganization.id],
            'Main contact': [createdPerson.id],
            'Invoice contact': [createdPerson.id],
            'Languages': testData.selectedLanguages,
            'Location': completeAddress,
            'Coordinates': testData.destinationCoordinates,
            'Transport fee': testData.transportFee,
            'Total price': testData.totalPrice,
            'Extra languages': testData.selectedLanguages.length > 1,
            'Branding': testData.brandingAdded,
            'Theme': testData.themaAdded,
            'Print option': testData.printOptionSelected,
            'Get roasted': testData.getRoastedAdded,
            'Keynote': testData.keynoteAdded,
            'Coupon code': testData.couponCode,
            'Status': 'concept',
            'Payment status': 'Invoice requested',
            'Event created by': 'Online'
        };
        console.log('Event data:', eventData);
        
        createdEvent = await base.Events.create(eventData);
        console.log('Event created:', createdEvent.id);

        // Clean up test data
        console.log('Cleaning up test data...');
        if (createdEvent) await base.Events.destroy(createdEvent.id);
        if (createdPerson) await base.Persons.destroy(createdPerson.id);
        if (createdOrganization) await base.Organizations.destroy(createdOrganization.id);
        console.log('Test data cleaned up');
        
        return json({
            success: true,
            message: 'Test successful - created and cleaned up all test records',
            ids: {
                organization: createdOrganization.id,
                person: createdPerson.id,
                event: createdEvent.id
            }
        });
    } catch (error) {
        console.error('Error in test:', {
            message: error.message,
            error: error.error,
            stack: error.stack
        });

        // Clean up any created records
        try {
            console.log('Cleaning up after error...');
            if (createdEvent) await base.Events.destroy(createdEvent.id);
            if (createdPerson) await base.Persons.destroy(createdPerson.id);
            if (createdOrganization) await base.Organizations.destroy(createdOrganization.id);
            console.log('Cleanup after error complete');
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }

        return json({ 
            error: error.message || 'Internal server error',
            details: error.error || error.toString()
        }, { 
            status: error.statusCode || 500 
        });
    }
}
