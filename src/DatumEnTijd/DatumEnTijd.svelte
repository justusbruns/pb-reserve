<script lang="ts">
  import { onMount, onDestroy, getContext } from "svelte";
  import { fade, scale } from 'svelte/transition';
  import dateImage from '../images/Date.png?url';
  import locationImage from '../images/Location.png?url';
  import languageImage from '../images/Taal.png?url';
  import printImage from '../images/Print.jpg?url';
  import brandingImage from '../images/Branding.png?url';
  import themaImage from '../images/Thema.png?url';
  import rbImage from '../images/RB.png?url';
  import couponImage from '../images/Coupon.png?url';
  import speakerImage from '../images/Speaker.png?url';
  import pbLogo from '../images/Logo PB.png?url';
  import type { EventFields } from 'types/Event';
  import { writable } from 'svelte/store';
  import { dateTimeUtils } from '../services/airtable/utils';
  import { countryUtils } from '../services/airtable/utils';
  import flatpickr from 'flatpickr';
  import { Dutch } from 'flatpickr/dist/l10n/nl.js';
  import 'flatpickr/dist/flatpickr.css';
  import confetti from 'canvas-confetti';
  import type { Translations } from './types';
  import { geocodeAddress, reverseGeocode } from '$lib/client/apiClient';
  import MapboxGeocoder from '$lib/components/MapboxGeocoder.svelte';

  declare global {
    interface Window {
      MapboxGeocoder: any;
    }
  }

  // Component props
  const translations = getContext('translations');
  const currentLang = translations?.locale || 'nl';

  function getTranslation(key) {
    if (!translations) {
      console.warn('No translations found');
      return key;
    }
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (!value || !value[k]) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      value = value[k];
    }
    
    return value;
  }

  // Get context values
  const mapboxToken = getContext('mapboxToken');
  const apiToken = getContext('apiToken');

  async function getOriginCoordinates() {
    try {
      if (!originAddress) {
        console.warn('No origin address provided');
        return;
      }

      console.log('Fetching coordinates for address:', originAddress);
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(originAddress)}.json?access_token=${mapboxToken}`);
      const data = await response.json();
      
      if (data && data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log('Found origin coordinates:', [lng, lat]);
        originCoordinates = [lng, lat];
      } else {
        console.warn('No features found in geocoding response for origin');
      }
    } catch (error) {
      console.error('Error getting origin coordinates:', error);
    }
  }

  onMount(async () => {
    try {
      loadFormData(); // Load saved form data when component mounts
      if (translations && translations.languages && translations.languages.language) {
        languageTranslations = Object.keys(translations.languages.language).reduce((acc, key) => {
          acc[key] = translations.languages.language[key] || key;
          return acc;
        }, {});
      }

      // Initialize origin coordinates first
      try {
        console.log('Initializing origin coordinates...');
        await getOriginCoordinates();
      } catch (error) {
        console.error('Error getting origin coordinates:', error);
        distanceError = getTranslation('errors.locationError');
        return;
      }

      // Load product records
      const poemBoothResponse = await fetch('/api/products/poem-booth-1');
      const poemBoothRecord = await poemBoothResponse.json();
      console.log('Poem Booth record:', poemBoothRecord);
      
      const eventPartnerResponse = await fetch('/api/products/eventpartner');
      const eventPartnerRecord = await eventPartnerResponse.json();
      console.log('Event Partner record:', eventPartnerRecord);
      
      const eventSpecialistResponse = await fetch('/api/products/eventspecialist');
      const eventSpecialistRecord = await eventSpecialistResponse.json();
      console.log('Event Specialist record:', eventSpecialistRecord);
      
      const brandingResponse = await fetch('/api/products/branding');
      const brandingRecord = await brandingResponse.json();
      console.log('Branding record:', brandingRecord);
      
      const themeResponse = await fetch('/api/products/theme');
      const themeRecord = await themeResponse.json();
      console.log('Theme record:', themeRecord);
      
      const standardPrinterResponse = await fetch('/api/products/printer-1');
      const standardPrinterRecord = await standardPrinterResponse.json();
      console.log('Printer record:', standardPrinterRecord);
      
      const roastResponse = await fetch('/api/products/roast');
      const roastRecord = await roastResponse.json();
      console.log('Roast record:', roastRecord);
      
      const transportResponse = await fetch('/api/products/transport');
      const transportRecord = await transportResponse.json();
      console.log('Transport record:', transportRecord);
      
      const languageResponse = await fetch('/api/products/extra-language');
      const languageRecord = await languageResponse.json();
      console.log('Language record:', languageRecord);

      const keynoteResponse = await fetch('/api/products/keynote');
      const keynoteRecord = await keynoteResponse.json();
      console.log('Keynote record:', keynoteRecord);

      // Store the record IDs
      productIds = {
        poemBooth: poemBoothRecord?.id,
        eventPartner: eventPartnerRecord?.id,
        eventSpecialist: eventSpecialistRecord?.id,
        extraLanguage: languageRecord?.id,
        branding: brandingRecord?.id,
        theme: themeRecord?.id,
        printer: standardPrinterRecord?.id,
        roast: roastRecord?.id,
        transport: transportRecord?.id,
        keynote: keynoteRecord?.id
      };

      console.log('Final Product IDs:', productIds);

      // Validate that we have all required product IDs
      const missingProducts = Object.entries(productIds)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingProducts.length > 0) {
        console.error('Missing product IDs for:', missingProducts);
        throw new Error(`Missing product IDs for: ${missingProducts.join(', ')}`);
      }

      // Set initial values
      const initialDate = new Date();
      initialDate.setDate(initialDate.getDate() + 7); // One week from now
      
      startDate = initialDate.toISOString().split('T')[0];
      endDate = startDate;
      startTime = "09:00";
      endTime = "17:00";
      
      // Calculate initial price
      totalPrice = 950; // Set default price for one day

      return () => {
        // Cleanup
        if (geocoder) {
          geocoder.destroy();
        }
      };
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  });

  // Load form data from localStorage or API
  async function loadFormData() {
    if (typeof window === 'undefined') return; // Skip during SSR
    try {
      // First try to load from localStorage
      const savedData = localStorage.getItem('formData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.entries(parsedData).forEach(([key, value]) => {
          if (key in window) {
            window[key] = value;
          }
        });
      }

      // Then try to load from API if we have a reservation ID
      const urlParams = new URLSearchParams(window.location.search);
      const reservationId = urlParams.get('id');
      
      if (reservationId) {
        const response = await fetch(`/api/reservations/${reservationId}`);
        if (response.ok) {
          const apiData = await response.json();
          // Update form fields with API data
          Object.entries(apiData).forEach(([key, value]) => {
            if (key in window) {
              window[key] = value;
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }

  // Load form data on mount
  onMount(() => {
    loadFormData();
  });

  // Watch for date/time changes
  $: {
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      
      // Ensure end date/time is not before start date/time
      if (end < start) {
        endDate = startDate;
        endTime = startTime;
      }
      
      // Calculate event days and update prices
      eventDays = calculateEventDays(startDate, endDate);
      calculateTotalPrice();
      calculateTransportFee();
    }
  }

  onDestroy(() => {
    if (dateRangePicker) {
      dateRangePicker.destroy();
    }
  });

  // Handle address search
  async function handleAddressSearch() {
    if (deliveryAddress.length > 2) {
      try {
        const data = await geocodeAddress(deliveryAddress, currentLang === 'en' ? 'en' : 'nl');
        if (data && data.features) {
          addressSuggestions = data.features.map(feature => ({
            place_name: feature.place_name,
            center: feature.center
          }));
        } else {
          addressSuggestions = [];
        }
      } catch (error) {
        console.error('Error searching address:', error);
        addressSuggestions = [];
      }
    } else {
      addressSuggestions = [];
    }
  }

  // Handle address select
  async function handleAddressSelect(result) {
    try {
      console.log('Address selected:', result);
      const { result: { context = [], place_name = '', center = [] } = {} } = result;
      
      // Extract address components
      const street = result.result.text || '';
      const number = result.result.address || '';
      const postalCode = result.result.context.find(item => item.id.startsWith('postcode'))?.text || '';
      const city = result.result.context.find(item => item.id.startsWith('place'))?.text || '';
      const countryName = result.result.context.find(item => item.id.startsWith('country'))?.text || '';
      
      // Find the matching country in our list
      const matchingCountry = countries.find(c => 
        c.toLowerCase() === countryName.toLowerCase() ||
        getTranslatedCountry(c).toLowerCase() === countryName.toLowerCase()
      );

      // Set the destination coordinates and update route
      if (center?.length === 2) {
        console.log('Setting destination coordinates:', center);
        destinationCoordinates = [...center]; // Create a new array to ensure reactivity
        await calculateDistance(center);
      } else {
        console.error('Invalid center coordinates:', center);
        return;
      }

      // Show address fields and populate them
      showAddressFields = true;
      deliveryStreet = `${street} ${number}`.trim();
      deliveryPostalCode = postalCode;
      deliveryCity = city;
      deliveryCountry = matchingCountry || '';
    } catch (error) {
      console.error('Error in handleAddressSelect:', error);
    }
  }

  // Function to submit to Airtable
  async function submitToAirtable(formData) {
    try {
      console.log('Submitting form:', formData);  

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Form submission failed:', error);
        throw new Error(error.error || 'Failed to submit form');
      }

      const result = await response.json();
      console.log('Form submission complete:', result);
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  // Email Validation
  function validateEmail(email: string): boolean {
    // RFC 5322 compliant email regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email.toLowerCase());
  }
  
  function handleEmailChange(event: Event) {
    const target = event.target as HTMLInputElement;
    email = target.value;
    if (!email) {
      emailError = getTranslation('errors.requiredField');
    } else if (!validateEmail(email)) {
      emailError = getTranslation('errors.emailError');
    } else {
      emailError = '';
    }
  }

  function handleInvoiceEmailChange(event: Event) {
    const target = event.target as HTMLInputElement;
    invoiceContactEmail = target.value;
    if (invoiceContactEmail && !validateEmail(invoiceContactEmail)) {
        invoiceEmailError = getTranslation('errors.emailError');
    } else {
        invoiceEmailError = '';
    }
  }

  function toggleDefinitive(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    isDefinitive = checkbox.checked;
    reservationType = isDefinitive ? 'definite' : 'info';
  }

  function toggleInvoiceContact(event) {
    hasDifferentInvoiceContact = event.target.checked;
    if (!hasDifferentInvoiceContact) {
      // Use same contact info
      invoiceContactName = contactName;
      invoiceContactEmail = email;
      invoiceContactPhone = contactPhone;
    } else {
      // Clear invoice contact fields
      invoiceContactName = '';
      invoiceContactEmail = '';
      invoiceContactPhone = '';
    }
  }

  $: if (!hasDifferentInvoiceContact) {
    invoiceContactName = contactName;
    invoiceContactEmail = email;
    invoiceContactPhone = contactPhone;
  }

  async function handleAddressInput(event: Event) {
    const target = event.target as HTMLInputElement;
    deliveryAddress = target.value;
    
    if (deliveryAddress.length > 2) {
      try {
        const data = await geocodeAddress(deliveryAddress, currentLang === 'en' ? 'en' : 'nl');
        console.log('Geocoding response:', data);
        addressSuggestions = data.features;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        addressSuggestions = [];
      }
    } else {
      addressSuggestions = [];
    }
  }

  async function selectAddress(suggestion: { text: string, coordinates: [number, number], context: any[] }) {
    deliveryAddress = suggestion.text;
    addressSuggestions = [];

    // Extract country from context if available
    const countryContext = suggestion.context?.find(item => item.id.startsWith('country'));
    if (countryContext) {
      const addressComponents = getAddressComponents(deliveryAddress);
      
      // Reconstruct the address with the explicit country
      deliveryAddress = [
        addressComponents.address_line_1,
        addressComponents.address_line_2,
        [addressComponents.postal_code, addressComponents.city].filter(Boolean).join(' '),
        addressComponents.country
      ].filter(Boolean).join(', ');
    }

    await calculateTransportFee();
  }

  async function calculateDistance(coordinates) {
    if (!originCoordinates?.length || originCoordinates.length === 0) {
      console.error('Origin coordinates not set');
      calculatedDistance = 0;
      transportFee = 0;
      staticMapUrl = "";
      routeGeometry = null;
      return;
    }

    try {
      const [lng, lat] = coordinates;
      selectedCoordinates = [lng, lat];
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates[0]},${originCoordinates[1]};${lng},${lat}?geometries=geojson&access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        // Distance is in meters, convert to kilometers
        calculatedDistance = Math.round(data.routes[0].distance / 1000);
        routeGeometry = data.routes[0].geometry;
        console.log('Calculated distance:', calculatedDistance, 'km');

        // Calculate transport fee
        await calculateTransportFee();
        
        // Update map with route
        await updateRouteVisualization();
      } else {
        console.error('No route found in response:', data);
        distanceError = 'Could not calculate distance';
        calculatedDistance = 0;
        transportFee = 0;
        staticMapUrl = "";
        routeGeometry = null;
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      distanceError = 'Error calculating distance';
      calculatedDistance = 0;
      transportFee = 0;
      staticMapUrl = "";
      routeGeometry = null;
    }
  }

  // Calculate transport fee based on distance and event duration
  async function calculateTransportFee() {
    if (calculatedDistance === 0 || distanceError) {
      transportFee = 0;
      return;
    }
    // Calculate transport fee based on distance and event duration
    transportFee = calculatedDistance * (eventDays > 1 ? 4 : 2);
  }

  // Update transport fee when event days change
  $: {
    if (eventDays && calculatedDistance > 0) {
      calculateTransportFee();
    }
  }

  // Calculate event days when dates change
  $: {
    if (startDate && endDate) {
      eventDays = calculateEventDays(startDate, endDate);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  }

  function formatNumber(value: number): string {
    return new Intl.NumberFormat('nl-NL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function toggleBranding() {
    if (brandingAdded) {
      extrasList = extrasList.filter(e => e.id !== 'branding');
    } else {
      extrasList = [...extrasList, { id: 'branding', price: 750 }];
    }
    brandingAdded = !brandingAdded;
    calculateExtrasPrice();
  }

  function toggleThema() {
    if (themaAdded) {
      extrasList = extrasList.filter(e => e.id !== 'thema');
    } else {
      extrasList = [...extrasList, { id: 'thema', price: 750 }];
    }
    themaAdded = !themaAdded;
    calculateExtrasPrice();
  }

  function toggleGetRoasted() {
    if (getRoastedAdded) {
      extrasList = extrasList.filter(e => e.id !== 'roasted');
    } else {
      extrasList = [...extrasList, { id: 'roasted', price: 350 }];
    }
    getRoastedAdded = !getRoastedAdded;
    calculateExtrasPrice();
  }

  function toggleKeynote() {
    keynoteAdded = !keynoteAdded;
  }

  function togglePrintOption() {
    const days = calculateEventDays(startDate, endDate);
    if (printOptionSelected) {
      extrasList = extrasList.filter(e => e.id !== 'print');
    } else {
      extrasList = [...extrasList, { id: 'print', price: 500 * days }];
    }
    printOptionSelected = !printOptionSelected;
    calculateExtrasPrice();
  }

  function calculateExtrasPrice() {
    extrasPrice = extrasList.reduce((total, extra) => {
      if (extra.id === 'print') {
        return total + extra.price;
      }
      return total + extra.price;
    }, 0);
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const target = event.target as HTMLSelectElement;
    const newLanguage = target.value;
    
    if (newLanguage !== "Empty" && !selectedLanguages.includes(newLanguage)) {
      if (selectedLanguages.length === 0) {
        primaryLanguage = newLanguage;
        selectedLanguages = [newLanguage];
        selectedLanguage = "Empty";
      } else {
        selectedLanguages = [...selectedLanguages, newLanguage];
        selectedLanguage = "Empty";
        
        // Add to extras list for pricing (only for additional languages)
        extrasList = [...extrasList, { id: `lang-${newLanguage}`, price: 125 }];
        calculateExtrasPrice();
      }
    }
  }

  function removeLanguage(lang: string) {
    if (selectedLanguages.length === 1) {
      return; // Don't allow removal if it's the only language
    }
    
    selectedLanguages = selectedLanguages.filter(l => l !== lang);
    
    // If we removed the primary language, set the first remaining language as primary
    if (lang === primaryLanguage && selectedLanguages.length > 0) {
      primaryLanguage = selectedLanguages[0];
    }
    
    // Update extras list for pricing
    extrasList = extrasList.filter(e => e.id !== `lang-${lang}`);
    calculateExtrasPrice();
  }

  function addLanguage(language: string) {
    if (!selectedLanguages.includes(language)) {
      selectedLanguages = [...selectedLanguages, language];
      extrasList = [...extrasList, { id: `lang-${language}`, price: 125 }];
      calculateExtrasPrice();
    }
  }

  // Reactive statement to update print price based on date changes
  $: if (startDate && endDate) {
    if (printOptionSelected) {
      const days = calculateEventDays(startDate, endDate);
      extrasList = extrasList.map(extra => {
        if (extra.id === 'print') {
          return { ...extra, price: 500 * days };
        }
        return extra;
      });
      calculateExtrasPrice();
    }
  }

  // Reactive statement to update transport fee based on date changes
  $: {
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const days = calculateEventDays(startDate, endDate);
      totalPrice = calculateRentalPrice(days);
      
      // Recalculate transport fee when dates change
      if (calculatedDistance > 0 && calculatedDistance <= 300) {
        const totalDistance = eventDays > 1 ? calculatedDistance * 4 : calculatedDistance * 2;
        transportFee = totalDistance;

      }

      // Update print option price if selected
      if (printOptionSelected) {
        const printExtra = extrasList.find(e => e.id === 'print');
        if (printExtra) {
          printExtra.price = 500 * days;
          calculateExtrasPrice();
        }
      }
    }
  }

  function calculateTotalPrice() {
    if (startDate && endDate) {
      // Calculate base rental price
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Base price calculation using poem booth pricing
      const basePrice = calculatePoemBoothPrice(diffDays);
      
      // Add transport fee if applicable
      let totalTransport = transportFee || 0;
      
      // Add all extras
      let totalExtras = extrasPrice || 0;
      
      // Calculate language costs (excluding first language)
      const languageCost = selectedLanguages.length > 1 ? (selectedLanguages.length - 1) * 125 : 0;
      
      // Sum up all components before discount
      const subtotal = basePrice + totalTransport + totalExtras + languageCost;
      
      // Apply coupon discount if valid
      const finalDiscount = (couponDiscount > 0 && !couponError) ? couponDiscount : 0;
      
      // Calculate final total
      totalPrice = subtotal - finalDiscount;
    }
  }

  // Calculate poem booth price based on number of days
  function calculatePoemBoothPrice(days: number): number {
    if (days <= 0) return 0;
    if (days === 1) return 950;  // First day
    if (days === 2) return 950 + 750;  // First + second day
    return 950 + 750 + ((days - 2) * 100);  // First + second + continuation days
  }

  // Calculate event days when dates change
  function calculateEventDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  $: {
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const days = calculateEventDays(startDate, endDate);
      totalPrice = calculateRentalPrice(days);
    }
  }

  function calculateDays(start: Date, end: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay));
    return diffDays + 1; // Include both start and end day
  }

  function calculateRentalPrice(days: number): number {
    if (days <= 0) return 0;
    if (days === 1) return 950;  // First day
    if (days === 2) return 950 + 750;  // First + second day
    return 950 + 750 + ((days - 2) * 100);  // First + second + continuation days
  }

  $: {
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const days = calculateDays(start, end);
      totalPrice = calculateRentalPrice(days);
    }
  }

  function handleCouponCode() {
    couponError = '';
    couponDiscount = 0;
    
    if (!couponCode) {
      return;
    }
    
    // Check for valid coupon codes
    switch (couponCode.toUpperCase()) {
      case 'EVENTPARTNER':
        if (themaAdded && brandingAdded) {
          couponDiscount = 750;
        } else {
          couponError = getTranslation('coupon.eventPartnerInvalid');
        }
        break;
      case 'EVENTSPECIALIST':
        couponDiscount = 100;
        break;
      default:
        couponError = getTranslation('coupon.invalid');
        break;
    }
    
    // Recalculate total price
    calculateTotalPrice();
  }

  // Recalculate coupon discount when Theme or Branding changes
  $: {
    if (themaAdded !== undefined || brandingAdded !== undefined) {
      handleCouponCode();
    }
  }

  $: totalPrice = calculateRentalPrice(eventDays) + extrasPrice + transportFee;
  $: vatAmount = totalPrice * 0.21;
  $: totalPriceInclVat = totalPrice + vatAmount;

  $: priceBeforeVat = totalPrice - couponDiscount;
  $: vatAmountAfterDiscount = priceBeforeVat * 0.21;
  $: totalPriceWithDiscountInclVat = priceBeforeVat + vatAmountAfterDiscount;

  // Form validation
  let formValidation = {
    event: {
      isValid: () => eventName && startDate && endDate && startTime && endTime,
    },
    organization: {
      isValid: () => accountName && address && postalCode && city && country,
    },
    contact: {
      isValid: () => contactName && email && contactPhone && validateEmail(email) && validatePhone(contactPhone),
    },
    delivery: {
      isValid: () => deliveryStreet && deliveryPostalCode && deliveryCity && deliveryCountry,
    }
  };

  let formErrors = [];

  function getMissingFields() {
    formErrors = [];
    
    // Event Details
    if (!eventName) formErrors.push(getTranslation('form.event'));
    if (!startDate || !startTime) formErrors.push(getTranslation('form.startDate'));
    if (!endDate || !endTime) formErrors.push(getTranslation('form.endDate'));
    
    // Company Details
    if (!accountName) formErrors.push(getTranslation('form.accountName'));
    if (!address) formErrors.push(getTranslation('form.address'));
    if (!postalCode) formErrors.push(getTranslation('form.postalCode'));
    if (!city) formErrors.push(getTranslation('form.city'));
    if (!country) formErrors.push(getTranslation('form.country'));
    
    // Contact Details
    if (!contactName) formErrors.push(getTranslation('form.contactName'));
    if (!email || !validateEmail(email)) formErrors.push(getTranslation('form.email'));
    if (!contactPhone || !validatePhone(contactPhone)) formErrors.push(getTranslation('form.phone'));
    
    // Delivery Details
    if (!deliveryStreet) formErrors.push(getTranslation('form.deliveryStreet'));
    if (!deliveryPostalCode) formErrors.push(getTranslation('form.deliveryPostalCode'));
    if (!deliveryCity) formErrors.push(getTranslation('form.deliveryCity'));
    if (!deliveryCountry) formErrors.push(getTranslation('form.deliveryCountry'));
    
    // Terms
    if (!dimensionsAccepted) formErrors.push(getTranslation('form.dimensions'));
    if (!termsAccepted) formErrors.push(getTranslation('form.terms'));
    if (!paymentAccepted) formErrors.push(getTranslation('form.payment'));

    return formErrors;
  }

  function isFormValid(): boolean {
    // Required fields validation
    const requiredFieldsValid = !!(
      startDate && 
      startTime && 
      endDate && 
      endTime && 
      eventName &&
      deliveryStreet &&
      deliveryPostalCode &&
      deliveryCity &&
      deliveryCountry &&
      accountName &&
      address &&
      postalCode &&
      city &&
      country &&
      contactName &&
      email &&
      contactPhone &&
      validatePhone(contactPhone) &&
      validateEmail(email)
    );

    // Terms acceptance validation
    const termsValid = !!(
      termsAccepted &&
      dimensionsAccepted &&
      paymentAccepted
    );

    // Email format validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Return overall form validity
    return (
      requiredFieldsValid &&
      termsValid &&
      emailValid &&
      !distanceError && // No distance calculation errors
      !emailError // No email validation errors
    );
  }

  // Watch for changes in form fields and validate
  $: {
    if (email) {
      emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Invalid email format';
    }
    if (invoiceContactEmail && hasDifferentInvoiceContact) {
      invoiceEmailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceContactEmail) ? '' : 'Invalid email format';
    }
    if (contactPhone) {
      phoneError = validatePhone(contactPhone) ? '' : 'Invalid phone number';
    }
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    isSubmitting = true;
    formErrors = [];
    
    try {
      const missingFields = getMissingFields();
      
      if (missingFields.length > 0) {
        isSubmitting = false;
        const errorMessage = `${getTranslation('form.pleaseComplete')}:\n${missingFields.join('\n')}`;
        throw new Error(errorMessage);
      }

      function formatDateToUTC(date: string, time: string): string {
        if (!date || !time) return '';
        const localDate = new Date(`${date}T${time}`);
        return localDate.toISOString();
      }

      const formData = {
        // Event details
        eventName,
        startDate: formatDateToUTC(startDate, startTime),
        endDate: formatDateToUTC(endDate, endTime),
        eventDays,
        
        // Company details
        accountName,
        email,
        phone: contactPhone,
        contactPerson: contactName,
        vatNumber,
        poNumber,
        
        // Company address
        address,
        postalCode,
        city,
        country,
        
        // Delivery address
        deliveryBusinessName,
        deliveryStreet,
        deliveryPostalCode,
        deliveryCity,
        deliveryCountry,
        destinationCoordinates: destinationCoordinates.join(','),
        
        // Pricing and options
        calculatedDistance,
        transportFee,
        totalPrice,
        selectedLanguages,
        printOption: printOption || false,
        couponCode: couponCode || ''
      };

      console.log('Form data prepared:', formData);

      await submitToAirtable(formData);
      console.log('Form submitted successfully');
      submitSuccess = true;
      triggerSuccessAnimation();
      clearFormData(); // Clear saved data after successful submission
    } catch (error) {
      console.error('Error in form submission:', error);
      submitError = getTranslation('errors.submitError');
    } finally {
      isSubmitting = false;
    }
  }

  function triggerSuccessAnimation() {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.5 }
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.5 }
    });

    // Fire golden confetti from the middle
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FFD700', '#FDB931', '#FFED4A']
      });
    }, 250);
  }

  // Save form data whenever relevant values change
  $: {
    if (startDate || endDate || startTime || endTime || eventName || locationName || 
        deliveryAddress || deliveryBusinessName || deliveryStreet || deliveryPostalCode || deliveryCity || deliveryCountry || 
        language || brandingAdded || themaAdded || getRoastedAdded || 
        keynoteAdded || printOptionSelected || selectedLanguages.length || selectedLanguage ||
        transportFee || extrasPrice || extrasList.length || totalPrice || calculatedDistance ||
        invoiceAddressInput) {
      saveFormData();
    }
  }

  // Form data handling
  async function saveFormData() {
    if (typeof window === 'undefined') return; // Skip during SSR
    try {
      const formData = {
        startDate,
        startTime,
        endDate,
        endTime,
        eventName,
        totalPrice,
        transportFee,
        locationName,
        deliveryBusinessName,
        deliveryStreet,
        deliveryPostalCode,
        deliveryCity,
        deliveryCountry,
        calculatedDistance,
        extrasPrice,
        language,
        brandingAdded,
        themaAdded,
        getRoastedAdded,
        keynoteAdded,
        printOptionSelected,
        eventDays,
        extrasList,
        selectedLanguages,
        primaryLanguage,
        productIds,
      };

      // Save to local storage
      localStorage.setItem('formData', JSON.stringify(formData));
      
      // If this is a final submission, send to server
      if (isSubmitting) {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to submit form');
        }

        submitSuccess = true;
        isSubmitting = false;
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      submitError = error.message;
      isSubmitting = false;
    }
  }

  // Clear form data
  async function clearFormData() {
    if (typeof window === 'undefined') return; // Skip during SSR
    try {
      localStorage.removeItem('formData');
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }

  // Country translations
  const countryTranslations = {
    en: {
      'Netherlands': 'Netherlands',
      'Belgium': 'Belgium',
      'Germany': 'Germany',
      'France': 'France',
      'Austria': 'Austria',
      'Bulgaria': 'Bulgaria',
      'Croatia': 'Croatia',
      'Cyprus': 'Cyprus',
      'Czech Republic': 'Czech Republic',
      'Denmark': 'Denmark',
      'Estonia': 'Estonia',
      'Finland': 'Finland',
      'Greece': 'Greece',
      'Hungary': 'Hungary',
      'Ireland': 'Ireland',
      'Italy': 'Italy',
      'Latvia': 'Latvia',
      'Lithuania': 'Lithuania',
      'Luxembourg': 'Luxembourg',
      'Malta': 'Malta',
      'Netherlands': 'Netherlands',
      'Poland': 'Poland',
      'Portugal': 'Portugal',
      'Romania': 'Romania',
      'Slovakia': 'Slovakia',
      'Slovenia': 'Slovenia',
      'Spain': 'Spain',
      'Sweden': 'Sweden',
      'United Kingdom': 'United Kingdom',
      'Switzerland': 'Switzerland',
      'Norway': 'Norway'
    },
    nl: {
      'Netherlands': 'Nederland',
      'Belgium': 'België',
      'Germany': 'Duitsland',
      'France': 'Frankrijk',
      'Austria': 'Oostenrijk',
      'Bulgaria': 'Bulgarije',
      'Croatia': 'Kroatië',
      'Cyprus': 'Cyprus',
      'Czech Republic': 'Tsjechië',
      'Denmark': 'Denemarken',
      'Estonia': 'Estland',
      'Finland': 'Finland',
      'Greece': 'Griekenland',
      'Hungary': 'Hongarije',
      'Ireland': 'Ierland',
      'Italy': 'Italië',
      'Latvia': 'Letland',
      'Lithuania': 'Litouwen',
      'Luxembourg': 'Luxemburg',
      'Malta': 'Malta',
      'Poland': 'Polen',
      'Portugal': 'Portugal',
      'Romania': 'Roemenië',
      'Slovakia': 'Slowakije',
      'Slovenia': 'Slovenië',
      'Spain': 'Spanje',
      'Sweden': 'Zweden',
      'United Kingdom': 'Verenigd Koninkrijk',
      'Switzerland': 'Zwitserland',
      'Norway': 'Noorwegen'
    }
  };

  // Get translated country name based on current language
  function getTranslatedCountry(country: string): string {
    const lang = currentLang || 'en';
    return countryTranslations[lang]?.[country] || country;
  }

  // Countries list for dropdowns
  const countries = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
    'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
    'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'United Kingdom', 'Switzerland', 'Norway'
  ];

  // EU Countries list
  const euCountries = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
    'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
    'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
  ];

  // Check if a country is in the EU
  function isEUCountry(countryName: string): boolean {
    return euCountries.includes(countryName);
  }

  // Form visibility state
  let showDeliveryFields = false;
  let showInvoiceFields = false;
  let showPricingDetails = false;
  let showTermsAndConditions = false;
  let showLanguageSelector = false;
  let showExtrasSelector = false;

  // Form variables
  let className = "";
  let startDate = "2025-01-15";
  let startTime = "09:00";
  let endDate = "2025-01-15";
  let endTime = "17:00";
  let eventName = ""; 
  let basePrice = 1500;
  let languagePrice = 125; // Price per additional language
  let brandingPrice = 750;
  let themaPrice = 750;
  let getRoastedPrice = 400;
  let keynotePrice = 750;
  let printPrice = 250;
  let totalPrice = 0;
  let extrasPrice = 0;
  let couponDiscount = 0;

  let locationName = "";
  let suggestions = [];
  let language = '';
  let brandingAdded = false;
  let themaAdded = false;
  let getRoastedAdded = false;
  let keynoteAdded = false;
  let printOptionSelected = false;
  let printOption = false; // Added printOption state variable
  let eventDays = 1;
  let extrasList = [];
  let selectedLanguages = [];
  let selectedLanguage = 'Empty';
  let currentPath = '';
  let primaryLanguage = "Dutch";
  let isSubmitting = false;
  let submitError = '';
  let productIds = {
    poemBooth: 'recPoEmBoOtH123',        // Base product
    eventPartner: 'recEvTpArTnEr456',     // Event partner
    eventSpecialist: 'recEvTsPeC789',     // Event specialist
    extraLanguage: 'recExTrAlAnG012',     // Additional language
    branding: 'recBrAnDiNg345',          // Branding
    theme: 'recThEmE678',                // Theme
    printer: 'recPrInTeR901',            // Printer
    roast: 'recRoAsT234',                // Roast
    transport: 'recTrAnSpOrT567',        // Transport
    keynote: 'recKeYnOtE890'             // Keynote
  };

  // Delivery address fields
  let deliveryBusinessName = '';
  let deliveryStreet = '';
  let deliveryPostalCode = '';
  let deliveryCity = '';
  let deliveryCountry = '';

  // Company and contact info
  let accountName = '';
  let address = '';
  let postalCode = '';
  let city = '';
  let country = ''; 
  let vatNumber = '';
  let contactName = '';
  let email = '';
  let emailError = '';
  let contactPhone = '';
  let phoneError = '';
  let invoiceContactEmail = '';
  let invoiceEmailError = '';
  let invoiceContactName = '';
  let invoiceContactPhone = '';
  let hasDifferentInvoiceContact = false;
  let reservationType = 'info';
  let isDefinitive = false;
  let submitSuccess = false;
  let poNumber = '';
  let dateRangePicker;
  let languageTranslations = {};
  let couponCode = '';
  let couponError = '';

  // Address components
  let addressComponents = {
    businessName: '',
    street: '',
    postalCode: '',
    city: '',
    country: ''
  };

  // Terms and conditions
  let termsAccepted = false;
  let dimensionsAccepted = false;
  let paymentAccepted = false;

  // Invoice address
  let invoiceAddressInput = '';
  let billingAddressComponents = {
    businessName: '',
    street: '',
    postalCode: '',
    city: '',
    country: ''
  };

  // Map related state
  let staticMapUrl = '';
  let isMapLoading = false;
  let mapImageLoaded = false;
  let showAddressFields = false;
  let destinationCoordinates = [];
  let originCoordinates = [];
  let originAddress = 'Gedempt Hamerkanaal 111, 1021KP Amsterdam, The Netherlands';
  let selectedCoordinates = [];
  let distanceError = '';
  let routeGeometry = null;
  
  // Distance and transport fee calculations
  let calculatedDistance = 0;
  let transportFee = 0;

  // Function to update route visualization
  async function updateRouteVisualization() {
    try {
      if (!originCoordinates?.length || originCoordinates.length === 0) {
        console.warn('Missing coordinates for route visualization:', { originCoordinates, destinationCoordinates });
        return;
      }

      console.log('Getting route between:', { origin: originCoordinates, destination: destinationCoordinates });
      
      // Get the route between origin and destination
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates[0]},${originCoordinates[1]};${destinationCoordinates[0]},${destinationCoordinates[1]}?geometries=geojson&access_token=${mapboxToken}`
      );
      
      const routeData = await response.json();
      console.log('Route data:', routeData);

      if (routeData.routes && routeData.routes[0]) {
        const route = routeData.routes[0];
        const geojson = route.geometry;
        
        // Calculate bounding box from route coordinates
        const coordinates = geojson.coordinates;
        const lngs = coordinates.map(coord => coord[0]);
        const lats = coordinates.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        // Add 20% padding
        const lngPadding = (maxLng - minLng) * 0.2;
        const latPadding = (maxLat - minLat) * 0.2;
        const bbox = [
          minLng - lngPadding,
          minLat - latPadding,
          maxLng + lngPadding,
          maxLat + latPadding
        ];

        // Update static map with route visualization
        const params = new URLSearchParams();
        params.set('origin', `${originCoordinates[0]},${originCoordinates[1]}`);
        params.set('destination', `${destinationCoordinates[0]},${destinationCoordinates[1]}`);
        params.set('bbox', bbox.join(','));
        params.set('geojson', JSON.stringify(geojson));

        staticMapUrl = `/api/staticmap?${params.toString()}`;
        isMapLoading = true;
        console.log('Updated static map URL:', staticMapUrl);
      }
    } catch (error) {
      console.error('Error updating route visualization:', error);
    }
  }

  function decodeGeometry(str) {
    const coordinates = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    let shift = 0;
    let result = 0;
    let byte = null;
    let latitude_change;
    let longitude_change;
    const factor = Math.pow(10, 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {
      // Reset shift, result, and byte
      byte = null;
      shift = 0;
      result = 0;

      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

      shift = result = 0;

      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

      lat += latitude_change;
      lng += longitude_change;

      coordinates.push([lng / factor, lat / factor]);
    }

    return coordinates;
  }

  function generateStaticMapUrl(origin, destination) {
    isMapLoading = true;
    mapImageLoaded = false;
    
    if (!origin || !destination || origin.length !== 2 || destination.length !== 2 || !routeGeometry) {
      console.log('Invalid coordinates or route geometry for map:', { origin, destination, hasGeometry: !!routeGeometry });
      return "";
    }
    
    const [originLng, originLat] = origin;
    const [destLng, destLat] = destination;
    
    // Decode the route geometry to get all coordinates
    const coordinates = decodeGeometry(routeGeometry);
    
    // Calculate bounding box from all route coordinates
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    
    // Add padding to the bounds
    const padding = 0.2; // Increased padding to 20%
    const bbox = [
      minLng - (maxLng - minLng) * padding,
      minLat - (maxLat - minLat) * padding,
      maxLng + (maxLng - minLng) * padding,
      maxLat + (maxLat - minLat) * padding
    ].join(',');
    
    // Create GeoJSON with the actual route coordinates
    const geojson = {
      type: "Feature",
      properties: {
        "stroke": "#326334",
        "stroke-width": 5
      },
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
    
    console.log('Map coordinates:', {
      origin: [originLng, originLat],
      destination: [destLng, destLat],
      routePoints: coordinates.length,
      bbox
    });
    
    // Use server endpoint to get the map URL
    const mapUrl = `/api/staticmap?origin=${originLng},${originLat}&destination=${destLng},${destLat}&bbox=${bbox}&geojson=${encodeURIComponent(JSON.stringify(geojson))}`;
    
    console.log('Generated map URL:', mapUrl);
    return mapUrl;
  }

  // Handle geocoder clear
  function handleGeocderClear() {
    showAddressFields = false;
    deliveryBusinessName = '';
    deliveryStreet = '';
    deliveryPostalCode = '';
    deliveryCity = '';
    deliveryCountry = '';
    destinationCoordinates = [];
    staticMapUrl = "";
    calculatedDistance = 0;
    transportFee = 0;
  }

  // Handle geocoder result
  function handleGeocderResult(event) {
    handleAddressSelect(event.detail);
  }

  function validatePhone(phone: string): boolean {
    // Basic phone validation - allows for international format
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    const isValid = phoneRegex.test(phone);
    phoneError = isValid ? '' : getTranslation('errors.invalidPhone') || 'Invalid phone number';
    return isValid;
  }
</script>

<style>
  /* Scoped styles for the geocoder container */
  :global(#geocoder) {
    width: 100%;
    max-width: 100%;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder) {
    width: 100%;
    max-width: 100%;
    box-shadow: none;
    font-family: "Inter", sans-serif;
    border: none;
    background: #326334;
    border-radius: 7px;
    min-height: 50px;
    margin: 0;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--input) {
    height: 50px;
    border: none;
    background: #326334;
    color: #C9DA9A;
    padding: 12px 16px;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    min-height: 50px;
    width: 100%;
    margin: 0;
    border-radius: 7px;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--input::placeholder) {
    color: #C9DA9A;
    opacity: 1;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: normal;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--icon),
  :global(#geocoder .mapboxgl-ctrl-geocoder--button) {
    display: none;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--suggestions) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #326334;
    border: 2px solid #C9DA9A;
    border-top: none;
    border-radius: 0 0 7px 7px;
    margin-top: -2px;
    color: #C9DA9A;
    max-height: 200px;
    overflow-y: auto;
    padding: 0;
    margin: 0;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--suggestion) {
    color: #C9DA9A;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid rgba(201, 218, 154, 0.2);
    font-family: "Inter", sans-serif;
    font-size: 16px;
    line-height: 1.4;
    background: #326334;
    margin: 0;
  }

  :global(#geocoder .mapboxgl-ctrl-geocoder--suggestion *) {
    background: #326334;
    margin: 0;
  }

  :global(.text) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .input-container {
    width: 100%;
    max-width: 100%;
  }

  .keynote-remark {
    text-align: center;
    margin: 20px auto;
    padding: 15px;
    color: #C9DA9A;
    font-size: 18px;
    font-family: "Inter", sans-serif;
    border: 2px solid #C9DA9A;
    border-radius: 10px;
    background-color: rgba(201, 218, 154, 0.1);
    max-width: fit-content;
    font-weight: normal;
  }

  .success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .success-modal {
    background: #326334;
    padding: 40px;
    border-radius: 15px;
    text-align: center;
    color: #C9DA9A;
    max-width: 90%;
    width: 500px;
  }

  .success-icon {
    margin-bottom: 20px;
    width: 120px;
    height: 120px;
    margin: 0 auto 20px;
    background-image: var(--pb-logo);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .success-modal h2 {
    font-size: 24px;
    margin-bottom: 15px;
    color: #C9DA9A;
  }

  .success-modal p {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 25px;
    color: #C9DA9A;
  }

  .back-button {
    display: inline-block;
    padding: 12px 24px;
    background: #C9DA9A;
    color: #326334;
    text-decoration: none;
    border-radius: 7px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: #d8e4b6;
    transform: translateY(-2px);
  }

  .loading-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #C9DA9A;
    transition: opacity 0.3s ease-out;
  }

  .loading-container.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .loading-van {
    animation: bounce 1s infinite ease-in-out;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.5s ease-in;
  }

  .map-image.visible {
    opacity: 1 !important;
  }

  .error-message {
    background-color: #fff3f3;
    border: 1px solid #326334;
    border-radius: 4px;
    padding: 1rem;
    margin: 1rem 0;
    color: #326334;
  }

  .error-message ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
  }

  .error-message li {
    margin: 0.25rem 0;
  }
