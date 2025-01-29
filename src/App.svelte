<script lang="ts">
  import { onMount } from "svelte";
  import ChauffeurPortal from "./chauffeur/ChauffeurPortal.svelte";
  import DatumEnTijd from "./DatumEnTijd/DatumEnTijd.svelte";
  import EnvTest from './components/EnvTest.svelte';
  import type { Translations } from "./DatumEnTijd/types";
  import "./vars.css";
  import "./styles.css";

  interface Props {
    translations: Translations;
  }

  let { translations }: Props = $props();

  // Function to determine the current language based on the URL
  function getCurrentLanguage(): string {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isEnglish = path.startsWith('/en');
      // Update URL if needed without reloading
      if (isEnglish && !path.startsWith('/en/')) {
        const newPath = '/en' + (path === '/en' ? '/' : path);
        window.history.replaceState(null, '', newPath);
      }
      return isEnglish ? 'en' : 'nl';
    }
    return 'nl'; // Default to Dutch
  }

  let currentLanguage = $state(getCurrentLanguage());
  let currentTranslations = $derived(translations[currentLanguage]);

  // Update language when URL changes
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      currentLanguage = getCurrentLanguage();
    });
  }

  let isLoading = $state(true);

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
