import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock product data
const products = {
    'poem-booth-1': {
        id: 'poem-booth-1',
        name: 'Poem Booth',
        price: 1500,
        description: 'Standard Poem Booth installation',
        type: 'booth'
    },
    'eventpartner': {
        id: 'eventpartner',
        name: 'Event Partner',
        price: 2000,
        description: 'Event partner services',
        type: 'service'
    },
    'eventspecialist': {
        id: 'eventspecialist',
        name: 'Event Specialist',
        price: 1000,
        description: 'Event specialist services',
        type: 'service'
    },
    'branding': {
        id: 'branding',
        name: 'Branding',
        price: 500,
        description: 'Custom branding options',
        type: 'addon'
    },
    'theme': {
        id: 'theme',
        name: 'Theme',
        price: 300,
        description: 'Custom theme design',
        type: 'addon'
    },
    'printer-1': {
        id: 'printer-1',
        name: 'Printer',
        price: 200,
        description: 'High-quality poem printer',
        type: 'equipment'
    },
    'roast': {
        id: 'roast',
        name: 'Roast',
        price: 150,
        description: 'Roast service',
        type: 'addon'
    },
    'transport': {
        id: 'transport',
        name: 'Transport',
        basePrice: 100,
        pricePerKm: 2,
        description: 'Transportation service',
        type: 'service'
    },
    'extra-language': {
        id: 'extra-language',
        name: 'Extra Language',
        price: 250,
        description: 'Additional language support',
        type: 'addon'
    },
    'coupon': {
        id: 'coupon',
        name: 'Coupon',
        price: 100,
        description: 'Discount coupon',
        type: 'addon'
    },
    'keynote': {
        id: 'keynote',
        name: 'Keynote',
        price: 750,
        description: 'Professional keynote presentation',
        type: 'service'
    }
} as const;

export const GET: RequestHandler = async ({ params }) => {
    const { slug } = params;
    console.log('Product request for:', slug);

    try {
        const product = products[slug as keyof typeof products];
        if (!product) {
            console.error('Product not found:', slug);
            return json(
                { error: 'Product not found', slug },
                { status: 404 }
            );
        }

        return json(product, {
            headers: {
                'Cache-Control': 'public, max-age=3600',
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
};
