<script lang="ts"></script>
  import { onMount } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { eventService } from './services/airtable/eventService';
  import { locationService } from './services/airtable/locationService';
  import { organizationService } from './services/airtable/organizationService';
  import { personService } from './services/airtable/personService';
  import type { EventFields } from './types/Event';
  import { writable } from 'svelte/store';

  // Configure Airtable with Personal Access Token
  const base = new Airtable({
    apiKey: import.meta.env.VITE_AIRTABLE_PAT, // Updated env variable name
    endpointUrl: 'https://api.airtable.com' // Explicit endpoint
  }).base('apphYtwSYRt7UDukL');

  // Interfaces
  interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
  }

  let className = "";
  let startDate = "";
  let startTime = "";
  let endDate = "";
  let endTime = "";
  let totalPrice = 0;
  let transportFee = 0;
  let locationName = "";
  let deliveryAddress = "";
  let suggestions = [];
  let distanceError = "";
  let extrasPrice = 0;
  let language = '';
  let brandingAdded = false;
  let themaAdded = false;
  let getRoastedAdded = false;
  let printOptionSelected = false;
  let eventDays = 1;
  let extrasList = [];
  let selectedLanguage = 'Empty';
  let selectedLanguages = [];
  const languagePrice = 125;
  let primaryLanguage = "Dutch"; // Default to Dutch
  let isSubmitting = false;
  let submitError = '';
  let companyName = '';
  let contactName = '';
  let email = '';
  let vatNumber = '';

  const originAddress = "Gedempt Hamerkanaal 111, 1021KP Amsterdam, The Netherlands";
  let originCoordinates = [];

  // Add this mapping object
  const languageTranslations = {
    "Dutch": "Nederlands",
    "English": "Engels",
    "Arabic": "Arabisch",
    "Bengali": "Bengali",
    "Bulgarian": "Bulgaars",
    "Croatian": "Kroatisch",
    "Czech": "Tsjechisch",
    "French": "Frans",
    "German": "Duits",
    "Greek": "Grieks",
    "Hindi": "Hindi",
    "Hungarian": "Hongaars",
    "Italian": "Italiaans",
    "Mandarin": "Mandarijn",
    "Polish": "Pools",
    "Portuguese": "Portugees",
    "Romanian": "Roemeens",
    "Russian": "Russisch",
    "Spanish": "Spaans",
    "Slovak": "Slowaaks"
  };

  // Set default start and end dates to the current date and time
  onMount(() => {
    const now = new Date();
    startDate = now.toISOString().slice(0, 10);
    startTime = now.toTimeString().slice(0, 5);
    endDate = startDate;
    endTime = startTime;
    calculateTotalPrice();
    calculateTransportFee();
  });

  // Add this near the start of your script
  onMount(() => {
    // Initialize selectedLanguages with primaryLanguage
    selectedLanguages = [primaryLanguage];
  });

  export { className as class };

  function calculateTotalPrice() {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start date

      if (diffDays === 1) {
        totalPrice = 950;
      } else if (diffDays === 2) {
        totalPrice = 950 + 750;
      } else if (diffDays >= 3) {
        totalPrice = 950 + 750 + (diffDays - 2) * 100;
      }

      // Removed console.log for production
    }
  }

  async function calculateTransportFee() {
    distanceError = "";
    if (deliveryAddress && originCoordinates.length > 0) {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxgl.accessToken}`);
      const data = await response.json();
      if (data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const directionsResponse = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates[0]},${originCoordinates[1]};${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
        const directionsData = await directionsResponse.json();
        if (directionsData.routes.length > 0) {
          const distance = directionsData.routes[0].distance / 1000; // distance in km
          if (distance > 400) {
            transportFee = 0;
            distanceError = "Voor lange afstanden, mail <a href='mailto:contact@poembooth.com'>contact@poembooth.com</a>";
          } else {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start date

            if (diffDays === 1) {
              transportFee = distance * 2;
            } else {
              transportFee = distance * 4;
            }
          }

          console.log(`Transport Fee: ${transportFee}`);
        }
      }
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  }

  function formatNumber(value) {
  return new Intl.NumberFormat('nl-NL', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  }

  onMount(async () => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const originResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(originAddress)}.json?access_token=${mapboxgl.accessToken}`);
    const originData = await originResponse.json();
    if (originData.features.length > 0) {
      originCoordinates = originData.features[0].center;
    }

    const input = document.getElementById('delivery-address');

    input.addEventListener('input', async () => {
      const query = input.value;
      if (query.length > 2) {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        suggestions = data.features.map(feature => feature.place_name);
      }
    });

    input.addEventListener('change', async () => {
      const query = input.value;
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}`);
      const data = await response.json();
      if (data.features.length > 0) {
        deliveryAddress = data.features[0].place_name;
        await calculateTransportFee();
      }
    });
  });

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

  function calculateEventDays(startDate, endDate) {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
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
        return total + (extra.price);
      }
      return total + extra.price;
    }, 0);
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const language = event.target.value;
    if (language !== 'Empty' && !selectedLanguages.includes(language)) {
      selectedLanguages = [...selectedLanguages, language];
      extrasList = [...extrasList, { id: `lang-${language}`, price: languagePrice }];
      calculateExtrasPrice();
    }
    selectedLanguage = 'Empty'; // Reset the dropdown
  }

  function addLanguage(language) {
    if (!selectedLanguages.includes(language)) {
      selectedLanguages = [...selectedLanguages, language];
      extrasList = [...extrasList, { id: `lang-${language}`, price: languagePrice }];
      calculateExtrasPrice();
    }
  }

  function removeLanguage(language) {
    selectedLanguages = selectedLanguages.filter(l => l !== language);
    extrasList = extrasList.filter(e => e.id !== `lang-${language}`);
    calculateExtrasPrice();
  }

  // Watch for changes in startDate and endDate to update print price
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
  
  let isDefinite = writable(false);

  function toggleInvoiceFields(selectedOption) {
      isDefinite.set(selectedOption === 'definite');
  }

  // Add these to existing script section
  let invoiceAddressSuggestions = [];
  let invoiceAddressInput = '';
  
  async function handleInvoiceAddressInput(event) {
      const input = event.target.value;
      invoiceAddressInput = input;
      
      if (input.length > 2) {
          try {
              const response = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${mapboxgl.accessToken}`
              );
              const data = await response.json();
              invoiceAddressSuggestions = data.features.map(feature => ({
                  text: feature.place_name,
                  coordinates: feature.geometry.coordinates
              }));
          } catch (error) {
              console.error('Error fetching address suggestions:', error);
          }
      } else {
          invoiceAddressSuggestions = [];
      }
  }

  function selectInvoiceAddress(suggestion) {
      invoiceAddressInput = suggestion.text;
      invoiceAddressSuggestions = [];
  }

  // Add to existing script section
  let emailError = '';
  
  function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  }
  
  function handleEmailChange(event) {
      email = event.target.value;
      if (email && !validateEmail(email)) {
          emailError = 'Voer een geldig e-mailadres in';
      } else {
          emailError = '';
      }
  }

  // Submit handler
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const makeDefinitive = (e.submitter as HTMLButtonElement).id === 'submit-definitive';
    
    try {
      isSubmitting = true;
      submitError = '';

      // 1. Create Location
      const location = await locationService.create({
        'Location name': locationName,
        'Address line 1': deliveryAddress,
        'Country': 'Netherlands'
      });

      // 2. Create Organization
      const organization = await organizationService.create({
        'Name Organization': companyName,
        'VAT NR': vatNumber,
        'Address line 1': deliveryAddress,
        'Country': 'Netherlands'
      });

      // 3. Create Contact Person
      const person = await personService.create({
        'Name': contactName,
        'Type of person': 'Customer employee',
        'Organizations': [organization.id]
      });

      // 4. Create Event
      const eventData: Partial<EventFields> = {
        'Event name': eventName,
        'Start at': `${startDate}T${startTime}`,
        'Ends at': `${endDate}T${endTime}`,
        'Event created by': 'Online',
        'Contact person': [person.id],
        'Location': [location.id],
        'Reserved by': [organization.id],
        'Status': 'concept',
        'Payment status': makeDefinitive ? 'Invoice requested' : 'Proposal requested',
        'Total amount': totalPrice
      };

      const event = await eventService.create(eventData);

      // Success - redirect or show confirmation
      window.location.href = '/success';

    } catch (error) {
      console.error('Submission failed:', error);
      submitError = 'Er is iets misgegaan bij het versturen. Probeer het opnieuw.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="datum-en-tijd {className}">
  <div class="frame">
    <h1 class="h1">Datum en tijd</h1>
    <p class="p">
      We rekenen €950 voor de eerste dag, €750 voor de tweede dag en €100 euro
      voor elke opvolgende dag.
    </p>
  </div>
  <div class="frame">
    <div class="frame-row">
      <div class="frame-item">
        <div class="vanaf">Vanaf</div>
      </div>
      <div class="frame">
        <input type="date" class="date" bind:value={startDate} min={new Date().toISOString().slice(0, 10)} on:change={() => { calculateTotalPrice(); calculateTransportFee(); }} />
        <div class="frame-item">
          <div class="om">om</div>
          <input type="time" class="time" bind:value={startTime} />
        </div>
      </div>
    </div>
    <div class="frame-row">
      <div class="frame-item">
        <div class="tot-en-met">Tot en met</div>
      </div>
      <div class="frame">
        <input type="date" class="date" bind:value={endDate} min={startDate} on:change={() => { calculateTotalPrice(); calculateTransportFee(); }} />
        <div class="frame-item">
          <div class="om">om</div>
          <input type="time" class="time" bind:value={endTime} />
        </div>
      </div>
    </div>
    <div class="frame-row">
      <div class="basisverhuur">Basisverhuur:</div>
      <div class="p">{formatCurrency(totalPrice)}</div>
    </div>
  </div>
</div>

<div class="datum-en-tijd {className}">
  <div class="frame">
    <h1 class="h1">Locatie</h1>
    <p class="p">
      We rekenen €1 per gereden kilometer.
    </p>
  </div>
  <div class="frame">
    <div class="frame-row">
      <div class="frame-item">
        <div class="vanaf">Naam locatie</div>
      </div>
      <div class="frame">
        <input type="text" class="text" bind:value={locationName} />
      </div>
    </div>
    <div class="frame-row">
      <div class="frame-item">
        <div class="tot-en-met">Leveradres</div>
      </div>
      <div class="frame">
        <input type="text" id="delivery-address" class="text" bind:value={deliveryAddress} placeholder="" on:input={calculateTransportFee} />
        {#if suggestions.length > 0}
          <div class="suggestions">
            {#each suggestions as suggestion}
              <div class="suggestion" on:click={() => { deliveryAddress = suggestion; suggestions = []; calculateTransportFee(); }}>
                {suggestion}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="frame-row">
      <div class="basisverhuur">Vervoer:</div>
      <div class="p">
        {#if distanceError}
          {@html distanceError}
        {:else}
          {formatCurrency(transportFee)}
        {/if}
      </div>
    </div>
  </div>
</div>

<div class={'inclusief ' + className}>
  <div class="inclusief-gratis">Inclusief gratis</div>
  <div class="features">
    
    <div class="feature-1">
      <div class="image" style="background-image: url('/src/images/Taal.png'); background-size: 100%; background-repeat: no-repeat;"></div>
      <div class="description">
      <div class="description-text">
        <span>
        <span class="description-text-span">
          Eén taal naar keuze
          <br />
        </span>
        <span class="description-text-span2">
          Kies je taal bij extra's
          <br />
        </span>
        </span>
      </div>
      </div>
    </div>
    
    <div class="feature-1">
      <div class="image" style="background-image: url('/src/images/QR.png'); background-size: 100%; background-repeat: no-repeat;"></div>
      <div class="description">
        <div class="description-text">
          <span>
            <span class="description-text-span">
              QR code
              <br />
            </span>
            <span class="description-text-span2">
              Scan en deel je persoonlijke gedicht
            </span>
          </span>
        </div>
      </div>
    </div>
  
    <div class="feature-1">
      <div class="image" style="background-image: url('/src/images/Ongelimiteerd.png'); background-size: 100%; background-repeat: no-repeat;"></div>
      <div class="description">
        <div class="description-text">
          <span>
            <span class="description-text-span">
              Ongelimiteerde gedichten
              <br />
            </span>
            <span class="description-text-span2">
              Geen limiet op eindeloze dichtkunst
            </span>
          </span>
        </div>
      </div>
    </div>
    <div class="feature-1">
      <div class="image" style="background-image: url('/src/images/Vrijvanaansprakelijkheid.png'); background-size: 100%; background-repeat: no-repeat;"></div>
      <div class="description">
        <div class="description-text">
          <span>
            <span class="description-text-span">
              Vrij van aansprakelijkheid
              <br />
            </span>
            <span class="description-text-span2">
              De Poem Booth is verzekerd voor schade
            </span>
            </span>
          </div>
          </div>
        </div>
        </div>
      </div>

      <div class={'inclusief ' + className}>
  <div class="inclusief-gratis">Extra’s</div>
  <div class="features">
    <div class="feature-2 extra-taal-box">
  <div class="description">
    <div class="description-text-2">
      <span>
        <span class="description-text-span">
          Extra taal
          <br />
        </span>
        <span class="description-text-span2">
          Voeg nog een extra taal toe
        </span>
      </span>
    </div>
    <div class="description-text">
      <span class="description-text-span2">
        €125 / extra taal
      </span>
    </div>
    <div class="description-text">
      <span class="description-text-span2">
        {#if selectedLanguages.length > 0}
          <div class="selected-languages">
            {#each selectedLanguages as language}
              <div class="language-tag">
                {languageTranslations[language]} <button on:click={() => removeLanguage(language)}>x</button>
              </div>
            {/each}
          </div>
        {/if}
        <div class={'dropdown-language ' + className}>
          <select class="language-select" on:change={handleLanguageChange} bind:value={selectedLanguage}>
            <option value="Empty">Welke extra taal?</option>
            <option value="Dutch">Nederlands</option>
            <option value="English">Engels</option>
            <option value="Arabic">Arabisch</option>
            <option value="Bengali">Bengali</option>
            <option value="Bulgarian">Bulgaars</option>
            <option value="Croatian">Kroatisch</option>
            <option value="Czech">Tsjechisch</option>
            <option value="French">Frans</option>
            <option value="German">Duits</option>
            <option value="Greek">Grieks</option>
            <option value="Hindi">Hindi</option>
            <option value="Hungarian">Hongaars</option>
            <option value="Italian">Italiaans</option>
            <option value="Mandarin">Mandarijn</option>
            <option value="Polish">Pools</option>
            <option value="Portuguese">Portugees</option>
            <option value="Romanian">Roemeens</option>
            <option value="Russian">Russisch</option>
            <option value="Spanish">Spaans</option>
            <option value="Slovak">Slowaaks</option>
          </select>
        </div>
      </span>
    </div>
  </div>
</div>
    
    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Branding.png'); background-size: 100%; background-repeat: no-repeat; width: 150px; height: 200px;"></div>
      <div class="description">
        <div class="description-text-2">
          <span>
            <span class="description-text-span">
              Branding
              <br />
            </span>
            <span class="description-text-span2">
              Uniek design met jouw logo en kleuren
            </span>
          </span>
        </div>
        <div class="description-text">
          <span>
            <span class="description-text-span2">
              €750
            </span>
          </span>
        </div>
        <div class="button" on:click={toggleBranding}>
          {brandingAdded ? 'Verwijder' : 'Voeg toe'}
        </div>
      </div>
    </div>

    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Thema.png'); background-size: 100%; background-repeat: no-repeat; width: 150px; height: 200px;"></div>
      <div class="description">
        <div class="description-text-2">
          <span>
            <span class="description-text-span">
              Thema
              <br />
            </span>
            <span class="description-text-span2">
              Elk gedicht over een bepaald onderwerp
            </span>
          </span>
        </div>
        <div class="description-text">
          <span>
            <span class="description-text-span2">
              €750
            </span>
          </span>
        </div>
        <div class="button" on:click={toggleThema}>
          {themaAdded ? 'Verwijder' : 'Voeg toe'}
        </div>
      </div>
    </div>

    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/RB.png'); background-size: 100%; background-repeat: no-repeat; width: 150px; height: 200px;"></div>
      <div class="description">
        <div class="description-text-2">
          <span>
            <span class="description-text-span">
              Get Roasted
              <br />
            </span>
            <span class="description-text-span2">
              Lachen geblazen
            </span>
          </span>
        </div>
        <div class="description-text">
          <span>
            <span class="description-text-span2">
              €350
            </span>
          </span>
        </div>
        <div class="button" on:click={toggleGetRoasted}>
          {getRoastedAdded ? 'Verwijder' : 'Voeg toe'}
        </div>
      </div>
    </div>

    <div class="feature-2">
      <div class="image" style="background-image: url('/src/images/Print.png'); background-size: 100%; background-repeat: no-repeat; width: 150px; height: 200px;"></div>
      <div class="description">
        <div class="description-text-2">
          <span>
            <span class="description-text-span">
              Print optie
              <br />
            </span>
            <span class="description-text-span2">
              Neem je gedichten mee als herinnering
            </span>
          </span>
        </div>
        <div class="description-text">
          <span>
            <span class="description-text-span2">
              €500 / dag
            </span>
          </span>
        </div>
        <div class="button" on:click={togglePrintOption}>
          {printOptionSelected ? 'Verwijder' : 'Voeg toe'}
        </div>
      </div>
    </div>
  </div>

<div class="frame-row">
  <div class="basisverhuur">Totaal Extra's:</div>
  <div class="p">{formatCurrency(extrasPrice)}</div>
</div>
</div>

<div class={'inclusief ' + className}>
  <div class="inclusief-gratis">Jouw Poem Booth Huuroverzicht</div>
  <div class="frame"></div>
  <table class="price-overview">
    <thead>
      <tr>
        <th>#</th>
        <th>Reservering</th>
        <th>Totaal ex BTW</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{calculateEventDays(startDate, endDate)}</td>
        <td>Dagen huur</td>
        <td>{formatCurrency(totalPrice)}</td>
      </tr>
      <tr>
        <td>{formatNumber(transportFee)}</td>
        <td>Gereden km</td>
        <td>{formatCurrency(transportFee)}</td>
      </tr>
      <tr>
        <td>1</td>
        <td>{languageTranslations[primaryLanguage]}</td>
        <td>€0,00</td>
      </tr>
      {#each selectedLanguages.slice(1) as language}
        <tr>
          <td>1</td>
          <td>{languageTranslations[language]}</td>
          <td>{formatCurrency(languagePrice)}</td>
        </tr>
      {/each}
      {#if brandingAdded}
        <tr>
          <td>1</td>
          <td>Branding</td>
          <td>{formatCurrency(750)}</td>
        </tr>
      {/if}
      {#if themaAdded}
        <tr>
          <td>1</td>
          <td>Thema</td>
          <td>{formatCurrency(750)}</td>
        </tr>
      {/if}
      {#if printOptionSelected}
        <tr>
          <td>{calculateEventDays(startDate, endDate)}</td>
          <td>Print optie</td>
          <td>{formatCurrency(500 * calculateEventDays(startDate, endDate))}</td>
        </tr>
      {/if}
      {#if getRoastedAdded}
        <tr>
          <td>1</td>
          <td>Get Roasted</td>
          <td>{formatCurrency(350)}</td>
        </tr>
      {/if}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Totaal ex BTW</td>
        <td>{formatCurrency(totalPrice + transportFee + extrasPrice)}</td>
      </tr>
      <tr>
        <td colspan="2">BTW (21%)</td>
        <td>{formatCurrency((totalPrice + transportFee + extrasPrice) * 0.21)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Totaal incl. BTW</strong></td>
        <td><strong>{formatCurrency((totalPrice + transportFee + extrasPrice) * 1.21)}</strong></td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="datum-en-tijd">
  <form on:submit={handleSubmit}>
    <div class="frame">
      <h1 class="h1">Stuur je reserving in</h1>
    </div>
    <div class="form-section">
        <div class="frame">
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf">Jouw naam:</div>
                </div>
                <div class="frame">
                    <input type="text" class="text" id="name" name="name">
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf">Email:</div>
                </div>
                <div class="frame">
                    <input 
                        type="email" 
                        class="text {emailError ? 'error' : ''}" 
                        id="email" 
                        name="email"
                        bind:value={email}
                        on:input={handleEmailChange}
                        pattern="[^@\s]+@[^@\s]+\.[^\s@]+"
                        required
                    >
                    {#if emailError}
                        <div class="error-message">{emailError}</div>
                    {/if}
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf">Organisatie:</div>
                </div>
                <div class="frame">
                    <input type="text" class="text" id="organisation" name="organisation">
                </div>
            </div>
            <div class="frame-row">
                <div class="frame-item">
                    <div class="vanaf">Naam evenement:</div>
                </div>
                <div class="frame">
                    <input type="text" class="text" id="event" name="event">
                </div>
            </div>
        </div>
    </div>

    <div class="form-section">
        <div class="frame">
            <h3 class="p">Maak reserving definitief of vraag eerst extra informatie op</h3>
            <div class="frame-row">
                <input type="radio" id="definite" name="reservation_type" value="definite" on:change={() => toggleInvoiceFields('definite')}>
                <label for="definite" class="p">Maak de reserving definitief, ik ontvang graag de factuur</label>
                <input type="radio" id="info" name="reservation_type" value="info" on:change={() => toggleInvoiceFields('info')}>
                <label for="info" class="p">Ik vraag graag eerst meer informatie op</label>
            </div>
            
              {#if $isDefinite}
                <div id="invoice-fields">
                    <div class="frame-row">
                        <div class="frame-item">
                            <div class="vanaf">Factuuradres:</div>
                        </div>
                        <div class="frame relative">
                          <input 
                              type="text" 
                              class="text" 
                              id="invoice_address" 
                              name="invoice_address"
                              bind:value={invoiceAddressInput}
                              on:input={handleInvoiceAddressInput}
                              placeholder=""
                          >
                          {#if invoiceAddressSuggestions.length > 0}
                              <div class="suggestions">
                                  {#each invoiceAddressSuggestions as suggestion}
                                      <div 
                                          class="suggestion-item"
                                          on:click={() => selectInvoiceAddress(suggestion)}
                                      >
                                          {suggestion.text}
                                      </div>
                                  {/each}
                              </div>
                          {/if}
                      </div>
                    </div>
                    <div class="frame-row">
                        <div class="frame-item">
                            <div class="vanaf">BTW nummer:</div>
                        </div>
                        <div class="frame">
                            <input 
                                type="text" 
                                class="text" 
                                id="vat_number" 
                                name="vat_number"
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <div class="form-section">
        <div class="frame">
            <div class="frame-row">
                <input type="checkbox" id="terms" name="terms">
                <label for="terms" class="p">Ik ga akkoord met de leveringsvoorwaarden</label>
            </div>
            <div class="frame-row">
                <input type="checkbox" id="no_updates" name="no_updates">
                <label for="no_updates" class="p">Ik ontvang liever geen interessante updates over de Poem Booth</label>
            </div>
        </div>
    </div>

    {#if submitError}
      <div class="error-message">{submitError}</div>
    {/if}

    <button 
      type="submit" 
      class="button" 
      id="submit-definitive"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Versturen...' : 'Stuur mijn reserving in'}
    </button>
    
    <button 
      type="submit" 
      class="button" 
      id="submit-info"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Versturen...' : 'Vraag meer informatie op'}
    </button>
</form>
</div>




