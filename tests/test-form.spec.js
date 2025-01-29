import { test, expect } from '@playwright/test';

test('form submission flow', async ({ page }) => {
  try {
    // Navigate to the form page
    await page.goto('http://localhost:4174/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('Waiting for page to load completely...');

    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible', timeout: 30000 });
    console.log('Form is visible');

    // Wait for JavaScript to be fully loaded
    await page.waitForFunction(() => {
      return window.document.readyState === 'complete';
    }, { timeout: 30000 });
    console.log('Page JavaScript is fully loaded');

    // Test data using real addresses from the documentation
    const testData = {
      event: 'Test Event 2025',
      startDate: '2025-03-15',
      startTime: '09:00',
      endDate: '2025-03-15',
      endTime: '17:00',
      // Company address
      companyName: 'Test Company BV',
      contactPerson: 'John Doe',
      email: 'test@example.com',
      phone: '+31 20 555 0000',
      vatNumber: 'NL123456789B01',
      // Company address from MEMORIES
      address: 'Gedempt Hamerkanaal 111',
      postalCode: '1021KP',
      city: 'Amsterdam',
      country: 'Netherlands',
      // Delivery address from MEMORIES
      deliveryBusinessName: 'Delivery Location',
      deliveryStreet: 'Coolsingel 42',
      deliveryPostalCode: '3011AD',
      deliveryCity: 'Rotterdam',
      deliveryCountry: 'Netherlands'
    };

    // Fill event details
    await page.fill('#event', testData.event);
    await page.fill('#start_date', testData.startDate);
    await page.fill('#start_time', testData.startTime);
    await page.fill('#end_date', testData.endDate);
    await page.fill('#end_time', testData.endTime);

    // Fill company details
    await page.fill('#account_name', testData.companyName);
    await page.fill('#contactPerson', testData.contactPerson);
    await page.fill('#email', testData.email);
    await page.fill('#contact_phone', testData.phone);

    // Fill company address
    await page.fill('#address', testData.address);
    await page.fill('#postal_code', testData.postalCode);
    await page.fill('#city', testData.city);
    await page.selectOption('#country', testData.country);

    // Wait for VAT field to appear after country selection
    await page.waitForTimeout(1000);
    await page.waitForSelector('#vat_number', { state: 'visible' });
    await page.fill('#vat_number', testData.vatNumber);

    // Fill delivery address
    await page.waitForSelector('#delivery_business_name', { timeout: 60000, state: 'visible' });
    await page.fill('#delivery_business_name', testData.deliveryBusinessName);
    await page.fill('#delivery_street', testData.deliveryStreet);
    await page.fill('#delivery_postal_code', testData.deliveryPostalCode);
    await page.fill('#delivery_city', testData.deliveryCity);
    await page.selectOption('#delivery_country', testData.deliveryCountry);

    // Select languages
    await page.waitForSelector('.language-select');
    await page.selectOption('.language-select', 'Dutch');
    await page.click('button.button:has-text("Voeg toe")');
    await page.selectOption('.language-select', 'English');
    await page.click('button.button:has-text("Voeg toe")');

    // Optional features - click all "Voeg toe" buttons in feature sections
    await page.waitForSelector('.feature-2 button.button');
    const featureButtons = await page.$$('.feature-2 button.button');
    for (const button of featureButtons) {
        await button.click();
    }

    // Add coupon code
    await page.waitForSelector('input[placeholder="Voer je kortingscode in"]');
    await page.fill('input[placeholder="Voer je kortingscode in"]', 'EVENTPARTNER');

    // Accept terms and payment conditions
    await page.check('#dimensions');
    await page.check('#terms');
    await page.check('#payment');

    // Submit form and wait for response
    const submitPromise = page.waitForResponse(response => 
      response.url().includes('/api/submit-form') && response.request().method() === 'POST'
    );
    
    await page.click('button[type="submit"]');
    
    const response = await submitPromise;
    expect(response.ok()).toBeTruthy();

    const responseData = await response.json();
    console.log('Response data:', responseData);

    // Verify response includes required IDs from MEMORIES
    expect(responseData).toHaveProperty('organizationId');
    expect(responseData).toHaveProperty('personId');
    expect(responseData).toHaveProperty('eventId');
    expect(responseData).toHaveProperty('reservationId');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
});
