<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
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
  import { eventService } from '../services/airtable/eventService';
  import { organizationService } from '../services/airtable/organizationService';
  import { personService } from '../services/airtable/personService';
  import { reservationsService } from '../services/airtable/reservationsService';
  import { productService } from '../services/airtable/productService';
  import { countryUtils } from '../services/airtable/utils';
  import type { EventFields } from 'types/Event';
  import { writable } from 'svelte/store';
  import { dateTimeUtils } from '../services/airtable/utils';
  import flatpickr from 'flatpickr';
  import { Dutch } from 'flatpickr/dist/l10n/nl.js';
  import 'flatpickr/dist/flatpickr.css';
  import confetti from 'canvas-confetti';
  import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
  import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
  import type { Translations } from './types';

  export let translations: Translations;
  let currentLang = 'nl';

  function getTranslation(key) {
    if (!translations) {
      console.log('No translations found');
      return key;
    }
    
    const parts = key.split('.');
    let result = translations;
    
    for (const part of parts) {
      if (!result || typeof result[part] === 'undefined') {
        console.log('Missing translation for part:', part, 'in path:', key);
        return key;
      }
      result = result[part];
    }
    
    return result;
  }

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
  
  mapboxgl.accessToken = MAPBOX_TOKEN;

  let className = "";
  let startDate = "2025-01-15";
  let startTime = "09:00";
  let endDate = "2025-01-15";
  let endTime = "17:00";
  let eventName = ""; 
  let totalPrice = 0;
  let transportFee = 0;
  let locationName = "";
  let deliveryAddress = "";
  let suggestions = [];
  let distanceError = "";
  let calculatedDistance = 0; 
  let extrasPrice = 0;
  let language = '';
  let brandingAdded = false;
  let themaAdded = false;
  let getRoastedAdded = false;
  let keynoteAdded = false;
  let printOptionSelected = false;
  let eventDays = 1;
  let extrasList = [];
  let selectedLanguages = [];
  let selectedLanguage = 'Empty';
  let currentPath = '';
  const languagePrice = 125;
  let primaryLanguage = "Dutch"; 
  let isSubmitting = false;
  let submitError = '';
  let productIds = {
    poemBooth: null,
    eventPartner: null,
    eventSpecialist: null,
    extraLanguage: null,
    branding: null,
    theme: null,
    printer: null,
    roast: null,
    transport: null,
    keynote: null
  };
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
  let invoiceContactEmail = '';
  let invoiceEmailError = '';
  let invoiceContactName = '';
  let invoiceContactPhone = '';
  let hasDifferentInvoiceContact = false;
  let reservationType = 'info'; 
  let originAddress = "Gedempt Hamerkanaal 111, 1021KP Amsterdam, The Netherlands";
  let originCoordinates = [];
  let isDefinitive = false;
  let submitSuccess = false;
  let poNumber = '';
  let dateRangePicker;
  let languageTranslations = {};
  let couponCode = '';
  let couponDiscount = 0;
  let couponError = '';
  let addressComponents = {
    businessName: '',
    street: '',
    postalCode: '',
    city: '',
    country: ''
  };
  let deliveryBusinessName = '';
  let deliveryStreet = '';
  let deliveryPostalCode = '';
  let deliveryCity = '';
  let deliveryCountry = '';
  let showAddressFields = false;
  let selectedCoordinates = null;
  let staticMapUrl = "";
  let routeGeometry = null;
  let isMapLoading = false;
  let mapImageLoaded = false;
  let termsAccepted = false;
  let dimensionsAccepted = false;
  let paymentAccepted = false;
  let ageAccepted = false;

  // Local storage key for form data
  const STORAGE_KEY = 'datum-en-tijd-form-data';

  // Function to save form data to localStorage
  function saveFormData() {
    const formData = {
      // Basic form fields
      startDate,
      startTime,
      endDate,
      endTime,
      eventName,
      locationName,
      
      // Delivery address
      deliveryAddress,
      deliveryBusinessName,
      deliveryStreet,
      deliveryPostalCode,
      deliveryCity,
      deliveryCountry,
      
      // Language settings
      language,
      selectedLanguages,
      selectedLanguage,
      primaryLanguage,
      
      // Extras
      brandingAdded,
      themaAdded,
      getRoastedAdded,
      keynoteAdded,
      printOptionSelected,
      
      // Pricing and calculations
      transportFee,
      extrasPrice,
      extrasList,
      totalPrice,
      calculatedDistance,
      
      // Invoice address
      invoiceAddressInput,
      billingAddressComponents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }

  // Function to load form data from localStorage
  function loadFormData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      
      // Basic form fields
      startDate = data.startDate;
      startTime = data.startTime;
      endDate = data.endDate;
      endTime = data.endTime;
      eventName = data.eventName;
      locationName = data.locationName;
      
      // Delivery address
      deliveryAddress = data.deliveryAddress;
      deliveryBusinessName = data.deliveryBusinessName;
      deliveryStreet = data.deliveryStreet;
      deliveryPostalCode = data.deliveryPostalCode;
      deliveryCity = data.deliveryCity;
      deliveryCountry = data.deliveryCountry;
      
      // Language settings
      language = data.language;
      selectedLanguages = data.selectedLanguages;
      selectedLanguage = data.selectedLanguage;
      primaryLanguage = data.primaryLanguage;
      
      // Extras
      brandingAdded = data.brandingAdded;
      themaAdded = data.themaAdded;
      getRoastedAdded = data.getRoastedAdded;
      keynoteAdded = data.keynoteAdded;
      printOptionSelected = data.printOptionSelected;
      
      // Pricing and calculations
      transportFee = data.transportFee;
      extrasPrice = data.extrasPrice;
      extrasList = data.extrasList;
      totalPrice = data.totalPrice;
      calculatedDistance = data.calculatedDistance;
      
      // Invoice address
      invoiceAddressInput = data.invoiceAddressInput;
      billingAddressComponents = data.billingAddressComponents;
    }
  }

  // Clear form data from localStorage
  function clearFormData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  $: formValidation = {
    delivery: {
      title: getTranslation('form.sections.deliveryAddress'),
      isValid: () => deliveryStreet && deliveryPostalCode && deliveryCity && deliveryCountry
    },
    event: {
      title: getTranslation('form.sections.eventDetails'),
      isValid: () => eventName
    },
    language: {
      title: getTranslation('form.sections.language'),
      isValid: () => selectedLanguages.length > 0
    },
    personal: {
      title: getTranslation('form.sections.personalInfo'),
      isValid: () => contactName && email && validateEmail(email) && contactPhone
    },
    company: {
      title: getTranslation('form.sections.companyInfo'),
      isValid: () => accountName && address && postalCode && city && country
    },
    terms: {
      title: getTranslation('form.sections.termsAndConditions'),
      isValid: () => termsAccepted && dimensionsAccepted && paymentAccepted
    }
  };

  $: isFormValid = Object.values(formValidation).every(section => section.isValid());

  // Get all countries from translations
  const getAllCountries = () => {
    console.log('Translations:', translations);
    console.log('Countries:', translations?.languages?.countries);
    
    if (!translations?.languages?.countries) {
      console.error('No countries found in translations');
      return [];
    }

    // Priority countries in desired order
    const priorityCountries = [
      'Netherlands',
      'Belgium',
      'Germany',
      'France',
      'Luxembourg'
    ];

    // Get all countries and sort them alphabetically
    const otherCountries = Object.keys(translations.languages.countries)
      .filter(country => !priorityCountries.includes(country))
      .sort((a, b) => {
        const aTranslated = translations.languages.countries[a] || a;
        const bTranslated = translations.languages.countries[b] || b;
        return aTranslated.localeCompare(bTranslated);
      });

    // Combine priority countries with other countries
    return [...priorityCountries, ...otherCountries];
  };

  $: countries = getAllCountries();

  const EU_COUNTRIES = [
    'Netherlands',
    'Belgium',
    'Germany',
    'Luxembourg',
    'France',
    'Austria',
    'Bulgaria',
    'Croatia',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Estonia',
    'Finland',
    'Greece',
    'Hungary',
    'Ireland',
    'Italy',
    'Latvia',
    'Lithuania',
    'Malta',
    'Poland',
    'Portugal',
    'Romania',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden'
  ];

  function getTranslatedCountry(countryCode) {
    console.log('Translating country:', countryCode);
    const translatedCountry = translations?.languages?.countries?.[countryCode];
    console.log('Translated result:', translatedCountry);
    return translatedCountry || countryCode;
  }

  $: isEUCountry = (selectedCountry) => {
    return EU_COUNTRIES.includes(selectedCountry);
  };

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
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            originAddress
          )}.json?access_token=${MAPBOX_TOKEN}&types=address`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          originCoordinates = data.features[0].center;
          console.log('Origin coordinates set:', originCoordinates);
        } else {
          throw new Error('No features found for origin address');
        }
      } catch (error) {
        console.error('Error getting origin coordinates:', error);
        distanceError = getTranslation('errors.locationError');
        return;
      }

      // Initialize Mapbox geocoder
      const geocoder = new MapboxGeocoder({
        accessToken: MAPBOX_TOKEN,
        types: 'address',
        language: currentPath.startsWith('/en') ? 'en' : 'nl',
        placeholder: getTranslation('dateTime.address.search') || 'Zoek een adres'
      });

      // Add geocoder to the input element
      const geocoderContainer = document.getElementById('geocoder');
      if (geocoderContainer) {
        geocoder.addTo(geocoderContainer);
      }

      // Listen for result selection
      geocoder.on('result', (event) => {
        handleAddressSelect(event);
      });

      // Initialize datepicker
      const dateInput = document.getElementById('date-range');
      if (dateInput) {
        dateRangePicker = flatpickr(dateInput, {
          mode: 'range',
          dateFormat: 'Y-m-d',
          minDate: new Date().toISOString().split('T')[0],
          onChange: ([startDate, endDate]) => {
            if (startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              eventDays = diffDays;
              totalPrice = calculateRentalPrice(diffDays);
            }
          }
        });
      }

      // Get all product records
      console.log('Fetching product records...');
      
      const poemBoothRecord = await productService.getByName('Poem Booth 1');
      console.log('Poem Booth record:', poemBoothRecord);
      
      const eventPartnerRecord = await productService.getByName('EVENTPARTNER');
      console.log('Event Partner record:', eventPartnerRecord);
      
      const eventSpecialistRecord = await productService.getByName('EVENTSPECIALIST');
      console.log('Event Specialist record:', eventSpecialistRecord);
      
      const brandingRecord = await productService.getByName('Branding');
      console.log('Branding record:', brandingRecord);
      
      const themeRecord = await productService.getByName('Theme');
      console.log('Theme record:', themeRecord);
      
      const standardPrinterRecord = await productService.getByName('Printer 1');
      console.log('Printer record:', standardPrinterRecord);
      
      const roastRecord = await productService.getByName('Roast');
      console.log('Roast record:', roastRecord);
      
      const transportRecord = await productService.getByName('Transport');
      console.log('Transport record:', transportRecord);
      
      const languageRecord = await productService.getByName('Extra Language');
      console.log('Language record:', languageRecord);

      const keynoteRecord = await productService.getByName('Keynote');
      console.log('Keynote record:', keynoteRecord);

      // Store the record IDs
      productIds = {
        poemBooth: poemBoothRecord?.id || null,
        eventPartner: eventPartnerRecord?.id || null,
        eventSpecialist: eventSpecialistRecord?.id || null,
        extraLanguage: languageRecord?.id || null,
        branding: brandingRecord?.id || null,
        theme: themeRecord?.id || null,
        printer: standardPrinterRecord?.id || null,
        roast: roastRecord?.id || null,
        transport: transportRecord?.id || null,
        keynote: keynoteRecord?.id || null
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
        if (geocoderContainer && geocoder) {
          geocoderContainer.innerHTML = '';
        }
      };
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
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
      distanceError = getTranslation('errors.locationError');
    }
  }

  // Function to submit to Airtable
  async function submitToAirtable(formData) {
    try {
      console.log('Submitting to Airtable:', formData);  

      // Create organization record first
      const organizationFields = {
        'Name organization': formData.accountName,
        'Address': formData.address,
        'Postal code': formData.postalCode,
        'City': formData.city,
        'Country': formData.country,
        'VAT NR': formData.vatNumber,
        'Email': formData.contactEmail,
      };

      const organization = await organizationService.create(organizationFields);

      // Create main person record and link to main organization
      const mainPerson = await personService.create({
        'Name': formData.contactName,
        'Email': formData.contactEmail,
        'Mobile number': formData.contactPhone,
        'Type of person': 'Customer employee',
        'Organizations': [organization.id]
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
          'Organizations': [organization.id]
        });
      } else {
        // Use main person as invoice person
        invoicePerson = mainPerson;
      }

      // Format the complete address as a string
      const completeAddress = [
        deliveryBusinessName,
        deliveryStreet,
        [deliveryPostalCode, deliveryCity].filter(Boolean).join(' '),
        deliveryCountry
      ].filter(Boolean).join(', ');

      // Create event with detailed order information
      const eventRecord = await eventService.create({
        'Event name': formData.eventName,
        'Starts at': `${formData.startDate}T${formData.startTime}:00.000+01:00`,
        'Stops at': `${formData.endDate}T${formData.endTime}:00.000+01:00`,
        'Reserved by': [organization.id],
        'Contact person': [mainPerson.id],
        'Accounts payable clerk': [invoicePerson.id],
        'Status': 'concept',
        'Payment status': formData.makeReservationFinal ? 'Invoice requested' : 'Proposal requested',
        'Languages': selectedLanguages.join(', '), // Convert array to comma-separated string
        'PO number': formData.poNumber,
        'Location': completeAddress,
        'Total Distance (km)': calculatedDistance * (formData.startDate !== formData.endDate ? 4 : 2),
        'Event created by': 'Online'
      });

      console.log('Created event:', eventRecord);  

      // Create reservation records
      const baseReservation = await reservationsService.create({
        'Order': [productIds.poemBooth],  // Array of record IDs for linked records
        'Event name': [eventRecord.id]    // Array of record IDs
      });

      // Create EVENTPARTNER or EVENTSPECIALIST reservation based on discount
      if (formData.couponCode === 'EVENTPARTNER' && productIds.eventPartner) {
        await reservationsService.create({
          'Order': [productIds.eventPartner],  // Array of record IDs for linked records
          'Event name': [eventRecord.id]       // Array of record IDs
        });
      } else if (formData.couponCode === 'EVENTSPECIALIST' && productIds.eventSpecialist) {
        await reservationsService.create({
          'Order': [productIds.eventSpecialist],  // Array of record IDs for linked records
          'Event name': [eventRecord.id]          // Array of record IDs
        });
      }

      // Create reservations for each selected product
      if (formData.brandingAdded && productIds.branding) {
        await reservationsService.create({
          'Order': [productIds.branding],  // Array of record IDs for linked records
          'Event name': [eventRecord.id]   // Array of record IDs
        });
      }

      if (formData.themaAdded && productIds.theme) {
        await reservationsService.create({
          'Order': [productIds.theme],     // Array of record IDs for linked records
          'Event name': [eventRecord.id]   // Array of record IDs
        });
      }

      if (formData.printOptionSelected && productIds.printer) {
        console.log('Creating printer reservation with ID:', productIds.printer);
        await reservationsService.create({
          'Order': [productIds.printer],   // Array of record IDs for linked records
          'Event name': [eventRecord.id]   // Array of record IDs
        });
      }

      if (formData.getRoastedAdded && productIds.roast) {
        console.log('Creating Roast reservation with ID:', productIds.roast);
        await reservationsService.create({
          'Order': [productIds.roast],     // Array of record IDs for linked records
          'Event name': [eventRecord.id]   // Array of record IDs
        });
      }

      if (formData.keynoteAdded && productIds.keynote) {
        console.log('Creating Keynote reservation with ID:', productIds.keynote);
        await reservationsService.create({
          'Order': [productIds.keynote],     // Array of record IDs for linked records
          'Event name': [eventRecord.id]     // Array of record IDs for linked event
        });
      }

      if (formData.transportFee > 0 && productIds.transport) {
        await reservationsService.create({
          'Order': [productIds.transport], // Array of record IDs for linked records
          'Event name': [eventRecord.id]   // Array of record IDs
        });
      }

      // Create reservations for additional languages (excluding the first language)
      if (selectedLanguages.length > 1 && productIds.extraLanguage) {
        console.log('Creating Extra Language reservations for:', selectedLanguages.slice(1));
        for (let i = 1; i < selectedLanguages.length; i++) {
          await reservationsService.create({
            'Order': [productIds.extraLanguage],  // Array of record IDs for linked records
            'Event name': [eventRecord.id]        // Array of record IDs
          });
        }
      }

      console.log('Airtable response:', { organization, event: eventRecord });  
      return { organization, event: eventRecord };
    } catch (error) {
      console.error('Error submitting to Airtable:', error);
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
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            deliveryAddress
          )}.json?access_token=${MAPBOX_TOKEN}&language=${currentLang === 'en' ? 'en' : 'nl'}&types=address,place`
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

  async function handleAddressSelect(result) {
    const { result: { context = [], place_name = '', center = [] } = {} } = result;
    
    // Extract country from context
    const countryName = result.result.context.find(item => item.id.startsWith('country'))?.text;
    
    // Find the matching country in our list
    const matchingCountry = countries.find(c => getTranslatedCountry(c) === countryName);
    
    // Set the selected coordinates for the map
    selectedCoordinates = center;
    
    // Extract address components
    const streetNumber = result.result.address || '';
    const streetName = result.result.text || '';
    const postcodeContext = context.find(item => item.id.startsWith('postcode'))?.text || '';
    const cityContext = context.find(item => item.id.startsWith('place'))?.text || '';
    
    // Update delivery address fields
    deliveryStreet = `${streetName} ${streetNumber}`.trim();
    deliveryPostalCode = postcodeContext;
    deliveryCity = cityContext;
    if (matchingCountry) deliveryCountry = matchingCountry;

    // Show the address fields after selection
    showAddressFields = true;
    
    // Calculate distance if coordinates are available
    if (center && center.length === 2) {
      await calculateDistance(center);
    }

    // Save form data after address is selected
    saveFormData();
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
    
    // Use the actual route geometry in the URL
    const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/geojson(${encodeURIComponent(JSON.stringify(geojson))}),pin-s-warehouse+326334(${originLng},${originLat}),pin-s-car+326334(${destLng},${destLat})/[${bbox}]/500x400@2x?access_token=${MAPBOX_TOKEN}&style_filter=[{"id":"background","color":"#F0F9D5"},{"id":"water","color":"#C9DA9A"},{"id":"road","color":"#326334"},{"id":"road-secondary-tertiary","color":"#326334"},{"id":"road-primary","color":"#326334"}]`;
    
    console.log('Generated map URL:', url);
    return url;
  }

  async function calculateDistance(coordinates) {
    if (!originCoordinates || originCoordinates.length === 0) {
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
      const directionsResponse = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates[0]},${originCoordinates[1]};${lng},${lat}?geometries=polyline&access_token=${MAPBOX_TOKEN}`
      );

      if (!directionsResponse.ok) {
        throw new Error(`HTTP error! status: ${directionsResponse.status}`);
      }

      const directionsData = await directionsResponse.json();
      
      if (directionsData.routes && directionsData.routes.length > 0) {
        calculatedDistance = Math.round(directionsData.routes[0].distance / 1000); // Convert to km and round
        routeGeometry = directionsData.routes[0].geometry; // Store the route geometry
        console.log('Calculated distance:', calculatedDistance, 'km');
        
        if (calculatedDistance > 300) {
          calculatedDistance = calculatedDistance; // Keep the actual distance
          transportFee = 0;
          staticMapUrl = ""; // Clear map URL if distance too far
          routeGeometry = null;
          console.log('Distance too far:', calculatedDistance, 'km');
        } else {
          staticMapUrl = generateStaticMapUrl(originCoordinates, selectedCoordinates);
          await calculateTransportFee();
        }
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      calculatedDistance = 0;
      transportFee = 0;
      staticMapUrl = "";
      routeGeometry = null;
    }
  }

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
    if (selectedLanguages.length === 1) {
      return; // Don't allow removal if it's the only language
    }
    
    selectedLanguages = selectedLanguages.filter(l => l !== lang);
    
    // If we removed the primary language, set the first remaining language as primary
    if (lang === primaryLanguage && selectedLanguages.length > 0) {
      primaryLanguage = selectedLanguages[0];
    }
    
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
      // Calculate base rental price
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Base price is €950 per day
      let basePrice = 950 * diffDays;
      
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
      console.log('Is Netherlands?', billingAddressComponents?.country === 'Nederland');
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
        console.log('Is Netherlands?', billingAddressComponents.country === 'Nederland');
        console.log('Should show VAT field?', 
          isEUCountry(billingAddressComponents.country) && 
          billingAddressComponents.country !== 'Nederland'
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

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    isSubmitting = true;
    
    try {
      const formData = {
        accountName,
        address,
        postalCode,
        city,
        country,
        vatNumber,
        contactName,
        contactEmail: email,
        contactPhone,
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
        keynoteAdded,
        transportFee,
        totalPrice: totalPrice + transportFee + extrasPrice - couponDiscount,
        organizationId: null,
        makeReservationFinal: true,
        deliveryAddress,
        couponCode,
        deliveryBusinessName,
        deliveryStreet,
        deliveryPostalCode,
        deliveryCity,
        deliveryCountry
      };

      await submitToAirtable(formData);
      submitSuccess = true;
      triggerSuccessAnimation();
      clearFormData(); // Clear saved data after successful submission
    } catch (error) {
      console.error('Error submitting form:', error);
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
        deliveryAddress || deliveryBusinessName || deliveryStreet || deliveryPostalCode || deliveryCity || deliveryCountry ||  // Added all delivery fields
        language || brandingAdded || themaAdded || getRoastedAdded || 
        keynoteAdded || printOptionSelected || selectedLanguages.length || selectedLanguage ||
        transportFee || extrasPrice || extrasList.length || totalPrice || calculatedDistance ||
        invoiceAddressInput) {
      saveFormData();
    }
  }
