<script>
  import { onMount } from "svelte";
  import ChauffeurPortal from "./chauffeur/ChauffeurPortal.svelte";
  import DatumEnTijd from "./DatumEnTijd/DatumEnTijd.svelte";
  import EnvTest from './components/EnvTest.svelte';
  import translations from "./translations";
  import "./vars.css";
  import "./styles.css";

  // Function to determine the current language based on the URL
  function getCurrentLanguage() {
    const path = window.location.pathname;
    return path.startsWith('/en') ? 'en' : 'nl';
  }

  const currentLanguage = getCurrentLanguage();
  const t = translations[currentLanguage];

  let isLoading = true;

  onMount(() => {
    isLoading = false;
  });

  const path = window.location.pathname;
  const isChauffeurRoute = path.includes('/chauffeur');
</script>

<main>
  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else}
    {#if isChauffeurRoute}
      <ChauffeurPortal translations={t} />
    {:else}
      <div>
        <DatumEnTijd translations={t} />
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
    font-size: 1.2rem;
    color: var(--text);
  }
</style>
