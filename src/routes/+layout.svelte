<script>
  import { setContext } from 'svelte';
  import translations from '../translations';
  import '../styles.css';
  import 'mapbox-gl/dist/mapbox-gl.css';

  /**
   * @typedef {Object} Props
   * @property {import('./$types').LayoutData} data
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { data, children } = $props();

  // Function to determine the current language based on the URL
  function getCurrentLanguage() {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/en') ? 'en' : 'nl';
    }
    return 'nl';
  }

  let currentLanguage = getCurrentLanguage();

  // Update language when URL changes
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      currentLanguage = getCurrentLanguage();
      setContext('translations', translations[currentLanguage]);
    });
  }

  // Make translations available to all components based on current language
  setContext('translations', translations[currentLanguage]);

  // Set Mapbox token in context
  setContext('mapboxToken', data.mapboxToken);
</script>

{@render children?.()}

<style global>
  /* Mapbox Geocoder styles */
  .mapboxgl-ctrl-geocoder {
    min-width: 100%;
    width: 100%;
    max-width: none;
    border-radius: 0;
    font-family: inherit;
  }

  .mapboxgl-ctrl-geocoder--input {
    height: 36px;
    padding: 6px 35px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    width: 100%;
  }

  .mapboxgl-ctrl-geocoder--input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .mapboxgl-ctrl-geocoder--icon {
    top: 8px;
  }

  .mapboxgl-ctrl-geocoder--button {
    display: none;
  }

  .mapboxgl-ctrl-geocoder--suggestion {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
  }

  .mapboxgl-ctrl-geocoder--suggestion-title {
    font-weight: bold;
  }

  .mapboxgl-ctrl-geocoder--suggestion:hover {
    background-color: #f8f9fa;
  }
</style>