</script>

<style>

:global(.text) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.input-container {
  width: 100%;
  max-width: 100%;
}

:global(#geocoder) {
  width: 100% !important;
  max-width: 100% !important;
}

:global(.mapboxgl-ctrl-geocoder) {
  width: 100% !important;
  max-width: 100% !important;
  box-shadow: none !important;
  font-family: "Inter", sans-serif !important;
  border: none !important;
  background: #326334 !important;
  border-radius: 7px !important;
  min-height: 50px !important;
}

/* Container styling */
:global(#geocoder) {
  width: 100% !important;
  background: #326334 !important;
  border-radius: 7px !important;
  margin-bottom: 8px !important;
}

:global(#geocoder > *) {
  width: 100% !important;
  background: #326334 !important;
}

:global(.mapboxgl-ctrl-geocoder--input) {
  height: 50px !important;
  border: none !important;
  background: #326334 !important;
  color: #C9DA9A !important;
  padding: 12px 16px !important;
  font-family: "Inter", sans-serif !important;
  font-size: 16px !important;
  min-height: 50px !important;
  width: 100% !important;
  margin: 0 !important;
  border-radius: 7px !important;
}

:global(.mapboxgl-ctrl-geocoder--input::placeholder) {
  color: #C9DA9A !important;
  opacity: 1 !important;
  font-family: "Inter", sans-serif !important;
  font-size: 16px !important;
  font-weight: normal !important;
}

