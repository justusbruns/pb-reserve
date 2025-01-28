import Airtable from 'airtable';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Airtable
const base = new Airtable({
    apiKey: process.env.AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base(process.env.AIRTABLE_BASE_ID);

async function testProducts() {
    try {
        // Test getting all products
        console.log('Fetching all products...');
        const records = await base('Products / Services').select().all();
        
        console.log('\nAll products:');
        records.forEach(record => {
            console.log(`- ${record.fields.Name} (ID: ${record.id})`);
        });

        // Test getting specific products
        const productsToFind = [
            'Poem Booth 1',
            'Transport',
            'Branding',
            'Theme',
            'Extra Language',
            'Roast Edition',
            'Event Partner',
            'Event Specialist'
        ];

        console.log('\nFetching specific products:');
        for (const name of productsToFind) {
            const records = await base('Products / Services')
                .select({
                    filterByFormula: `{Name} = '${name}'`
                })
                .all();
            
            if (records.length > 0) {
                console.log(`- Found ${name} (ID: ${records[0].id})`);
            } else {
                console.log(`- WARNING: ${name} not found!`);
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        if (error.error) {
            console.error('Error details:', error.error);
        }
    }
}

testProducts();
