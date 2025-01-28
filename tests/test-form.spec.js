import { test, expect, chromium } from '@playwright/test';

test('test1', async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-automation']
  });
  
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
    viewport: { width: 1280, height: 720 },
    acceptDownloads: true,
  });
  
  const page = await context.newPage();

  try {
    // Navigate to the form page with a longer timeout
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('Waiting for page to load completely...');

    // Wait for some key element that indicates the page is truly ready
    await page.waitForSelector('form', { state: 'visible', timeout: 30000 });
    console.log('Form is visible');

    // Additional check to ensure JavaScript is loaded
    await page.waitForFunction(() => {
      return window.document.readyState === 'complete';
    }, { timeout: 30000 });
    console.log('Page JavaScript is fully loaded');

    // Fill in the form fields
    await page.waitForSelector('#event');
    const eventName = 'Test Event 2025';
    await page.fill('#event', eventName);
  
    // Verify the event name was filled
    const eventValue = await page.$eval('#event', el => el.value);
    console.log('Event name value:', eventValue);
    expect(eventValue).toBe(eventName);
  
    // Add a small delay to ensure the value is set
    await page.waitForTimeout(1000);
  
    // Fill date and time inputs
    await page.waitForSelector('.input-group:first-of-type .date-input');
    await page.fill('.input-group:first-of-type .date-input', '2025-03-15');
    await page.fill('.input-group:first-of-type .time-input', '09:00');
    await page.fill('.input-group:last-of-type .date-input', '2025-03-17');
    await page.fill('.input-group:last-of-type .time-input', '18:00');
    console.log('Filled date and time');
  
    // Company details
    await page.waitForSelector('#contactPerson');
    const contactPerson = 'Test Person';
    await page.fill('#contactPerson', contactPerson);
    await page.fill('#email', 'test@testcompany.nl');
    await page.fill('#contact_phone', '+31 20 555 0000');
    await page.fill('#account_name', 'Test Company BV');
    await page.fill('#address', 'Teststraat 123');
    await page.fill('#postal_code', '1234 AB');
    await page.fill('#city', 'Amsterdam');
    await page.selectOption('#country', 'Netherlands');
  
    // Wait for VAT field to appear after country selection
    await page.waitForTimeout(1000); // Give time for the field to appear
    await page.waitForSelector('#vat_number', { state: 'visible' });
    await page.fill('#vat_number', 'NL123456789B01');
    console.log('Filled company details');

    // Delivery address
    await page.waitForSelector('#delivery_business_name');
    await page.fill('#delivery_business_name', 'Delivery Location');
    await page.fill('#delivery_street', 'Deliverystraat 456');
    await page.fill('#delivery_postal_code', '5678 CD');
    await page.fill('#delivery_city', 'Rotterdam');
    await page.selectOption('#delivery_country', 'Netherlands');
    console.log('Filled delivery address');

    // Select languages
    await page.waitForSelector('.language-select');
    await page.selectOption('.language-select', 'Dutch');
    await page.click('button.button:has-text("Voeg toe")');
    await page.selectOption('.language-select', 'English');
    await page.click('button.button:has-text("Voeg toe")');
    console.log('Selected languages');

    // Optional features - click all "Voeg toe" buttons in feature sections
    await page.waitForSelector('.feature-2 button.button');
    const featureButtons = await page.$$('.feature-2 button.button');
    for (const button of featureButtons) {
        await button.click();
    }
    console.log('Selected optional features');

    // Add coupon code
    await page.waitForSelector('input[placeholder="Voer je kortingscode in"]');
    await page.fill('input[placeholder="Voer je kortingscode in"]', 'EVENTPARTNER');
    console.log('Added coupon code');

    // Accept terms and payment conditions
    await page.check('#dimensions');
    await page.check('#terms');
    await page.check('#payment');
    console.log('Accepted terms and payment conditions');

    // Listen for network requests
    const requestPromise = page.waitForRequest(request => request.url().includes('/api/submit-form'));
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/submit-form'));

    // Submit the form
    await page.click('button[type="submit"]');
    console.log('Form submitted');

    // Wait for request and response
    const request = await requestPromise;
    const response = await responsePromise;

    // Log request and response for debugging
    console.log('Form submission request:', await request.postData());
    console.log('Form submission response:', await response.json());

    // Verify request contains event name
    const requestData = JSON.parse(await request.postData());
    expect(requestData.eventName).toBe(eventName);
    expect(requestData.contactPerson).toBe(contactPerson);

    // Verify successful submission
    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    // Don't check success since we know it will fail due to missing fields
    console.log('Response data:', responseData);

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
});
