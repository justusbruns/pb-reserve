<script lang="ts">
    import { run } from 'svelte/legacy';

    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { eventService } from '../services/airtable/eventService';
    import { authStore } from '../stores/authStore';
    import EventCard from './EventCard.svelte';
    import Login from './Login.svelte';
    import { apiRequest } from '$lib/client/apiClient';

    interface Props {
        translations: any;
    }

    let { translations }: Props = $props();

    let events: any[] = $state([]);
    let isLoading = $state(true);
    let error = $state('');
    let travelTimes: Record<string, number> = $state({});
    let hasLoadedEvents = $state(false);

    const ORIGIN_ADDRESS = 'Gedempt Hamerkanaal 111, Amsterdam';

    onMount(async () => {
        if (isAuthenticated) {
            await loadEvents();
        }
    });

    async function loadEvents() {
        if (!isAuthenticated || hasLoadedEvents) return;
        
        isLoading = true;
        error = '';

        try {
            // Fetch events from Chauffeurs view
            const response = await eventService.getFromView('Chauffeurs');
            events = response;
            hasLoadedEvents = true;

            // Calculate travel times for each event
            await Promise.all(
                events.map(async (event) => {
                    try {
                        // Use the Location field which contains the formatted delivery address
                        const travelTime = await calculateTravelTime(
                            ORIGIN_ADDRESS,
                            event.fields.Location // This is already the formatted delivery address
                        );
                        travelTimes[event.id] = travelTime;
                    } catch (err) {
                        console.error('Error calculating travel time:', err);
                    }
                })
            );
        } catch (err) {
            console.error('Error loading events:', err);
            error = translations.errors.loadingEvents;
            hasLoadedEvents = false;
        } finally {
            isLoading = false;
        }
    }

    async function calculateTravelTime(origin: string, destination: string): Promise<number> {
        try {
            // Get coordinates for origin using our secure server endpoint
            const originCoords = await apiRequest('/api/geocoding', {
                method: 'GET',
                params: { address: origin }
            });
            if (!originCoords?.features?.length) {
                throw new Error('No coordinates found for origin address');
            }

            // Get coordinates for destination using our secure server endpoint
            const destCoords = await apiRequest('/api/geocoding', {
                method: 'GET',
                params: { address: destination }
            });
            if (!destCoords?.features?.length) {
                throw new Error('No coordinates found for delivery address');
            }

            // Get directions using our secure server endpoint
            const originLocation = originCoords.features[0].geometry.coordinates;
            const destLocation = destCoords.features[0].geometry.coordinates;
            const directions = await apiRequest('/api/directions', {
                method: 'GET',
                params: {
                    origin: `${originLocation[0]},${originLocation[1]}`,
                    destination: `${destLocation[0]},${destLocation[1]}`
                }
            });

            if (!directions?.routes?.length) {
                throw new Error('No route found between addresses');
            }

            // Return duration in minutes
            return directions.routes[0].duration / 60;
        } catch (err) {
            console.error('Error calculating travel time:', err);
            return null;
        }
    }

    function handleLogout() {
        hasLoadedEvents = false;
        events = [];
        authStore.logout();
    }
    let user = $derived($authStore.user);
    let isAuthenticated = $derived($authStore.isAuthenticated);
    run(() => {
        if (isAuthenticated && !hasLoadedEvents) {
            loadEvents();
        }
    });
</script>

{#if !isAuthenticated}
    <Login {translations} />
{:else}
    <div class="portal-container" in:fade>
        <div class="portal-header">
            <h1>{translations.chauffeur.portal.welcome}, {user?.name || ''}</h1>
            <button class="logout-button" onclick={handleLogout}>
                {translations.chauffeur.portal.logout}
            </button>
        </div>

        {#if isLoading}
            <div class="loading-message">
                {translations.chauffeur.portal.loading}
            </div>
        {:else if error}
            <div class="error-message">
                {error}
                <button onclick={() => loadEvents()}>
                    {translations.chauffeur.portal.retry}
                </button>
            </div>
        {:else if events.length === 0}
            <div class="no-events-message">
                {translations.chauffeur.portal.noEvents}
            </div>
        {:else}
            <div class="events-grid">
                {#each events as event (event.id)}
                    <EventCard 
                        {event}
                        chauffeurId={user?.id}
                        travelTime={travelTimes[event.id]}
                        {translations}
                    />
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .portal-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background-color: #326334;
        min-height: 100vh;
    }

    .portal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 0 20px;
    }

    h1 {
        margin: 0;
        color: #FFFFFF;
        font-family: "Inter", sans-serif;
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
    }

    .logout-button {
        height: 50px;
        padding: 0 2rem;
        background-color: transparent;
        color: #C9DA9A;
        border: 2px solid #C9DA9A;
        border-radius: 7px;
        font-family: "Inter", sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .logout-button:hover {
        background-color: rgba(201, 218, 154, 0.1);
        border-color: #FFFFFF;
        color: #FFFFFF;
    }

    .loading-message, .no-events-message {
        text-align: center;
        padding: 2rem;
        color: #C9DA9A;
        font-family: "Inter", sans-serif;
        font-size: 16px;
    }

    .error-message {
        color: #FFFFFF;
        text-align: center;
        padding: 1rem;
        margin: 1rem 0;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 7px;
        font-family: "Inter", sans-serif;
        font-size: 14px;
    }

    .events-grid {
        display: grid;
        gap: 1.5rem;
        padding: 0 20px;
    }

    @media (max-width: 768px) {
        .portal-container {
            padding: 1rem;
        }

        .portal-header {
            padding: 0;
            margin-bottom: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        h1 {
            text-align: center;
        }

        .logout-button {
            width: 100%;
        }

        .events-grid {
            padding: 0;
        }
    }
</style>
