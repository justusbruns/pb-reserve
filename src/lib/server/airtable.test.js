import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const result = config({ path: join(__dirname, '../../../.env') });

if (result.error) {
    throw result.error;
}

// Now import the Airtable client
const airtableModule = await import('./airtable.js');
const base = airtableModule.base;

async function checkTableStructure(tableName) {
    console.log(`\n=== Checking ${tableName} table structure ===`);
    try {
        const tableInfo = await base[tableName].select({
            maxRecords: 1
        });
        
        if (tableInfo.records && tableInfo.records.length > 0) {
            console.log('Available fields:', Object.keys(tableInfo.records[0].fields));
            console.log('\nSample record:', JSON.stringify(tableInfo.records[0].fields, null, 2));
        } else {
            console.log('No records found in table');
        }
    } catch (error) {
        console.error(`Error checking ${tableName} table:`, error.message);
    }
}

async function testAllTables() {
    try {
        // Check Reservations table
        await checkTableStructure('Reservations');

        // Check Organizations table
        await checkTableStructure('Organizations');

        // Check Persons table
        await checkTableStructure('Persons');

        // Check Products table
        await checkTableStructure('Products');

        // Check ProductGroups table
        await checkTableStructure('ProductGroups');

        // Check Availability table
        await checkTableStructure('Availability');

        console.log('\n✅ All table structure checks completed');
    } catch (error) {
        console.error('\n❌ Error during table checks:', error.message);
        throw error;
    }
}

// Run the tests
testAllTables();
