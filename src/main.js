import 'flatpickr/dist/flatpickr.css';
import './styles.css';

import App from './App.svelte'
import translations from './translations'
import { mount } from "svelte";

const app = mount(App, {
    target: document.getElementById('app'),
    props: {
        translations
    }
});

export default app;
