import 'flatpickr/dist/flatpickr.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles.css';

import App from './App.svelte'
import translations from './translations'

const app = new App({
    target: document.getElementById('app'),
    props: {
        translations
    }
});

export default app;
