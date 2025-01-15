/**
 * Utility functions for Airtable field format validation and transformation
 */

/**
 * Date and Time Formatting
 */
export const dateTimeUtils = {
  /**
   * Format date and time to Airtable's expected ISO 8601 format
   * Input: YYYY-MM-DD and HH:mm
   * Output: YYYY-MM-DDTHH:mm:00.000Z
   */
  formatDateTime(date: string, time: string): string {
    try {
      if (!date || !time) return '';

      console.log('Input date:', date, 'time:', time);

      // Parse the date (assuming YYYY-MM-DD format)
      const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
      
      // Parse the time (assuming HH:mm format)
      const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));

      console.log('Parsed components:', { year, month, day, hours, minutes });

      // Validate components
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid date or time components');
      }

      if (month < 1 || month > 12) throw new Error('Invalid month');
      if (day < 1 || day > 31) throw new Error('Invalid day');
      if (hours < 0 || hours > 23) throw new Error('Invalid hours');
      if (minutes < 0 || minutes > 59) throw new Error('Invalid minutes');

      // Create date string in YYYY-MM-DDTHH:mm:00.000Z format
      const paddedMonth = month.toString().padStart(2, '0');
      const paddedDay = day.toString().padStart(2, '0');
      const paddedHours = hours.toString().padStart(2, '0');
      const paddedMinutes = minutes.toString().padStart(2, '0');

      return `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00.000Z`;
    } catch (error) {
      console.error('Error formatting date/time:', error);
      throw error;
    }
  },

  /**
   * Parse a date string from any format to YYYY-MM-DD
   */
  parseToISODate(dateStr: string): string {
    if (!dateStr) return '';

    // If it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // If it's in DD/MM/YYYY format
    const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    throw new Error('Unsupported date format');
  }
};

/**
 * Phone Number Formatting
 * Formats phone numbers to international format for Airtable
 */
export const phoneUtils = {
  /**
   * Format phone number to international format
   * Handles Dutch and Belgian formats
   */
  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Handle Dutch numbers
    if (digits.startsWith('31') || digits.startsWith('06')) {
      const normalizedNumber = digits.startsWith('06') ? `31${digits.slice(1)}` : digits;
      return `+${normalizedNumber.slice(0, 2)} ${normalizedNumber.slice(2, 4)} ${normalizedNumber.slice(4)}`;
    }

    // Handle Belgian numbers
    if (digits.startsWith('32') || digits.startsWith('0')) {
      const normalizedNumber = digits.startsWith('0') ? `32${digits.slice(1)}` : digits;
      return `+${normalizedNumber.slice(0, 2)} ${normalizedNumber.slice(2, 3)} ${normalizedNumber.slice(3)}`;
    }

    // Return formatted with international prefix if not handled above
    return `+${digits}`;
  }
};

/**
 * Postal Code Formatting
 */
export const postalCodeUtils = {
  /**
   * Format postal code to standard format
   * Handles both Dutch (1234 AB) and Belgian (1234) formats
   */
  formatPostalCode(postalCode: string): string {
    if (!postalCode) return '';

    // Remove all spaces and convert to uppercase
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

    // If it's a Dutch postal code (4 digits + 2 letters)
    if (/^\d{4}[A-Z]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }

    return cleaned;
  },

  /**
   * Validate postal code format
   */
  validatePostalCode(postalCode: string): boolean {
    if (!postalCode) return false;

    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
    
    // Dutch format: 4 digits followed by 2 letters
    const dutchRegex = /^\d{4}[A-Z]{2}$/;
    // Belgian format: 4 digits
    const belgianRegex = /^\d{4}$/;

    return dutchRegex.test(cleaned) || belgianRegex.test(cleaned);
  }
};

/**
 * VAT Number Formatting
 */
export const vatUtils = {
  /**
   * Format VAT number
   * Handles Dutch (NLxxxxxxxxB01) and Belgian (BExxxxxxxxxx) formats
   */
  formatVATNumber(vatNumber: string): string {
    if (!vatNumber) return '';

    // Remove all spaces and convert to uppercase
    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();

    // If it's already in correct format, return as is
    if (/^(NL|BE)[0-9]{9}B[0-9]{2}$/.test(cleaned) || /^(BE)[0-9]{10}$/.test(cleaned)) {
      return cleaned;
    }

    // Handle Dutch VAT numbers
    if (cleaned.startsWith('NL')) {
      const numbers = cleaned.replace(/[^\d]/g, '');
      return `NL${numbers.padStart(9, '0')}B01`;
    }

    // Handle Belgian VAT numbers
    if (cleaned.startsWith('BE')) {
      const numbers = cleaned.replace(/[^\d]/g, '');
      return `BE${numbers.padStart(10, '0')}`;
    }

    return cleaned;
  },

  /**
   * Validate VAT number format
   */
  validateVATNumber(vatNumber: string): boolean {
    if (!vatNumber) return false;

    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
    
    // Dutch format: NL + 9 digits + B + 2 digits
    const dutchRegex = /^NL[0-9]{9}B[0-9]{2}$/;
    // Belgian format: BE + 10 digits
    const belgianRegex = /^BE[0-9]{10}$/;

    return dutchRegex.test(cleaned) || belgianRegex.test(cleaned);
  }
};

