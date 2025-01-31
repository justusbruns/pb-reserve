import 'flatpickr/dist/flatpickr.css';
import './styles.css';

import App from './App.svelte';
import translations from './translations';
import { mount } from 'svelte';
import type { SvelteComponent } from 'svelte';

const target = document.getElementById('app');
if (!target) {
    throw new Error('Could not find app element');
}

const app = mount(App, {
    target,
    props: {
        translations
    }
}) as SvelteComponent;

export default app;
