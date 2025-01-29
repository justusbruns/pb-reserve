<style>
  :global(.mapboxgl-ctrl-geocoder) {
    width: 100%;
    max-width: 100%;
    box-shadow: none;
    font-family: "Inter", sans-serif;
    border: none;
    background: #326334;
    border-radius: 7px;
    min-height: 50px;
    margin: 0;
    position: relative;
  }

  :global(.mapboxgl-ctrl-geocoder--input) {
    height: 50px;
    border: none;
    background: #326334;
    color: #C9DA9A !important;
    padding: 12px 16px;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    min-height: 50px;
    width: 100%;
    margin: 0;
    border-radius: 7px;
  }

  :global(.mapboxgl-ctrl-geocoder--input::placeholder) {
    color: #C9DA9A;
    opacity: 0.8;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: normal;
  }

  :global(.mapboxgl-ctrl-geocoder--suggestions) {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    background: #326334;
    border: 2px solid #C9DA9A;
    border-radius: 7px;
    color: #C9DA9A;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion) {
    color: #C9DA9A;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid rgba(201, 218, 154, 0.2);
    font-family: "Inter", sans-serif;
    font-size: 16px;
    line-height: 1.4;
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion:hover) {
    background: rgba(201, 218, 154, 0.1);
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion:last-child) {
    border-bottom: none;
  }
</style>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  
  interface Props {
    placeholder?: string;
    language?: string;
    types?: string;
    countries?: any;
  }

  let {
    placeholder = '',
    language = 'en',
    types = 'address',
    countries = ['NL', 'BE', 'DE']
  }: Props = $props();

  const dispatch = createEventDispatcher();
  let input = $state();
  let suggestionsContainer;
  let timeoutId;

  onMount(() => {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'mapboxgl-ctrl-geocoder--suggestions';
    suggestionsContainer.style.display = 'none';
    input.parentNode.appendChild(suggestionsContainer);

    return () => {
      clearTimeout(timeoutId);
      suggestionsContainer.remove();
    };
  });

  async function handleInput(event) {
    clearTimeout(timeoutId);
    const query = event.target.value;

    if (!query) {
      suggestionsContainer.style.display = 'none';
      dispatch('clear');
      return;
    }

    if (query.length < 3) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          address: query,
          language: language || 'en',
          types: types,
          countries: countries.join(',')
        });

        const response = await fetch(`/api/geocoding?${params}`);
        const data = await response.json();

        if (!data.features) return;
        showSuggestions(data.features);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300);
  }

  function showSuggestions(features) {
    suggestionsContainer.innerHTML = '';
    
    if (!features || features.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    features.forEach((feature) => {
      const item = document.createElement('div');
      item.className = 'mapboxgl-ctrl-geocoder--suggestion';
      item.innerHTML = feature.place_name;
      
      item.addEventListener('click', () => {
        input.value = feature.place_name;
        suggestionsContainer.style.display = 'none';
        
        // Extract address components
        const context = feature.context || [];
        const address = {
          place_name: feature.place_name,
          street: feature.text,
          postalCode: context.find(item => item.id?.startsWith('postcode'))?.text || '',
          city: context.find(item => item.id?.startsWith('place'))?.text || '',
          country: context.find(item => item.id?.startsWith('country'))?.short_code?.toUpperCase() || '',
          coordinates: feature.center || []
        };
        
        dispatch('result', { result: address });
      });

      suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.style.display = 'block';
  }

  // Hide suggestions when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.mapboxgl-ctrl-geocoder')) {
      suggestionsContainer.style.display = 'none';
    }
  }
</script>

<div class="mapboxgl-ctrl-geocoder">
  <input
    bind:this={input}
    type="text"
    class="mapboxgl-ctrl-geocoder--input"
    {placeholder}
    oninput={handleInput}
  />
</div>

<svelte:window onclick={handleClickOutside} />
