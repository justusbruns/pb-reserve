<script>
  import { onMount } from 'svelte';

  onMount(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Environment Variables Test from Component:');
      console.log('VITE_AIRTABLE_BASE_ID:', import.meta.env.VITE_AIRTABLE_BASE_ID ? 'Set ✓' : 'Not set ✗');
      console.log('VITE_AIRTABLE_PAT:', import.meta.env.VITE_AIRTABLE_PAT ? 'Set ✓' : 'Not set ✗');
    }
  });
</script>

<div style="display: none;">Environment Test Component</div>
