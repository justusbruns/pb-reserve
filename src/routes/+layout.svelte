<script>
  import { setContext } from 'svelte';
  import translations from '../translations';
  import '../styles.css';
  import 'mapbox-gl/dist/mapbox-gl.css';

  /** @type {import('./$types').LayoutData} */
  export let data;

  // Verify required data is present
  if (!data || !data.mapboxToken || !data.PUBLIC_API_TOKEN) {
    throw new Error('Required configuration is missing');
  }

  // Make mapbox token available to all components
  setContext('mapboxToken', data.mapboxToken);
  // Make API token available to all components
  setContext('apiToken', data.PUBLIC_API_TOKEN);
  // Make translations available to all components
  setContext('translations', translations.nl);
</script>

<style>
  /* Mapbox Geocoder styles */
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

<slot />