</style>

<div class="inclusief">
  <h1 class="h1">{getTranslation('extras.title')}</h1>
  <div class="features">

    <!-- Date Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{dateImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('dateTime.period')}</span>
          <span class="description-text-span2">{getTranslation('dateTime.installationNote')}</span>
          <span class="description-text-span2" style="margin-top: 10px; margin-bottom: 5px;">{getTranslation('dateTime.startDate')}</span>
          <div class="input-group">
            <input 
              type="date" 
              class="date-input" 
              bind:value={startDate}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <input 
              type="time" 
              class="time-input" 
              bind:value={startTime}
              required
            />
          </div>
          <span class="description-text-span2" style="margin-top: 12px; margin-bottom: 5px;">{getTranslation('dateTime.endDate')}</span>
          <div class="input-group">
            <input 
              type="date" 
              class="date-input" 
              bind:value={endDate}
              min={startDate || new Date().toISOString().split('T')[0]}
              required
            />
            <input 
              type="time" 
              class="time-input" 
              bind:value={endTime}
              required
            />
          </div>
          <span class="description-text-span2" style="margin-top: 12px;">{getTranslation('dateTime.baseRental')}: {formatCurrency(calculateRentalPrice(eventDays))}</span>
        </div>
      </div>
    </div>

    <!-- Location Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{staticMapUrl || locationImage}'); background-size: cover; background-position: center;">
        <div class="loading-container" class:hidden={!isMapLoading || mapImageLoaded}>
          <svg class="loading-van" width="130" height="85" viewBox="0 0 130 85" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M128.14 40.6507C127.406 39.3382 126.437 38.1715 125.275 37.2132C123.135 35.2861 121.114 33.2236 118.984 31.2861C116.577 27.682 113.869 24.2913 111.369 20.7497C108.786 17.1664 106.171 13.6039 103.515 10.0727C102.041 7.87479 100.348 5.82786 98.4681 3.96853C95.9056 1.72893 92.614 0.504924 89.2129 0.520658C80.7441 0.531075 72.2809 0.541491 63.8169 0.546699C53.9367 0.551907 44.0516 0.494616 34.1716 0.541491C26.3591 0.551907 18.5463 0.51545 10.7343 0.551908V0.557118C8.42693 0.426909 6.13533 1.06753 4.22906 2.38005C1.72906 4.32272 0.275997 7.31752 0.286397 10.4842C0.27598 27.1815 0.307231 43.8802 0.265564 60.5775C3.19783 60.5879 6.1301 60.5671 9.0625 60.6088C9.94791 58.9629 11.0209 57.4265 12.2656 56.0358C13.5156 54.791 14.8958 53.6817 16.3853 52.7337C21.703 49.6868 28.1145 49.2025 33.8333 51.4108H33.8281C35.7812 52.1556 37.5885 53.2181 39.1926 54.5514C41.1614 56.2441 42.7968 58.291 44.0156 60.5878C52.6145 60.5931 61.2089 60.5722 69.8076 60.6035C69.9117 59.2806 69.8336 57.9524 69.8596 56.6243C69.9273 41.1763 69.844 25.7283 69.8961 10.2856C69.8284 8.9731 70.818 7.84814 72.1253 7.73867C72.8024 7.67617 73.4742 7.88971 73.9846 8.33763C74.495 8.78034 74.7971 9.41575 74.8284 10.098C74.8023 26.9314 74.7971 43.77 74.8128 60.6034C77.6982 60.5982 80.5888 60.5929 83.4742 60.5825C84.3648 58.8221 85.5054 57.2076 86.8649 55.7804C89.1722 53.4627 92.016 51.7544 95.1513 50.8168C97.4898 50.1762 99.9221 49.9314 102.344 50.0824C109.162 50.5303 115.24 54.5251 118.365 60.598C121.99 60.5928 125.61 60.6032 129.235 60.5876C129.235 58.7595 129.261 56.9313 129.23 55.098C129.204 55.0459 129.146 54.9366 129.115 54.8845C127.86 54.723 126.584 54.9105 125.324 54.7959C123.912 54.6032 122.704 53.7022 122.115 52.4053C121.631 51.2646 121.662 49.9678 122.209 48.8531C122.756 47.8531 123.824 47.2542 124.964 47.3167C126.402 47.3271 127.844 47.3115 129.287 47.3323C129.495 45.0406 129.105 42.7386 128.141 40.6501L128.14 40.6507Z" fill="#326334"/>
            <path d="M37.4013 59.7027C35.3232 57.536 32.6721 56.01 29.7555 55.3016C28.0732 54.9578 26.3388 54.8901 24.6304 55.0933C22.8179 55.3172 21.0627 55.8693 19.4481 56.7235C16.646 58.2339 14.4065 60.6038 13.0575 63.4891C11.6772 66.4318 11.2919 69.7443 11.9533 72.9266C12.6616 76.1766 14.4064 79.1037 16.9325 81.2755C21.5262 85.1401 27.9794 85.911 33.3538 83.2339C38.4997 80.6558 41.6924 75.3433 41.5517 69.5939C41.4059 65.9013 39.9327 62.3903 37.4013 59.7027Z" fill="#326334"/>
            <path d="M106.437 56.0626C104.073 55.0679 101.474 54.7397 98.9373 55.1252C95.781 55.4949 92.8332 56.8752 90.5258 59.0626C88.2602 61.3334 86.7394 64.2449 86.1665 67.4012C85.0311 74.0001 88.4373 80.547 94.4998 83.4012C98.6457 85.3596 103.469 85.3074 107.573 83.2605C111.682 81.2136 114.62 77.396 115.557 72.9012C116.208 69.5835 115.713 66.1408 114.151 63.1408C112.489 59.9481 109.76 57.4429 106.437 56.0626Z" fill="#326334"/>
            <path d="M0.0155792 65.416C-0.0417128 66.3483 0.0103698 67.2909 0.177032 68.2129C0.614539 70.1088 1.97397 71.6556 3.8021 72.3275C4.87502 72.5931 5.97917 72.6816 7.0833 72.5931C6.69267 70.2128 6.79685 67.7806 7.39581 65.442C4.93741 65.4368 2.47398 65.4733 0.0155792 65.416Z" fill="#326334"/>
            <path d="M60.1093 65.4893C55.3645 65.4737 50.6145 65.5466 45.8693 65.406H45.8745C46.4995 67.7393 46.6349 70.1768 46.2756 72.5675C57.9526 72.5987 69.6302 72.5623 81.3062 72.5883C80.926 70.2028 81.0771 67.7654 81.7542 65.4476C74.5406 65.4581 67.3227 65.4998 60.1093 65.4893Z" fill="#326334"/>
            <path d="M119.989 65.416C120.64 67.7337 120.776 70.166 120.385 72.5411C121.609 72.5931 122.838 72.5983 124.062 72.5723C125.942 72.4525 127.62 71.3431 128.468 69.6556C129.12 68.3536 129.385 66.8952 129.245 65.4474C126.156 65.4161 123.073 65.4472 119.989 65.416Z" fill="#326334"/>
            <path d="M25.5307 66.9173C24.1713 67.3913 23.2807 68.7037 23.3536 70.1465C23.4317 71.5215 24.3796 72.6935 25.7129 73.058C27.041 73.4226 28.4525 72.8965 29.2233 71.7559C29.9942 70.6153 29.9525 69.1048 29.114 68.0111C28.2806 66.9122 26.838 66.4747 25.5307 66.9173Z" fill="#326334"/>
            <path d="M99.844 66.912C98.8648 67.287 98.1148 68.1047 97.8284 69.1098C97.6201 69.9432 97.7555 70.8234 98.2086 71.5525C98.6565 72.2817 99.3805 72.7973 100.219 72.9848C101.271 73.1983 102.354 72.8754 103.12 72.1306C103.891 71.3806 104.235 70.3025 104.052 69.2504C103.828 68.3649 103.25 67.6149 102.453 67.1722C101.657 66.7295 100.714 66.6359 99.844 66.912Z" fill="#326334"/>
          </svg>
        </div>
        {#if staticMapUrl}
          <img 
            class="map-image"
            class:visible={mapImageLoaded}
            src={staticMapUrl} 
            alt="Route map"
            on:load={() => mapImageLoaded = true}
          />
        {/if}
      </div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('transport.title')}</span>
          <span class="description-text-span2">{getTranslation('transport.costPerKm')}</span>
        </div>
        <div class="input-container">
          <MapboxGeocoder 
            accessToken={mapboxToken} 
            types="address" 
            countries={['NL', 'BE', 'DE']} 
            language={currentLang} 
            placeholder={getTranslation('transport.deliveryAddressPlaceholder')} 
            on:result={handleGeocderResult} 
            on:clear={handleGeocderClear}
          />
          {#if showAddressFields}
            <div class="address-fields" transition:fade>
              <div class="input-group full-width">
                <input 
                  type="text" 
                  class="text" 
                  id="delivery_business_name" 
                  name="delivery_business_name"
                  bind:value={deliveryBusinessName}
                  placeholder={getTranslation('form.deliveryBusinessNamePlaceholder')}
                />
              </div>
              <div class="input-group full-width">
                <input 
                  type="text" 
                  class="text" 
                  id="delivery_street" 
                  name="delivery_street"
                  bind:value={deliveryStreet}
                  required
                  placeholder={getTranslation('form.deliveryStreetPlaceholder')}
                />
              </div>
              <div class="input-group full-width">
                <input 
                  type="text" 
                  class="text" 
                  id="delivery_postal_code" 
                  name="delivery_postal_code"
                  bind:value={deliveryPostalCode}
                  required
                  placeholder={getTranslation('form.deliveryPostalCodePlaceholder')}
                />
                <input 
                  type="text" 
                  class="text" 
                  id="delivery_city" 
                  name="delivery_city"
                  bind:value={deliveryCity}
                  required
                  placeholder={getTranslation('form.deliveryCityPlaceholder')}
                />
              </div>
              <div class="input-group full-width">
                <select 
                  class="text" 
                  id="delivery_country" 
                  name="delivery_country"
                  bind:value={deliveryCountry}
                  required
                >
                  <option value="" disabled selected>{getTranslation('dateTime.address.country')}</option>
                  {#each countries as countryOption}
                    <option value={countryOption}>{getTranslatedCountry(countryOption)}</option>
                  {/each}
                </select>
              </div>
            </div>
          {/if}
        </div>
        {#if calculatedDistance > 300}
          <div class="description-text-2">
            <span class="description-text-span2 error">{getTranslation('transport.longDistance')}</span>
          </div>
        {:else if calculatedDistance > 0}
          <div class="description-text-2">
            <span class="description-text-span2">{getTranslation('transport.transportCost')}: {formatCurrency(transportFee)}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Language Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{languageImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.language.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.language.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency((selectedLanguages.length > 1 ? (selectedLanguages.length - 1) * 125 : 0))} {getTranslation('extras.language.totalText')}</span>
        </div>
        <div class="description-text">
          <div class="language-selection-container">
            <div class={'dropdown-language ' + className}>
              <select class="language-select" on:change={handleLanguageChange} bind:value={selectedLanguage}>
                <option value="Empty">{getTranslation('extras.language.select')}</option>
                {#each Object.keys(languageTranslations) as lang}
                  <option value={lang}>{languageTranslations[lang]}</option>
                {/each}
              </select>
            </div>
            {#if selectedLanguages.length > 0}
              <div class="language-tags">
                {#each selectedLanguages as language}
                  <div class="language-tag">
                    {languageTranslations[language]}
                    <button class="remove-language" on:click={() => removeLanguage(language)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="inclusief">
  <h1 class="h1">{getTranslation('extras.addExtras')}</h1>
  <div class="features">

    <!-- Print Option Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{printImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.printOption.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.printOption.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{getTranslation('extras.printOption.pricePerDay')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(500 * calculateEventDays(startDate, endDate))} {getTranslation('extras.printOption.totalText')}</span>
        </div>
        <button 
          type="button"
          class="button" 
          class:selected={printOption}
          on:click={() => printOption = !printOption}
        >
          {printOption ? getTranslation('extras.printOption.remove') : getTranslation('extras.printOption.add')}
        </button>
      </div>
    </div>

    <!-- Branding Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{brandingImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.branding.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.branding.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(750)}</span>
        </div>
        <button 
          type="button"
          class="button" 
          class:selected={brandingAdded} 
          on:click={toggleBranding}
          on:keydown={(e) => e.key === 'Enter' && toggleBranding()}
        >
          {brandingAdded ? getTranslation('common.remove') : getTranslation('common.add')}
        </button>
      </div>
    </div>

    <!-- Thema Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{themaImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.theme.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.theme.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(750)}</span>
        </div>
        <button 
          type="button"
          class="button" 
          class:selected={themaAdded} 
          on:click={toggleThema}
          on:keydown={(e) => e.key === 'Enter' && toggleThema()}
        >
          {themaAdded ? getTranslation('common.remove') : getTranslation('common.add')}
        </button>
      </div>
    </div>

    <!-- Get Roasted Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{rbImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.getRoasted.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.getRoasted.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(350)}</span>
        </div>
        <button 
          type="button"
          class="button" 
          class:selected={getRoastedAdded} 
          on:click={toggleGetRoasted}
          on:keydown={(e) => e.key === 'Enter' && toggleGetRoasted()}
        >
          {getRoastedAdded ? getTranslation('common.remove') : getTranslation('common.add')}
        </button>
      </div>
    </div>

    <!-- Keynote Speaker Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{speakerImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('extras.keynote.title')}</span>
          <span class="description-text-span2">{getTranslation('extras.keynote.description')}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{getTranslation('pricing.priceUponRequest')}</span>
        </div>
        <button 
          type="button"
          class="button" 
          class:selected={keynoteAdded} 
          on:click={toggleKeynote}
          on:keydown={(e) => e.key === 'Enter' && toggleKeynote()}
        >
          {keynoteAdded ? getTranslation('common.remove') : getTranslation('common.add')}
        </button>
      </div>
    </div>

    <!-- Coupon Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('{couponImage}');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('coupon.title')}</span>
          <span class="description-text-span2">{getTranslation('coupon.description')}</span>
        </div>
        <div class="input-container" style="display: flex; flex-direction: column; gap: 8px;">
          <input 
            type="text" 
            bind:value={couponCode}
            on:input={handleCouponCode}
            placeholder={getTranslation('coupon.placeholder')}
            class="text"
            class:error={couponError}
          />
          {#if couponError}
            <div class="description-text-2">
              <span class="description-text-span2 error">{couponError}</span>
            </div>
          {/if}
          {#if couponDiscount > 0}
            <div class="description-text-2">
              <span class="description-text-span2">{getTranslation('pricing.discount')}: €{couponDiscount}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<div class="inclusief">
  <h1 class="h1">{getTranslation('pricing.overview')}</h1>
  <table class="price-overview">
    <thead>
      <tr>
        <th>{getTranslation('pricing.quantity')}</th>
        <th>{getTranslation('pricing.description')}</th>
        <th>{getTranslation('pricing.price')}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{calculateEventDays(startDate, endDate)}</td>
        <td>{getTranslation('pricing.rentalDays')}</td>
        <td>{formatCurrency(calculateRentalPrice(eventDays))}</td>
      </tr>
      {#if transportFee > 0 && calculatedDistance <= 300}
        <tr>
          <td>{formatNumber(calculatedDistance * (eventDays > 1 ? 4 : 2))}</td>
          <td>{getTranslation('transport.kmRate')}</td>
          <td>{formatCurrency(transportFee)}</td>
        </tr>
      {/if}
      {#if selectedLanguages.length > 0}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => removeLanguage(selectedLanguages[0])}>×</button>
              <span>{languageTranslations[selectedLanguages[0]]} {getTranslation('languages.complimentary')}</span>
            </div>
          </td>
          <td>{formatCurrency(0)}</td>
        </tr>
      {/if}
      {#each selectedLanguages.slice(1) as language}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => removeLanguage(language)}>×</button>
              <span>{languageTranslations[language]}</span>
            </div>
          </td>
          <td>{formatCurrency(125)}</td>
        </tr>
      {/each}
      {#if printOption}
        <tr>
          <td>{calculateEventDays(startDate, endDate)}</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => printOption = !printOption}>×</button>
              <span>{getTranslation('extras.printOption.title')}</span>
            </div>
          </td>
          <td>{formatCurrency(500 * calculateEventDays(startDate, endDate))}</td>
        </tr>
      {/if}
      {#if brandingAdded}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={toggleBranding}>×</button>
              <span>{getTranslation('extras.branding.title')}</span>
            </div>
          </td>
          <td>{formatCurrency(750)}</td>
        </tr>
      {/if}
      {#if themaAdded}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={toggleThema}>×</button>
              <span>{getTranslation('extras.theme.title')}</span>
            </div>
          </td>
          <td>{formatCurrency(750)}</td>
        </tr>
      {/if}
      {#if getRoastedAdded}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={toggleGetRoasted}>×</button>
              <span>{getTranslation('extras.getRoasted.title')}</span>
            </div>
          </td>
          <td>{formatCurrency(350)}</td>
        </tr>
      {/if}
    </tbody>
    <tfoot>
      {#if couponDiscount > 0}
        <tr>
          <td colspan="2">{getTranslation('pricing.discount')}</td>
          <td>-{formatCurrency(couponDiscount)}</td>
        </tr>
      {/if}
      <tr>
        <td colspan="2">{getTranslation('pricing.total')}</td>
        <td>{formatCurrency(priceBeforeVat)}</td>
      </tr>
      <tr>
        <td colspan="2">{getTranslation('pricing.vat')}</td>
        <td>{formatCurrency(vatAmountAfterDiscount)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>{getTranslation('pricing.totalInclVat')}</strong></td>
        <td><strong>{formatCurrency(totalPriceWithDiscountInclVat)}</strong></td>
      </tr>
    </tfoot>
  </table>
  {#if keynoteAdded}
    <div class="keynote-remark">
      {getTranslation('pricing.keynoteRemark')}
    </div>
  {/if}
</div>

<div class="inclusief">
  <h1 class="h1">{getTranslation('form.title')}</h1>
  <form on:submit={handleSubmit}>
    <div class="form-section">
      <div class="frame">
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.event')}:</div>
          </div>
          <div class="frame">
            <input 
              type="text" 
              class="text" 
              id="event" 
              name="event"
              bind:value={eventName}
              required
              placeholder={getTranslation('form.eventPlaceholder')}
            >
          </div>
        </div>
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.name')}:</div>
          </div>
          <div class="frame">
            <input 
              type="text" 
              class="text" 
              id="contactPerson" 
              name="contactPerson"
              bind:value={contactName}
              required
              placeholder={getTranslation('form.namePlaceholder')}
            >
          </div>
        </div>
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.email')}:</div>
          </div>
          <div class="frame">
            <input 
              type="email" 
              class="text {emailError ? 'error' : ''}" 
              id="email" 
              name="email"
              bind:value={email}
              on:input={handleEmailChange}
              pattern="[^@\s]+@[^\s@]+\.[^\s@]+"
              required
              placeholder={getTranslation('form.emailPlaceholder')}
            >
            {#if emailError}
              <div class="description-text-2">
                <span class="description-text-span2 error">{emailError}</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.phone')}:</div>
          </div>
          <div class="frame">
            <input 
              type="tel" 
              class="text {phoneError ? 'error' : ''}" 
              id="contact_phone" 
              name="contact_phone"
              bind:value={contactPhone}
              required
              placeholder={getTranslation('form.phonePlaceholder')}
            >
            {#if phoneError}
              <div class="description-text-2">
                <span class="description-text-span2 error">{phoneError}</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.accountName')}:</div>
          </div>
          <div class="frame">
            <input 
              type="text" 
              class="text" 
              id="account_name" 
              name="account_name"
              bind:value={accountName}
              required
              placeholder={getTranslation('form.organisationPlaceholder')}
            >
          </div>
        </div>
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf required-field">{getTranslation('form.address')}:</div>
          </div>
          <div class="frame">
            <div style="margin-top: 10px;">
              <input 
                type="text" 
                class="text" 
                id="address" 
                name="address"
                bind:value={address}
                required
                placeholder={getTranslation('form.addressPlaceholder')}
              />
              <div style="margin-top: 10px;">
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <input 
                      type="text" 
                      class="text" 
                      id="postal_code" 
                      name="postal_code"
                      bind:value={postalCode}
                      required
                      placeholder={getTranslation('form.postalCodePlaceholder')}
                    >
                  </div>
                  <div style="flex: 2;">
                    <input 
                      type="text" 
                      class="text" 
                      id="city" 
                      name="city"
                      bind:value={city}
                      required
                      placeholder={getTranslation('form.cityPlaceholder')}
                    >
                  </div>
                </div>
                <div style="margin-top: 10px;">
                  <select 
                    class="text" 
                    id="country" 
                    name="country"
                    bind:value={country}
                    required
                  >
                    <option value="" disabled selected>{getTranslation('dateTime.address.country')}</option>
                    {#each countries as countryOption}
                      <option value={countryOption}>{getTranslatedCountry(countryOption)}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        {#if isEUCountry(country) && country !== 'Nederland'}
          <div class="frame-row">
            <div class="frame-item">
              <div class="vanaf">{getTranslation('form.vatNumber')}:</div>
            </div>
            <div class="frame">
              <input 
                type="text" 
                class="text" 
                id="vat_number" 
                name="vat_number"
                bind:value={vatNumber}
                placeholder={getTranslation('form.vatNumberPlaceholder')}
              >
            </div>
          </div>
        {/if}
        <div class="frame-row">
          <div class="frame-item">
            <div class="vanaf">{getTranslation('form.poNumber')}:</div>
          </div>
          <div class="frame">
            <input 
              type="text" 
              class="text" 
              id="po_number" 
              name="po_number"
              bind:value={poNumber}
              placeholder={getTranslation('form.poNumberPlaceholder')}
            >
          </div>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="frame">
        <div class="checkbox-option">
          <input type="checkbox" id="dimensions" name="dimensions" required bind:checked={dimensionsAccepted}>
          <label for="dimensions" class="p">
            {@html getTranslation('form.dimensions.text')}
          </label>
        </div>
        <div class="checkbox-option">
          <input type="checkbox" id="payment" name="payment" required bind:checked={paymentAccepted}>
          <label for="payment" class="p">
            {@html getTranslation('form.payment.text')}
          </label>
        </div>
        <div class="checkbox-option">
          <input type="checkbox" id="terms" name="terms" required bind:checked={termsAccepted}>
          <label for="terms" class="p">
            {@html getTranslation('form.terms.text')}&nbsp;<a href="https://poembooth.com/huurovereenkomst" target="_blank">{getTranslation('form.terms.link')}</a>
          </label>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="frame">
        {#if !isFormValid}
          <div class="validation-status">
            <div class="validation-message">
              {#if Object.values(formValidation).every(section => section.isValid())}
                {getTranslation('form.validation.complete')}
              {:else}
                {getTranslation('form.validation.incomplete')}
              {/if}
            </div>
            <ul class="validation-list">
              {#each Object.entries(formValidation) as [key, section]}
                <li class="validation-item" class:completed={section.isValid()}>
                  <span class="validation-check">
                    {#if section.isValid()}✓{:else}•{/if}
                  </span>
                  <span class="validation-text">{section.title}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        <div class="submit-button-container">
          <button 
            type="submit" 
            class="submit-button"
            disabled={!isFormValid || isSubmitting}
          >
            <span>
              {getTranslation('form.submitBooking')}
            </span>
          </button>
        </div>
        {#if submitSuccess}
          <div class="success-overlay" transition:fade>
            <div class="success-modal" transition:scale={{duration: 400, start: 0.95}}>
              <div class="success-icon" in:scale={{duration: 600, delay: 200, start: 0.5}} style="--pb-logo: url({pbLogo})"></div>
              <h2>{getTranslation('form.confetti.title')}</h2>
              <p>{getTranslation('form.success')}</p>
              <a href={translations.currentLanguage === 'nl' ? 'https://poembooth.com' : 'https://poembooth.com/en'} 
                 class="back-button">
                {getTranslation('form.confetti.backButton')}
              </a>
            </div>
          </div>
        {/if}
        {#if submitError}
          <div class="description-text-2">
            <span class="description-text-span2 error">{submitError}</span>
          </div>
        {/if}
        {#if formErrors.length > 0}
          <div class="error-message" transition:fade>
            <p>{getTranslation('form.pleaseComplete')}:</p>
            <ul>
              {#each formErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </form>
</div>

{#if isSubmitting}
  <div class="loading-overlay" transition:fade>
    <div class="loading-spinner"></div>
  </div>
{/if}