:global(.mapboxgl-ctrl-geocoder--input:focus) {
  outline: none !important;
}

:global(.mapboxgl-ctrl-geocoder--icon) {
  display: none !important;
}

:global(.mapboxgl-ctrl-geocoder--button) {
  display: none !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestion-address) {
  color: #C9DA9A !important;
  opacity: 0.8 !important;
  font-size: 14px !important;
  margin-top: 4px !important;
  background: inherit !important;
}

/* Style the scrollbar to match the theme */
:global(.mapboxgl-ctrl-geocoder--suggestions::-webkit-scrollbar) {
  width: 6px !important;
  background: #326334 !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestions::-webkit-scrollbar-thumb) {
  background: rgba(201, 218, 154, 0.3) !important;
  border-radius: 3px !important;
}

/* Style Powered by Mapbox */
:global(.mapboxgl-ctrl-geocoder--powered-by) {
  color: #3e7440 !important;
  background: none !important;
}

:global(.mapboxgl-ctrl-geocoder--powered-by a) {
  color: #C9DA9A !important;
  text-decoration: none !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestions-wrapper) {
  display: block !important;
  background: #326334 !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestions) {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  right: 0 !important;
  background: #326334 !important;
  border: 2px solid #C9DA9A !important;
  border-top: none !important;
  border-radius: 0 0 7px 7px !important;
  margin-top: -2px !important;
  color: #C9DA9A !important;
  max-height: 200px !important;
  overflow-y: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}

