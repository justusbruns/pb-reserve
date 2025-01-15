<script>
  import DatumEnTijd from "./DatumEnTijd/DatumEnTijd.svelte";
  import EnvTest from './components/EnvTest.svelte';
  import "./vars.css";
  import "./styles.css";

  export let translations;
</script>

<div>
  <DatumEnTijd {translations} />
  <EnvTest />
</div>

<style>
</style>
