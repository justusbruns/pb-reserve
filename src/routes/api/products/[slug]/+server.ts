import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock product data - replace with your actual data source
const products = {
    'poem-booth-1': {
        id: 'poem-booth-1',
        name: 'Poem Booth',
        price: 1500
    },
    'eventpartner': {
        id: 'eventpartner',
        name: 'Event Partner',
        price: 2000
    },
    'eventspecialist': {
        id: 'eventspecialist',
        name: 'Event Specialist',
        price: 1000
    },
    'branding': {
        id: 'branding',
        name: 'Branding',
        price: 500
    },
    'theme': {
        id: 'theme',
        name: 'Theme',
        price: 300
    },
    'printer-1': {
        id: 'printer-1',
        name: 'Printer',
        price: 200
    },
    'roast': {
        id: 'roast',
        name: 'Roast',
        price: 150
    },
    'transport': {
        id: 'transport',
        name: 'Transport',
        basePrice: 100,
        pricePerKm: 2
    },
    'extra-language': {
        id: 'extra-language',
        name: 'Extra Language',
        price: 250
    },
    'keynote': {
        id: 'keynote',
        name: 'Keynote',
        price: 500
    }
};

export const GET: RequestHandler = async ({ params, url, request }) => {
    console.log('Products API called with:');
    console.log('- URL:', url.toString());
    console.log('- Base URL:', url.origin);
    console.log('- Path:', url.pathname);
    console.log('- Headers:', Object.fromEntries(request.headers.entries()));
    console.log('- Params:', params);
    console.log('Available products:', Object.keys(products));
    
    try {
        const { slug } = params;
        console.log('Looking up product with slug:', slug);
        
        const product = products[slug];
        console.log('Found product:', product);

        if (!product) {
            console.log('Product not found for slug:', slug);
            return json(
                { error: `Product not found: ${slug}` },
                { 
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return json(product, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error in products API:', error);
        return json(
            { error: 'Internal server error' },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