:global(.mapboxgl-ctrl-geocoder--list) {
  background: #326334 !important;
  padding: 0 !important;
  margin: 0 !important;
}

:global(.suggestions-wrapper) {
  background: #326334 !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestion) {
  color: #C9DA9A !important;
  padding: 12px 16px !important;
  cursor: pointer !important;
  border-bottom: 1px solid rgba(201, 218, 154, 0.2) !important;
  font-family: "Inter", sans-serif !important;
  font-size: 16px !important;
  line-height: 1.4 !important;
  background: #326334 !important;
  margin: 0 !important;
}

/* Remove any potential white backgrounds from child elements */
:global(.mapboxgl-ctrl-geocoder--suggestion *),
:global(.mapboxgl-ctrl-geocoder *) {
  background: #326334 !important;
  margin: 0 !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestion:last-child) {
  border-bottom: none !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestion-main-text) {
  font-weight: 500 !important;
  margin-bottom: 2px !important;
  background: inherit !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestion-address) {
  color: #C9DA9A !important;
  opacity: 0.8 !important;
  font-size: 14px !important;
  margin-top: 4px !important;
  background: inherit !important;
}

/* Style the scrollbar to match the theme */
:global(.mapboxgl-ctrl-geocoder--suggestions::-webkit-scrollbar) {
  width: 6px !important;
  background: #326334 !important;
}

