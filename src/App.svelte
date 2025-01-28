<script lang="ts">
  import { onMount } from "svelte";
  import ChauffeurPortal from "./chauffeur/ChauffeurPortal.svelte";
  import DatumEnTijd from "./DatumEnTijd/DatumEnTijd.svelte";
  import EnvTest from './components/EnvTest.svelte';
  import type { Translations } from "./DatumEnTijd/types";
  import "./vars.css";
  import "./styles.css";

  export let translations: Translations;

  // Function to determine the current language based on the URL
  function getCurrentLanguage(): string {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path.startsWith('/en') ? 'en' : 'nl';
    }
    return 'nl'; // Default to Dutch
  }

  const currentLanguage = getCurrentLanguage();
  $: currentTranslations = translations[currentLanguage];

  let isLoading = true;

  onMount(() => {
    isLoading = false;
  });

  const path = (typeof window !== 'undefined') ? window.location.pathname : '';
  const isChauffeurRoute = path.includes('/chauffeur');
</script>

<main>
  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else}
    {#if isChauffeurRoute}
      <ChauffeurPortal translations={currentTranslations} />
    {:else}
      <div>
        <DatumEnTijd translations={currentTranslations} />
        <EnvTest />
      </div>
    {/if}
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
</style>
