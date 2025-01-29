<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  
  // Forward the root Dutch page to the main app with language context
  onMount(() => {
    goto('/', { replaceState: true });
  });
</script>

{@render children?.()}