:global(.mapboxgl-ctrl-geocoder--suggestions::-webkit-scrollbar-thumb) {
  background: rgba(201, 218, 154, 0.3) !important;
  border-radius: 3px !important;
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
            src={staticMapUrl} 
            alt=""
            style="opacity: 0; position: absolute"
            on:load={() => {
              mapImageLoaded = true;
              setTimeout(() => {
                isMapLoading = false;
              }, 300);
            }}
          />
        {/if}
      </div>
      <div class="description">
        <div class="description-text-2">
          <span class="description-text-span">{getTranslation('transport.title')}</span>
          <span class="description-text-span2">{getTranslation('transport.costPerKm')}</span>
          <div class="input-container">
            <div id="geocoder" class="text"></div>
            {#if showAddressFields}
              <div class="address-fields" transition:fade>
                <div class="input-group full-width">
                  <input 
                    type="text" 
                    class="text" 
                    id="delivery_business_name" 
                    name="delivery_business_name"
                    bind:value={deliveryBusinessName}
                    placeholder={getTranslation('dateTime.address.businessName')}
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
                    placeholder={getTranslation('dateTime.address.street')}
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
                    placeholder={getTranslation('dateTime.address.postalCode')}
                  />
                  <input 
                    type="text" 
                    class="text" 
                    id="delivery_city" 
                    name="delivery_city"
                    bind:value={deliveryCity}
                    required
                    placeholder={getTranslation('dateTime.address.city')}
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
          <span class="description-text-span2">{getTranslation('extras.language.price')}</span>
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
          class:selected={printOptionSelected} 
          on:click={togglePrintOption}
          on:keydown={(e) => e.key === 'Enter' && togglePrintOption()}
        >
          {printOptionSelected ? getTranslation('common.remove') : getTranslation('common.add')}
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
          <td>{formatCurrency(languagePrice)}</td>
        </tr>
      {/each}
      {#if printOptionSelected}
        <tr>
          <td>{calculateEventDays(startDate, endDate)}</td>
          <td>
            <div class="item-with-remove">
              <button class="remove-icon" on:click={togglePrintOption}>×</button>
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
  <form on:submit={handleSubmit}>
    <div class="form-section">
      <div class="frame">
        <h1 class="h1">{getTranslation('form.title')}</h1>
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
              id="name" 
              name="name"
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
              class="text" 
              id="contact_phone" 
              name="contact_phone"
              bind:value={contactPhone}
              required
              placeholder={getTranslation('form.phonePlaceholder')}
            >
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
      </div>
    </div>
  </form>
</div>

{#if isSubmitting}
  <div class="loading-overlay" transition:fade>
    <div class="loading-spinner"></div>
  </div>
{/if}
