<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { fade } from 'svelte/transition';
  import { 
    eventService, 
    organizationService, 
    locationService, 
    personService,
    reservationsService,
    productService,
    countryUtils
  } from "../services/airtable";
  import type { EventFields } from 'types/Event';
  import { writable } from 'svelte/store';
  import { dateTimeUtils } from '../services/airtable/utils';
  import flatpickr from 'flatpickr';
  import { Dutch } from 'flatpickr/dist/l10n/nl.js';
  import 'flatpickr/dist/flatpickr.css';
  import confetti from 'canvas-confetti';

  export let translations;

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
  
  mapboxgl.accessToken = MAPBOX_TOKEN;

  let className = "";
  let startDate = "2025-01-15";
  let startTime = "09:00";
  let endDate = "2025-01-15";
  let endTime = "17:00";
  let eventName = ""; // Ensure eventName is correctly set from user input
  let totalPrice = 0;
  let transportFee = 0;
  let locationName = "";
  let deliveryAddress = "";
  let suggestions = [];
  let distanceError = "";
  let calculatedDistance = 0; // Store the calculated distance at component level
  let extrasPrice = 0;
  let language = '';
  let brandingAdded = false;
  let themaAdded = false;
  let getRoastedAdded = false;
  let printOptionSelected = false;
  let eventDays = 1;
  let extrasList = [];
  let selectedLanguages = [];
  let selectedLanguage = 'Empty';
  let currentPath = '';
  const languagePrice = 125;
  let primaryLanguage = "Dutch"; // Default to Dutch
  let isSubmitting = false;
  let submitError = '';
  let companyName = '';
  let contactName = '';
  let email = '';
  let emailError = '';
  let invoiceContactEmail = '';
  let invoiceEmailError = '';
  let vatNumber = '';
  let billingAddressInput = '';
  let invoiceContactName = '';
  let invoiceContactPhone = '';
  let hasDifferentInvoiceContact = false;
  let reservationType = 'info'; // Add this near the top of the script with other variables
  let originAddress = "Gedempt Hamerkanaal 111, 1021KP Amsterdam, The Netherlands";
  let originCoordinates = [];
  let isDefinitive = false;
  let submitSuccess = false;
  let poNumber = '';
  let dateRangePicker;
  let currentLang = 'nl';
  const t = translations;
  let languageTranslations = {};
  let contactPhone = '';
  let invoiceCompanyName = '';
  let couponCode = '';
  let couponDiscount = 0;
  let couponError = '';

  // Update translations when language changes
  $: {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    currentLang = path.startsWith('/en') ? 'en' : 'nl';
  }

  $: {
    if (translations && translations.languages && translations.languages.language) {
      languageTranslations = {
        "Dutch": translations.languages.language.Dutch || "Nederlands",
        "English": translations.languages.language.English || "Engels",
        "Arabic": translations.languages.language.Arabic || "Arabisch",
        "Bengali": translations.languages.language.Bengali || "Bengali",
        "Bulgarian": translations.languages.language.Bulgarian || "Bulgaars",
        "Croatian": translations.languages.language.Croatian || "Kroatisch",
        "Czech": translations.languages.language.Czech || "Tsjechisch",
        "French": translations.languages.language.French || "Frans",
        "German": translations.languages.language.German || "Duits",
        "Greek": translations.languages.language.Greek || "Grieks",
        "Hindi": translations.languages.language.Hindi || "Hindi",
        "Hungarian": translations.languages.language.Hungarian || "Hongaars",
        "Italian": translations.languages.language.Italian || "Italiaans",
        "Mandarin": translations.languages.language.Mandarin || "Mandarijn",
        "Polish": translations.languages.language.Polish || "Pools",
        "Portuguese": translations.languages.language.Portuguese || "Portugees",
        "Romanian": translations.languages.language.Romanian || "Roemeens",
        "Russian": translations.languages.language.Russian || "Russisch",
        "Spanish": translations.languages.language.Spanish || "Spaans",
        "Slovak": translations.languages.language.Slovak || "Slowaaks"
      };
      console.log('Language Translations:', languageTranslations);
    }
  }

  $: {
    currentPath = window.location.pathname;
    if (!selectedLanguages.length) {
      selectedLanguage = currentPath.startsWith('/en') ? 'English' : 'Dutch';
      selectedLanguages = [selectedLanguage];
    }
  }

  // Get product record IDs on component mount
  let productIds = {
    poemBooth: '',
    eventPartner: '',
    eventSpecialist: '',
    branding: '',
    theme: '',
    printer: '',
    roast: '',  
    transport: '',
    extraLanguage: ''  // Add Extra Language product
  };

  onMount(async () => {
    try {
      // Get all product records
      const poemBoothRecord = await productService.getByName('Poem Booth 1');
      const eventPartnerRecord = await productService.getByName('EVENTPARTNER');
      const eventSpecialistRecord = await productService.getByName('EVENTSPECIALIST');
      const brandingRecord = await productService.getByName('Branding');
      const themeRecord = await productService.getByName('Theme');
      const standardPrinterRecord = await productService.getByName('Printer 1');  
      const roastRecord = await productService.getByName('Roast');  
      const transportRecord = await productService.getByName('Transport');
      const languageRecord = await productService.getByName('Extra Language');  

      // Store the record IDs
      productIds = {
        poemBooth: poemBoothRecord?.id || '',
        eventPartner: eventPartnerRecord?.id || '',
        eventSpecialist: eventSpecialistRecord?.id || '',
        branding: brandingRecord?.id || '',
        theme: themeRecord?.id || '',
        printer: standardPrinterRecord?.id || '',  
        roast: roastRecord?.id || '',  
        transport: transportRecord?.id || '',
        extraLanguage: languageRecord?.id || ''  
      };

      console.log('Product IDs:', productIds);  

      // Initialize map
      initializeMap();

      // Set initial values
      const initialDate = new Date();
      initialDate.setDate(initialDate.getDate() + 7); // One week from now
      
      startDate = initialDate.toISOString().split('T')[0];
      endDate = startDate;
      startTime = "09:00";
      endTime = "17:00";
      
      // Calculate initial price
      totalPrice = 950; // Set default price for one day
    } catch (error) {
      console.error('Error fetching product records:', error);
    }
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

  // Function to get origin coordinates
  async function initializeMap() {
    try {
      // Get origin coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          originAddress
        )}.json?access_token=${MAPBOX_TOKEN}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        originCoordinates = data.features[0].geometry.coordinates;
      } else {
        throw new Error('No coordinates found for origin address');
      }
    } catch (error) {
      console.error('Error getting origin coordinates:', error);
      distanceError = t.errors.locationError;
    }
  }

  // Function to submit to Airtable
  async function submitToAirtable(formData) {
    try {
      console.log('Submitting to Airtable:', formData);  

      // Create main organization
      const mainOrg = await organizationService.create({
        'Name organization': formData.companyName,
        'Address': formData.invoiceAddressInput,
        'VAT NR': formData.vatNumber
      });

      // Create invoice organization if different
      let invoiceOrg = mainOrg;
      if (formData.hasDifferentInvoiceContact && formData.invoiceCompanyName) {
        invoiceOrg = await organizationService.create({
          'Name organization': formData.invoiceCompanyName,
          'Address': formData.invoiceAddressInput,
          'VAT NR': formData.vatNumber
        });
      }

      // Create main person record and link to main organization
      const mainPerson = await personService.create({
        'Name': formData.contactName,
        'Email': formData.contactEmail,
        'Mobile number': formData.contactPhone,
        'Type of person': 'Customer employee',
        'Organizations': [mainOrg.id]
      });

      // Handle invoice contact person
      let invoicePerson;
      if (formData.hasDifferentInvoiceContact) {
        // Create new person for invoice contact and link to invoice organization
        invoicePerson = await personService.create({
          'Name': formData.invoiceContactName,
          'Email': formData.invoiceContactEmail,
          'Mobile number': formData.invoiceContactPhone,
          'Type of person': 'Customer employee',
          'Organizations': [invoiceOrg.id]
        });
      } else {
        // Use main person as invoice person
        invoicePerson = mainPerson;
      }

      // Create event with detailed order information
      const eventRecord = await eventService.create({
        'Event name': formData.eventName,
        'Starts at': `${formData.startDate}T${formData.startTime}:00.000+01:00`,
        'Stops at': `${formData.endDate}T${formData.endTime}:00.000+01:00`,
        'Reserved by': [mainOrg.id],
        'Contact person': [mainPerson.id],
        'Accounts payable clerk': [invoicePerson.id],  // Link the appropriate person as accounts payable clerk
        'Status': 'concept',
        'Payment status': formData.makeReservationFinal ? 'Invoice requested' : 'Proposal requested',
        'Languages': selectedLanguages,
        'PO number': formData.poNumber,
        'Location': formData.deliveryAddress,
        'Total Distance (km)': calculatedDistance * (formData.startDate !== formData.endDate ? 4 : 2),
        'Event created by': 'Online'
      });

      console.log('Created event:', eventRecord);  

      // Create reservation records
      const baseReservation = await reservationsService.create({
        'Order': [productIds.poemBooth],  
        'Event name': [eventRecord.id]
      });

      // Create EVENTPARTNER or EVENTSPECIALIST reservation based on discount
      if (formData.couponCode === 'EVENTPARTNER' && productIds.eventPartner) {
        await reservationsService.create({
          'Order': [productIds.eventPartner],  
          'Event name': [eventRecord.id]
        });
      } else if (formData.couponCode === 'EVENTSPECIALIST' && productIds.eventSpecialist) {
        await reservationsService.create({
          'Order': [productIds.eventSpecialist],  
          'Event name': [eventRecord.id]
        });
      }

      if (formData.brandingAdded && productIds.branding) {
        await reservationsService.create({
          'Order': [productIds.branding],  
          'Event name': [eventRecord.id]
        });
      }

      if (formData.themaAdded && productIds.theme) {
        await reservationsService.create({
          'Order': [productIds.theme],  
          'Event name': [eventRecord.id]
        });
      }

      if (formData.printOptionSelected && productIds.printer) {
        console.log('Creating printer reservation with ID:', productIds.printer);  
        await reservationsService.create({
          'Order': [productIds.printer],  
          'Event name': [eventRecord.id]
        });
      }

      if (formData.getRoastedAdded && productIds.roast) {  
        console.log('Creating Roast reservation with ID:', productIds.roast);  
        await reservationsService.create({
          'Order': [productIds.roast],  
          'Event name': [eventRecord.id]
        });
      }

      if (formData.transportFee > 0 && productIds.transport) {
        await reservationsService.create({
          'Order': [productIds.transport],  
          'Event name': [eventRecord.id]
        });
      }

      // Create reservations for additional languages (excluding the first language)
      if (selectedLanguages.length > 1 && productIds.extraLanguage) {
        console.log('Creating Extra Language reservations for:', selectedLanguages.slice(1));
        for (let i = 1; i < selectedLanguages.length; i++) {
          await reservationsService.create({
            'Order': [productIds.extraLanguage],
            'Event name': [eventRecord.id]
          });
        }
      }

      console.log('Airtable response:', { mainOrg, invoiceOrg, event: eventRecord });  
      return { mainOrg, invoiceOrg, event: eventRecord };
    } catch (error) {
      console.error('Error submitting to Airtable:', error);
      throw error;
    }
  }

  // EU countries list
  const EU_COUNTRIES = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
    'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
    'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
    'Spain', 'Sweden'
  ];

  function isEUCountry(country: string | null | undefined): boolean {
    if (!country) return false;
    
    // First normalize the country name using our utility function
    try {
      const normalizedCountry = countryUtils.normalizeCountry(country);
      console.log('Normalized country:', normalizedCountry);
      return EU_COUNTRIES.includes(normalizedCountry);
    } catch (error) {
      console.error('Error normalizing country in isEUCountry:', error);
      return false;
    }
  }

  // Email Validation
  function validateEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  }
  
  function handleEmailChange(event: Event) {
      const target = event.target as HTMLInputElement;
      email = target.value;
      if (email && !validateEmail(email)) {
          emailError = 'Voer een geldig e-mailadres in';
      } else {
          emailError = '';
      }
  }

  function handleInvoiceEmailChange(event: Event) {
    const target = event.target as HTMLInputElement;
    invoiceContactEmail = target.value;
    if (invoiceContactEmail && !validateEmail(invoiceContactEmail)) {
        invoiceEmailError = 'Voer een geldig e-mailadres in';
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
      invoiceCompanyName = companyName;
    } else {
      // Clear invoice contact fields
      invoiceContactName = '';
      invoiceContactEmail = '';
      invoiceContactPhone = '';
      invoiceCompanyName = '';
    }
  }

  $: if (!hasDifferentInvoiceContact) {
    invoiceContactName = contactName;
    invoiceContactEmail = email;
    invoiceContactPhone = contactPhone;
    invoiceCompanyName = companyName;
  }

  async function handleAddressInput(event: Event) {
    const target = event.target as HTMLInputElement;
    deliveryAddress = target.value;
    
    if (deliveryAddress.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${MAPBOX_TOKEN}&language=${currentLang === 'en' ? 'en' : 'nl'}&types=address,place`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.features) {
          suggestions = data.features.map(feature => ({
            text: feature.place_name,
            coordinates: feature.geometry.coordinates,
            context: feature.context || []
          }));
        } else {
          suggestions = [];
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        suggestions = [];
      }
    } else {
      suggestions = [];
    }
  }

  async function selectAddress(suggestion: { text: string, coordinates: [number, number], context: any[] }) {
    deliveryAddress = suggestion.text;
    suggestions = [];

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

  function getAddressComponents(address: string): AddressComponents {
    const components: AddressComponents = {
      address_line_1: '',
      address_line_2: '',
      city: '',
      postal_code: '',
      country: ''
    };
    
    if (!address) return components;

    // Split the address into parts by commas
    const parts = address.split(',').map(part => part.trim()).filter(Boolean);
    
    if (parts.length === 0) return components;

    // First part is always address line 1
    components.address_line_1 = parts[0];

    if (parts.length === 1) return components;

    // Last part is usually the country
    if (parts.length >= 3) {
      components.country = parts[parts.length - 1];
      parts.pop();
    }

    // Second to last part usually contains city and postal code
    if (parts.length >= 2) {
      const cityPostalPart = parts[parts.length - 1];
      
      // Try to extract postal code if present
      const postalMatch = cityPostalPart.match(/([A-Z0-9]{2,}\s*[A-Z0-9]+)/i);
      if (postalMatch) {
        components.postal_code = postalMatch[1].trim();
        components.city = cityPostalPart.replace(postalMatch[1], '').trim();
      } else {
        components.city = cityPostalPart.trim();
      }
      parts.pop();
    }

    // Remaining parts go to address line 2
    if (parts.length >= 2) {
      components.address_line_2 = parts.slice(1).join(', ');
    }

    return components;
  }

  async function calculateTransportFee() {
    distanceError = "";
    if (deliveryAddress && originCoordinates.length > 0) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${MAPBOX_TOKEN}&language=${currentLang === 'en' ? 'en' : 'nl'}&types=address,place`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          const directionsResponse = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates[0]},${originCoordinates[1]};${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
          );
          const directionsData = await directionsResponse.json();
          
          if (directionsData.routes.length > 0) {
            calculatedDistance = directionsData.routes[0].distance / 1000; // Store in component-level variable
            
            if (calculatedDistance > 300) {
              transportFee = 0;
              distanceError = t.errors.distanceError;
            } else {
              transportFee = totalDistance; // Use total distance for fee (× 2 or × 4)
            }
          }
        }
      } catch (error) {
        console.error('Error calculating transport fee:', error);
        distanceError = t.errors.locationError;
      }
    }
  }

  // Calculate total distance based on event days
  $: totalDistance = calculatedDistance > 0 ? (eventDays > 1 ? calculatedDistance * 4 : calculatedDistance * 2) : 0;

  function calculateEventDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Update event days when dates change
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
        
        // Add to extras list for pricing
        if (selectedLanguages.length > 1) {
          const existingLanguageExtra = extrasList.find(e => e.id === 'language');
          if (existingLanguageExtra) {
            extrasList = extrasList.map(e => 
              e.id === 'language' 
                ? { ...e, price: (selectedLanguages.length - 1) * 125 }
                : e
            );
          } else {
            extrasList = [...extrasList, { id: 'language', price: 125 }];
          }
          calculateExtrasPrice();
        }
      }
    }
  }

  function removeLanguage(lang: string) {
    if (lang === primaryLanguage) {
      return; // Don't allow removal of primary language
    }
    selectedLanguages = selectedLanguages.filter(l => l !== lang);
    
    // Update extras list for pricing
    if (selectedLanguages.length > 1) {
      extrasList = extrasList.map(e => 
        e.id === 'language' 
          ? { ...e, price: (selectedLanguages.length - 1) * 125 }
          : e
      );
    } else {
      extrasList = extrasList.filter(e => e.id !== 'language');
    }
    calculateExtrasPrice();
  }

  function addLanguage(language: string) {
    if (!selectedLanguages.includes(language)) {
      selectedLanguages = [...selectedLanguages, language];
      extrasList = [...extrasList, { id: `lang-${language}`, price: languagePrice }];
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
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start date

      if (diffDays === 1) {
        totalPrice = 950;
      } else if (diffDays === 2) {
        totalPrice = 950 + 750;
      } else if (diffDays >= 3) {
        totalPrice = 950 + 750 + ((diffDays - 2) * 100);
      }
    }
  }

  function calculatePoemBoothPrice(days: number): number {
    if (days <= 0) return 0;
    if (days === 1) return 950;  // First day
    if (days === 2) return 950 + 750;  // First + second day
    return 950 + 750 + ((days - 2) * 100);  // First + second + continuation days
  }

  // Invoice Address Handling
  let invoiceAddressInput = '';
  let invoiceAddressSuggestions = [];
  let billingAddressComponents = null;

  async function handleInvoiceAddressInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    invoiceAddressInput = input;
    
    if (input.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            input
          )}.json?access_token=${MAPBOX_TOKEN}&language=${currentLang === 'en' ? 'en' : 'nl'}&types=address,place,country&limit=5`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Mapbox response:', data);
        invoiceAddressSuggestions = data.features;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        invoiceAddressSuggestions = [];
      }
    } else {
      invoiceAddressSuggestions = [];
    }
  }

  function selectInvoiceAddress(suggestion: any) {
    console.log('Selected suggestion:', suggestion);
    invoiceAddressInput = suggestion.place_name;
    invoiceAddressSuggestions = [];
    try {
      billingAddressComponents = getAddressComponents(invoiceAddressInput);
      console.log('Billing address components:', billingAddressComponents);
      console.log('Is EU country?', isEUCountry(billingAddressComponents?.country));
      console.log('Is Netherlands?', billingAddressComponents?.country === 'Netherlands');
    } catch (error) {
      console.error('Error parsing invoice address:', error);
      billingAddressComponents = null;
    }
  }

  // Update billing components when invoice address changes
  $: {
    if (invoiceAddressInput) {
      try {
        console.log('Raw invoice address:', invoiceAddressInput);
        billingAddressComponents = getAddressComponents(invoiceAddressInput);
        console.log('Billing address components:', billingAddressComponents);
        console.log('Country (raw):', billingAddressComponents.country);
        console.log('Is EU country?', isEUCountry(billingAddressComponents.country));
        console.log('Is Netherlands?', billingAddressComponents.country === 'Netherlands');
        console.log('Should show VAT field?', 
          isEUCountry(billingAddressComponents.country) && 
          billingAddressComponents.country !== 'Netherlands'
        );
      } catch (error) {
        console.error('Error parsing invoice address:', error);
        billingAddressComponents = null;
      }
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
    calculateCouponDiscount();
  }

  function calculateCouponDiscount() {
    const code = couponCode.toUpperCase().trim();
    if (code === 'EVENTSPECIALIST') {
      couponDiscount = 100;
      couponError = '';
    } else if (code === 'EVENTPARTNER') {
      if (themaAdded && brandingAdded) {
        couponDiscount = 750;
        couponError = '';
      } else {
        couponDiscount = 0;
        if (code !== '') {
          couponError = t.coupon.eventPartnerInvalid;
        }
      }
    } else if (code !== '') {
      couponDiscount = 0;
      couponError = t.coupon.invalid;
    } else {
      couponDiscount = 0;
      couponError = '';
    }
  }

  // Recalculate coupon discount when Theme or Branding changes
  $: {
    if (themaAdded !== undefined || brandingAdded !== undefined) {
      calculateCouponDiscount();
    }
  }

  $: totalPrice = calculateRentalPrice(eventDays) + extrasPrice + transportFee;
  $: vatAmount = totalPrice * 0.21;
  $: totalPriceInclVat = totalPrice + vatAmount;

  $: priceBeforeVat = totalPrice - couponDiscount;
  $: vatAmountAfterDiscount = priceBeforeVat * 0.21;
  $: totalPriceWithDiscountInclVat = priceBeforeVat + vatAmountAfterDiscount;

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    isSubmitting = true;
    
    try {
      const formData = {
        contactName,
        contactEmail: email,
        contactPhone,
        companyName,
        eventName,
        startDate,
        endDate,
        startTime,
        endTime,
        selectedLanguages,
        brandingAdded,
        themaAdded,
        printOptionSelected,
        getRoastedAdded,
        transportFee,
        totalPrice: totalPrice + transportFee + extrasPrice - couponDiscount,
        invoiceAddressInput,
        invoiceContactName: hasDifferentInvoiceContact ? invoiceContactName : contactName,
        invoiceContactEmail: hasDifferentInvoiceContact ? invoiceContactEmail : email,
        invoiceContactPhone: hasDifferentInvoiceContact ? invoiceContactPhone : contactPhone,
        invoiceCompanyName: hasDifferentInvoiceContact ? invoiceCompanyName : companyName,
        vatNumber,
        poNumber,
        makeReservationFinal: isDefinitive,
        deliveryAddress,  
        hasDifferentInvoiceContact,
        couponCode
      };

      await submitToAirtable(formData);
      submitSuccess = true;
      triggerSuccessAnimation();
    } catch (error) {
      console.error('Error submitting form:', error);
      submitError = t.errors.submitError;
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
</script>

<div class="inclusief">
  <h1 class="h1">{t.extras.title}</h1>
  <div class="features">
    <!-- Date Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Date.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.dateTime.startDate}</span>
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
          <span class="description-text-span" style="margin-top: 12px;">{t.dateTime.endDate}</span>
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
          <span class="description-text-span2" style="margin-top: 12px;">{t.dateTime.baseRental}: {formatCurrency(calculateRentalPrice(eventDays))}</span>
        </div>
      </div>
    </div>

    <!-- Location Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Location.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.transport.deliveryAddress}</span>
          <span class="description-text-span2">{t.transport.costPerKm}</span>
          <div class="input-container">
            <input 
              type="text" 
              class="text" 
              id="deliveryAddress" 
              name="deliveryAddress"
              bind:value={deliveryAddress}
              on:input={handleAddressInput}
              required
              placeholder={t.transport.deliveryAddressPlaceholder}
            >
            {#if suggestions.length > 0}
              <div class="suggestions">
                {#each suggestions as suggestion}
                  <div 
                    class="suggestion"
                    on:click={() => selectAddress(suggestion)}
                  >
                    {suggestion.text}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          {#if distanceError}
            <div class="error-message">{@html distanceError}</div>
          {/if}
          {#if calculatedDistance > 0 && !distanceError}
            <span class="description-text-span2" style="margin-top: 12px;">
              {t.transport.transportCost}: {formatCurrency(transportFee)}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Language Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Taal.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.extras.language.title}</span>
          <span class="description-text-span2">{t.extras.language.description}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{t.extras.language.price}</span>
        </div>
        <div class="description-text">
          <div class="language-selection-container">
            <div class={'dropdown-language ' + className}>
              <select class="language-select" on:change={handleLanguageChange} bind:value={selectedLanguage}>
                <option value="Empty">{t.extras.language.select}</option>
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

    <!-- Print Option Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Print.jpg');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.extras.printOption.title}</span>
          <span class="description-text-span2">{t.extras.printOption.description}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(500 * calculateEventDays(startDate, endDate))}</span>
        </div>
        <div class="button" class:selected={printOptionSelected} on:click={togglePrintOption}>
          {printOptionSelected ? t.common.remove : t.common.add}
        </div>
      </div>
    </div>

    <!-- Branding Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Branding.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.extras.branding.title}</span>
          <span class="description-text-span2">{t.extras.branding.description}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(750)}</span>
        </div>
        <div class="button" class:selected={brandingAdded} on:click={toggleBranding}>
          {brandingAdded ? t.common.remove : t.common.add}
        </div>
      </div>
    </div>

    <!-- Thema Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Thema.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.extras.theme.title}</span>
          <span class="description-text-span2">{t.extras.theme.description}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(750)}</span>
        </div>
        <div class="button" class:selected={themaAdded} on:click={toggleThema}>
          {themaAdded ? t.common.remove : t.common.add}
        </div>
      </div>
    </div>

    <!-- Get Roasted Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/RB.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.extras.getRoasted.title}</span>
          <span class="description-text-span2">{t.extras.getRoasted.description}</span>
        </div>
        <div class="description-text">
          <span class="description-text-span2">{formatCurrency(350)}</span>
        </div>
        <div class="button" class:selected={getRoastedAdded} on:click={toggleGetRoasted}>
          {getRoastedAdded ? t.common.remove : t.common.add}
        </div>
      </div>
    </div>

    <!-- Coupon Card -->
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Coupon.png');"></div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{t.coupon.title}</span>
          <span class="description-text-span2">{t.coupon.description}</span>
          <div class="input-container">
            <input 
              type="text" 
              class="text" 
              bind:value={couponCode}
              on:input={handleCouponCode}
              placeholder={t.coupon.placeholder}
            >
          </div>
          {#if couponError}
            <div class="error-message">{couponError}</div>
          {/if}
          {#if couponDiscount > 0}
            <span class="description-text-span2" style="margin-top: 12px; color: #326334;">
              {t.pricing.discount}: -{formatCurrency(couponDiscount)}
            </span>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<div class="datum-en-tijd">
  <h1 class="h1">{t.pricing.overview}</h1>
  <table class="price-overview">
    <thead>
      <tr>
        <th>{t.pricing.quantity}</th>
        <th>{t.pricing.description}</th>
        <th>{t.pricing.price}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{calculateEventDays(startDate, endDate)}</td>
        <td>{t.pricing.rentalDays}</td>
        <td>{formatCurrency(calculateRentalPrice(eventDays))}</td>
      </tr>
      <tr>
        <td>{formatNumber(transportFee)}</td>
        <td>{t.transport.kmRate}</td>
        <td>{formatCurrency(transportFee)}</td>
      </tr>
      {#if selectedLanguages.length > 0}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => removeLanguage(selectedLanguages[0])}>x</button>
              <span>{languageTranslations[selectedLanguages[0]]} {t.languages.complimentary}</span>
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
              <button class="remove-icon" on:click={() => removeLanguage(language)}>x</button>
              <span>{languageTranslations[language]}</span>
            </div>
          </td>
          <td>{formatCurrency(languagePrice)}</td>
        </tr>
      {/each}
      {#if brandingAdded}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => brandingAdded = false}>x</button>
              <span>{t.extras.branding.title}</span>
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
              <button class="remove-icon" on:click={() => themaAdded = false}>x</button>
              <span>{t.extras.theme.title}</span>
            </div>
          </td>
          <td>{formatCurrency(750)}</td>
        </tr>
      {/if}
      {#if printOptionSelected}
        <tr>
          <td>{calculateEventDays(startDate, endDate)}</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={togglePrintOption}>x</button>
              <span>{t.extras.printOption.title}</span>
            </div>
          </td>
          <td>{formatCurrency(500 * calculateEventDays(startDate, endDate))}</td>
        </tr>
      {/if}
      {#if getRoastedAdded}
        <tr>
          <td>1</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={() => getRoastedAdded = false}>x</button>
              <span>{t.extras.getRoasted.title}</span>
            </div>
          </td>
          <td>{formatCurrency(350)}</td>
        </tr>
      {/if}
    </tbody>
    <tfoot>
      {#if couponDiscount > 0}
        <tr>
          <td colspan="2">{t.pricing.discount}</td>
          <td>-{formatCurrency(couponDiscount)}</td>
        </tr>
      {/if}
      <tr>
        <td colspan="2">{t.pricing.total}</td>
        <td>{formatCurrency(priceBeforeVat)}</td>
      </tr>
      <tr>
        <td colspan="2">{t.pricing.vat}</td>
        <td>{formatCurrency(vatAmountAfterDiscount)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>{t.pricing.totalInclVat}</strong></td>
        <td><strong>{formatCurrency(totalPriceWithDiscountInclVat)}</strong></td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="datum-en-tijd">
  <form on:submit={handleSubmit}>
    <div class="frame">
      <h1 class="h1">{t.form.title}</h1>
    </div>
    <div class="form-section">
        <div class="frame">
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf required-field">{t.form.name}:</div>
                </div>
                <div class="frame">
                    <input 
                        type="text" 
                        class="text" 
                        id="name" 
                        name="name"
                        bind:value={contactName}
                        required
                        placeholder={t.form.namePlaceholder}
                    >
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf required-field">{t.form.email}:</div>
                </div>
                <div class="frame relative">
                    <input 
                        type="email" 
                        class="text {emailError ? 'error' : ''}" 
                        id="email" 
                        name="email"
                        bind:value={email}
                        on:input={handleEmailChange}
                        pattern="[^@\s]+@[^\s@]+\.[^\s@]+"
                        required
                        placeholder={t.form.emailPlaceholder}
                    >
                    {#if emailError}
                        <div class="error-message">{emailError}</div>
                    {/if}
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf required-field">{t.form.phone}:</div>
                </div>
                <div class="frame">
                    <input 
                        type="tel" 
                        class="text" 
                        id="contact_phone" 
                        name="contact_phone"
                        bind:value={contactPhone}
                        required
                        placeholder={t.form.phonePlaceholder}
                    >
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf required-field">{t.form.organisation}:</div>
                </div>
                <div class="frame">
                    <input 
                        type="text" 
                        class="text" 
                        id="organisation" 
                        name="organisation"
                        bind:value={companyName}
                        required
                        placeholder={t.form.organisationPlaceholder}
                    >
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf required-field">{t.form.event}:</div>
                </div>
                <div class="frame">
                    <input 
                        type="text" 
                        class="text" 
                        id="event" 
                        name="event"
                        bind:value={eventName}
                        required
                        placeholder={t.form.eventPlaceholder}
                    >
                </div>
            </div>
        </div>
    </div>

    <div class="form-section">
        <div class="frame">
            <div>
              <div class="checkbox-option invoice-different">
                <input 
                  type="checkbox" 
                  id="definitive" 
                  name="definitive"
                  bind:checked={isDefinitive}
                  on:change={toggleDefinitive}
                >
                <label for="definitive" class="p">{t.form.definitiveLabel}</label>
              </div>
            
              {#if isDefinitive}
                <div id="invoice-fields">
                  <div class="frame">
                    <div class="checkbox-option invoice-different">
                      <input 
                        type="checkbox" 
                        id="different_contact" 
                        name="different_contact"
                        bind:checked={hasDifferentInvoiceContact}
                        on:change={toggleInvoiceContact}
                      >
                      <label for="different_contact" class="p">{t.form.differentContact}</label>
                    </div>

                    <div class="frame-row">
                      <div class="frame-item">
                        <div class="vanaf required-field">{t.form.invoiceAddress}:</div>
                      </div>
                      <div class="frame relative">
                        <input 
                          type="text" 
                          class="text" 
                          id="invoice_address" 
                          name="invoice_address"
                          bind:value={invoiceAddressInput}
                          on:input={handleInvoiceAddressInput}
                          required
                          placeholder={t.form['invoice-address-placeholder']}
                        >
                        {#if invoiceAddressSuggestions.length > 0}
                          <div class="suggestions">
                            {#each invoiceAddressSuggestions as suggestion}
                              <div 
                                class="suggestion"
                                on:click={() => selectInvoiceAddress(suggestion)}
                              >
                                {suggestion.place_name}
                              </div>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>

                    {#if isDefinitive && invoiceAddressInput && billingAddressComponents}
                      {#if isEUCountry(billingAddressComponents?.country) && billingAddressComponents?.country !== 'Netherlands'}
                        <div class="frame-row">
                          <div class="frame-item">
                            <div class="vanaf">{t.form['vat-number']}:</div>
                          </div>
                          <div class="frame">
                            <input 
                              type="text" 
                              class="text" 
                              id="vat_number" 
                              name="vatNumber"
                              bind:value={vatNumber}
                              placeholder={t.form.vatNumberPlaceholder.replace('%s', t.languages.language[billingAddressComponents.country] || billingAddressComponents.country)}
                            >
                          </div>
                        </div>
                      {/if}
                    {/if}

                    <div class="frame-row">
                      <div class="frame-item">
                        <div class="vanaf">{t.form.poNumber}:</div>
                      </div>
                      <div class="frame">
                        <input 
                          type="text" 
                          class="text" 
                          id="po_number" 
                          name="po_number"
                          bind:value={poNumber}
                          placeholder={t.form.poNumberPlaceholder}
                        >
                      </div>
                    </div>

                    {#if hasDifferentInvoiceContact}
                      <div class="frame-row">
                        <div class="frame-item">
                          <div class="vanaf required-field">{t.form.invoiceCompany}:</div>
                        </div>
                        <div class="frame">
                          <input 
                            type="text" 
                            class="text" 
                            id="invoice_company" 
                            name="invoice_company"
                            bind:value={invoiceCompanyName}
                            required
                            placeholder={t.form.invoiceCompanyPlaceholder}
                          >
                        </div>
                      </div>

                      <div class="frame-row">
                        <div class="frame-item">
                          <div class="vanaf required-field">{t.form.invoiceContactName}:</div>
                        </div>
                        <div class="frame">
                          <input 
                            type="text" 
                            class="text" 
                            id="invoice_contact_name" 
                            name="invoice_contact_name"
                            bind:value={invoiceContactName}
                            required
                            placeholder={t.form.namePlaceholder}
                          >
                        </div>
                      </div>

                      <div class="frame-row">
                        <div class="frame-item">
                          <div class="vanaf required-field">{t.form.invoiceContactEmail}:</div>
                        </div>
                        <div class="frame relative">
                          <input 
                            type="email" 
                            class="text {invoiceEmailError ? 'error' : ''}" 
                            id="invoice_contact_email" 
                            name="invoice_contact_email"
                            bind:value={invoiceContactEmail}
                            on:input={handleInvoiceEmailChange}
                            pattern="[^@\s]+@[^\s@]+\.[^\s@]+"
                            required
                            placeholder={t.form.emailPlaceholder}
                          >
                          {#if invoiceEmailError}
                            <div class="error-message">{invoiceEmailError}</div>
                          {/if}
                        </div>
                      </div>

                      <div class="frame-row">
                        <div class="frame-item">
                          <div class="vanaf required-field">{t.form.invoicePhone}:</div>
                        </div>
                        <div class="frame">
                          <input 
                            type="tel" 
                            class="text" 
                            id="invoice_phone" 
                            name="invoice_phone"
                            bind:value={invoiceContactPhone}
                            required
                            placeholder={t.form.phonePlaceholder}
                          >
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
        </div>
    </div>

    <div class="form-section">
        <div class="frame">
            <div class="checkbox-option">
                <input type="checkbox" id="dimensions" name="dimensions" required>
                <label for="dimensions" class="p">{@html t.form.dimensions}</label>
            </div>
            <div class="checkbox-option">
                <input type="checkbox" id="payment" name="payment" required>
                <label for="payment" class="p">{t.form.payment}</label>
            </div>
            <div class="checkbox-option">
                <input type="checkbox" id="terms" name="terms" required>
                <label for="terms" class="p">{@html t.form.terms}</label>
            </div>
            <div style="text-align: center;">
              {#if submitSuccess}
                <div class="success-overlay" transition:fade>
                  <div class="success-modal">
                    <div class="success-icon">🎉</div>
                    <h2>{t.form.confetti.title}</h2>
                    <p>{t.form.success}</p>
                    <a href={translations.currentLanguage === 'nl' ? 'https://poembooth.com' : 'https://poembooth.com/en'} 
                       class="back-button">
                      {t.form.confetti.backButton}
                    </a>
                  </div>
                </div>
              {/if}
              <div class="submit-button-container">
                <button 
                  type="submit" 
                  class="submit-button" 
                  disabled={isSubmitting}
                >
                  <span>{t.form.submit}</span>
                </button>
              </div>
              {#if submitError}
                <div class="error-message">
                  <ul>
                    {#each submitError.split('\n') as error}
                      <li>{error}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
        </div>
    </div>
</form>
</div>

{#if isSubmitting}
  <div class="loading-overlay" transition:fade>
    <div class="loading-spinner"></div>
  </div>
{/if}