/**
 * Language Validation
 */
export const languageUtils = {
  /**
   * Validate language selection
   */
  validateLanguage(language: string): boolean {
    const validLanguages = [
      'Dutch', 'English', 'Arabic', 'Bengali', 'Bulgarian', 'Croatian',
      'Czech', 'French', 'German', 'Greek', 'Hindi', 'Hungarian',
      'Italian', 'Mandarin', 'Polish', 'Portuguese', 'Romanian',
      'Russian', 'Spanish', 'Slovak'
    ];
    return validLanguages.includes(language);
  }
};

/**
 * Status Validation
 */
export const statusUtils = {
  validateEventStatus(status: string): boolean {
    return ['concept', 'started', 'stopped', 'reserved'].includes(status);
  },

  validatePaymentStatus(status: string): boolean {
    return [
      'Proposed', 'Approved', 'Invoiced', 'Paid',
      'Invoice requested', 'Proposal requested'
    ].includes(status);
  }
};

/**
 * Record ID Validation
 */
export const recordUtils = {
  /**
   * Validate Airtable record ID format
   */
  validateRecordId(id: string): boolean {
    return /^rec[a-zA-Z0-9]{14}$/.test(id);
  },

  /**
   * Format array of record IDs for Airtable
   */
  formatRecordIds(ids: string[]): string[] {
    return ids.filter(id => recordUtils.validateRecordId(id));
  }
};

/**
 * Address parsing and validation
 */
export const addressUtils = {
  /**
   * Parse address string into components
   * @throws Error if address cannot be parsed
   */
  getAddressComponents(address: string) {
    if (!address) {
      throw new Error('Address is required');
    }

    // Split address into parts and clean each part
    const parts = address.split(',').map(part => part.trim());
    if (parts.length < 2) {
      throw new Error('Address must contain at least street and city/country');
    }

    // Last part is the country - normalize it
    const countryPart = parts[parts.length - 1].trim();
    let country;
    
    // Try to normalize using the countryUtils
    try {
      country = countryUtils.normalizeCountry(countryPart);
      console.log('Normalized country in getAddressComponents:', country);
    } catch (error) {
      console.error('Error normalizing country:', error);
      country = countryPart;
    }
    
    parts.pop(); // Remove country part
    
    // Second to last part usually contains city and postal code
    const cityPostalPart = parts[parts.length - 1];
    
    let postalCode = '';
    let city = '';

    // Different parsing rules based on country
    if (country === 'Germany') {
      // German format: [postal code] [city]
      const match = cityPostalPart.match(/^(\d{5})\s+(.+)$/);
      if (match) {
        postalCode = match[1];
        city = match[2];
      } else {
        city = cityPostalPart; // If no postal code found, assume it's just city
      }
    } else if (country === 'Belgium') {
      // Belgian format: [postal code] [city]
      const match = cityPostalPart.match(/^(\d{4})\s+(.+)$/);
      if (match) {
        postalCode = match[1];
        city = match[2].replace(/\s*\([^)]*\)\s*/g, ''); // Remove province info in parentheses
      } else {
        city = cityPostalPart; // If no postal code found, assume it's just city
      }
    } else if (country === 'Netherlands') {
      // Dutch format: [postal code] [city]
      const match = cityPostalPart.match(/^(\d{4}\s*[A-Z]{2})\s+(.+)$/i);
      if (match) {
        postalCode = match[1].toUpperCase();
        city = match[2];
      } else {
        city = cityPostalPart; // If no postal code found, assume it's just city
      }
    } else {
      // Generic format: assume space separation between postal code and city
      const parts = cityPostalPart.split(/\s+/);
      if (parts.length > 1 && /\d/.test(parts[0])) {
        postalCode = parts[0];
        city = parts.slice(1).join(' ');
      } else {
        city = cityPostalPart; // If no postal code found, assume it's just city
      }
    }

    // First part is the street address
    const streetPart = parts[0];

    // Any parts between street and city/postal code become address line 2
    const addressLine2 = parts.length > 3 ? 
      parts.slice(1, -2).join(', ') : 
      undefined;

    const components = {
      address_line_1: streetPart,
      address_line_2: addressLine2,
      city: city.trim(),
      postal_code: postalCode.trim(),
      country
    };

    console.log('Address components:', components);
    return components;
  }
};

