<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Forward the root Dutch page to the main app with language context
  onMount(() => {
    goto('/', { replaceState: true });
  });
</script>

<slot />
