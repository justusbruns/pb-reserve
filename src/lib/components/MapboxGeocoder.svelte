<script>
  import { onMount, createEventDispatcher } from 'svelte';

  export let accessToken;
  export let types = 'address';
  export let countries = ['NL', 'BE', 'DE'];
  export let language;
  export let placeholder;

  const dispatch = createEventDispatcher();

  onMount(() => {
    // Wait for MapboxGeocoder to be available
    const checkInterval = setInterval(() => {
      if (window.MapboxGeocoder) {
        clearInterval(checkInterval);
        initGeocoder();
      }
    }, 100);

    function initGeocoder() {
      const geocoder = new window.MapboxGeocoder({
        accessToken,
        types,
        countries: Array.isArray(countries) ? countries.join(',') : countries,
        language,
        placeholder,
        marker: false,
      });

      const container = document.getElementById('geocoder');
      if (container) {
        container.innerHTML = '';
        geocoder.addTo(container);
      }

      geocoder.on('result', (event) => {
        dispatch('result', event);
      });

      geocoder.on('clear', () => {
        dispatch('clear');
      });
    }

    return () => {
      clearInterval(checkInterval);
      const container = document.getElementById('geocoder');
      if (container) {
        container.innerHTML = '';
      }
    };
  });
</script>

<div id="geocoder"></div>

<style>
  #geocoder {
    width: 100%;
  }

  :global(.mapboxgl-ctrl-geocoder) {
    min-width: 100%;
    font-size: 16px;
    line-height: 20px;
    font-family: "Inter", sans-serif;
  }

  :global(.mapboxgl-ctrl-geocoder--input) {
    height: 36px;
    padding: 6px 35px;
    border: 1px solid #C9DA9A;
    border-radius: 4px;
    background-color: #326334;
    color: #C9DA9A;
  }

  :global(.mapboxgl-ctrl-geocoder--input:focus) {
    outline: none;
    border-color: #C9DA9A;
  }

  :global(.mapboxgl-ctrl-geocoder--icon) {
    fill: #C9DA9A;
  }

  :global(.mapboxgl-ctrl-geocoder--button) {
    background: #326334;
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion) {
    color: #326334;
    font-family: "Inter", sans-serif;
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion-title) {
    font-weight: bold;
  }

  :global(.mapboxgl-ctrl-geocoder--suggestion:hover) {
    background-color: #C9DA9A;
  }
</style>