/**
 * Country Normalization
 */
export const countryUtils = {
  /**
   * Normalize country name to English
   * @throws Error if no country is provided
   */
  normalizeCountry(country: string | undefined | null): string {
    if (!country || country.trim() === '') {
      throw new Error('Country is required');
    }
    
    // Convert to lowercase for case-insensitive comparison
    const lowercaseCountry = country.toLowerCase().trim();
    
    // Handle various country names and convert to English
    switch (lowercaseCountry) {
      // Netherlands
      case 'nederland':
      case 'netherlands':
      case 'the netherlands':
      case 'holland':
        return 'Netherlands';
      
      // Belgium
      case 'belgië':
      case 'belgie':
      case 'belgique':
      case 'belgien':
      case 'belgium':
        return 'Belgium';
      
      // Germany
      case 'duitsland':
      case 'deutschland':
      case 'allemagne':
      case 'germany':
        return 'Germany';
      
      // France
      case 'frankrijk':
      case 'france':
      case 'frankreich':
        return 'France';
      
      // Spain
      case 'spanje':
      case 'spain':
      case 'españa':
      case 'espagne':
      case 'spanien':
        return 'Spain';
      
      // Italy
      case 'italië':
      case 'italie':
      case 'italy':
      case 'italia':
      case 'italien':
        return 'Italy';
      
      // Austria
      case 'oostenrijk':
      case 'austria':
      case 'österreich':
      case 'autriche':
        return 'Austria';
      
      // Portugal
      case 'portugal':
      case 'portugees':
      case 'portugese':
        return 'Portugal';
      
      // Greece
      case 'griekenland':
      case 'greece':
      case 'griechenland':
      case 'grèce':
        return 'Greece';
      
      // Ireland
      case 'ierland':
      case 'ireland':
      case 'irland':
      case 'irlande':
        return 'Ireland';
      
      // Poland
      case 'polen':
      case 'poland':
      case 'polska':
      case 'pologne':
        return 'Poland';
      
      // Sweden
      case 'zweden':
      case 'sweden':
      case 'sverige':
      case 'schweden':
      case 'suède':
        return 'Sweden';
      
      // Denmark
      case 'denemarken':
      case 'denmark':
      case 'danmark':
      case 'dänemark':
      case 'danemark':
        return 'Denmark';
      
      // Finland
      case 'finland':
      case 'finlande':
      case 'finnland':
      case 'suomi':
        return 'Finland';
      
      // Croatia
      case 'kroatië':
      case 'kroatie':
      case 'croatia':
      case 'kroatien':
      case 'croatie':
        return 'Croatia';
      
      // Czech Republic
      case 'tsjechië':
      case 'tsjechie':
      case 'czech republic':
      case 'tschechien':
      case 'république tchèque':
      case 'czechia':
        return 'Czech Republic';
      
      // Hungary
      case 'hongarije':
      case 'hungary':
      case 'ungarn':
      case 'hongrie':
        return 'Hungary';
      
      // Romania
      case 'roemenië':
      case 'roemenie':
      case 'romania':
      case 'rumänien':
      case 'roumanie':
        return 'Romania';
      
      // Bulgaria
      case 'bulgarije':
      case 'bulgaria':
      case 'bulgarien':
      case 'bulgarie':
        return 'Bulgaria';
      
      // Slovakia
      case 'slowakije':
      case 'slovakia':
      case 'slowakei':
      case 'slovaquie':
        return 'Slovakia';
      
      // Slovenia
      case 'slovenië':
      case 'slovenie':
      case 'slovenia':
      case 'slowenien':
      case 'slovénie':
        return 'Slovenia';
      
      // Estonia
      case 'estland':
      case 'estonia':
      case 'estonie':
        return 'Estonia';
      
      // Latvia
      case 'letland':
      case 'latvia':
      case 'lettland':
      case 'lettonie':
        return 'Latvia';
      
      // Lithuania
      case 'litouwen':
      case 'lithuania':
      case 'litauen':
      case 'lituanie':
        return 'Lithuania';
      
      // Luxembourg
      case 'luxemburg':
      case 'luxembourg':
        return 'Luxembourg';
      
      // Malta
      case 'malta':
        return 'Malta';
      
      // Cyprus
      case 'cyprus':
      case 'chypre':
      case 'zypern':
        return 'Cyprus';
        
      default:
        // For other countries, capitalize first letter of each word
        return country
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  }
};
