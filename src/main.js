import App from './App.svelte';
import { translations } from './translations/index';

// Function to determine the current language based on the URL
function getCurrentLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/en')) {
        return 'en';
    }
    return 'nl'; // default language
}

const currentLanguage = getCurrentLanguage();

const app = new App({
    target: document.getElementById('app'),
    props: {
        translations: translations[currentLanguage],
    }
});

export default app;
