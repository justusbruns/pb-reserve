<script lang="ts">
    import { availabilityService } from '../services/airtable/availabilityService';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    export let event: any;
    export let chauffeurId: string;
    export let translations: any;
    export let travelTime: number | null = null;

    let currentStatus = '';
    let remarks = '';
    let isUpdating = false;
    let error = '';
    let isLoading = true;
    let remarksTimeout: NodeJS.Timeout;

    const statusOptions = [
        { value: 'Available', label: '✅ Available' },
        { value: 'Not Available', label: '🛑 Not Available' },
        { value: 'Maybe Available', label: '💅 Maybe Available' }
    ];

    async function loadAvailability() {
        try {
            console.log('Loading availability for event:', event.id);
            const availability = await availabilityService.getByEventAndChauffeur(
                event.id,
                chauffeurId
            );
            console.log('Loaded availability:', availability);
            if (availability) {
                currentStatus = availability.Availability;
                remarks = availability.Remarks || '';
            }
        } catch (err) {
            console.error('Error fetching availability:', err);
            error = translations.chauffeur.errors.loadingFailed;
        } finally {
            isLoading = false;
        }
    }

    onMount(async () => {
        await loadAvailability();
    });

    async function handleStatusChange(e: Event) {
        const status = (e.target as HTMLSelectElement).value as Availability['Availability'];
        if (!status) return;
        
        isUpdating = true;
        error = '';

        try {
            console.log('Updating availability:', {
                eventId: event.id,
                chauffeurId,
                status
            });
            
            await availabilityService.upsertAvailability(
                chauffeurId,
                event.id,
                status,
                remarks
            );
            currentStatus = status;
        } catch (err) {
            console.error('Error updating availability:', err);
            error = translations.chauffeur.errors.updateFailed;
            // Reload the current availability in case of error
            await loadAvailability();
        } finally {
            isUpdating = false;
        }
    }

    async function updateAvailability(status: string) {
        isUpdating = true;
        error = '';

        try {
            console.log('Updating availability:', {
                eventId: event.id,
                chauffeurId,
                status
            });
            
            await availabilityService.upsertAvailability(
                chauffeurId,
                event.id,
                status,
                remarks
            );
            currentStatus = status;
        } catch (err) {
            console.error('Error updating availability:', err);
            error = translations.chauffeur.errors.updateFailed;
            // Reload the current availability in case of error
            await loadAvailability();
        } finally {
            isUpdating = false;
        }
    }

    function handleRemarksChange() {
        if (remarksTimeout) {
            clearTimeout(remarksTimeout);
        }

        remarksTimeout = setTimeout(async () => {
            isUpdating = true;
            try {
                await availabilityService.upsertAvailability(chauffeurId, event.id, currentStatus, remarks);
            } catch (err) {
                console.error('Error updating remarks:', err);
                error = translations.chauffeur.errors.updateFailed;
            } finally {
                isUpdating = false;
            }
        }, 500); // Debounce for 500ms
    }

    function formatDateTime(date: string) {
        return new Date(date).toLocaleString(
            'nl-NL', 
            { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
            }
        );
    }
</script>

<div class="event-card" in:fade>
    <div class="event-header">
        <h2 class="event-title">{event.fields['Event name']}</h2>
        <div class="event-date">{formatDateTime(event.fields['Starts at'])}</div>
    </div>
    
    <div class="event-details">
        <div class="detail-row">
            <div class="detail-label">{translations.chauffeur.events.start}:</div>
            <div class="detail-value">{formatDateTime(event.fields['Starts at'])}</div>
        </div>
        
        <div class="detail-row">
            <div class="detail-label">{translations.chauffeur.events.end}:</div>
            <div class="detail-value">{formatDateTime(event.fields['Stops at'])}</div>
        </div>
        
        <div class="detail-row">
            <div class="detail-label">{translations.chauffeur.events.deliveryLocation}:</div>
            <div class="detail-value">{event.fields.Location}</div>
        </div>

        {#if travelTime !== null}
            <div class="detail-row">
                <div class="detail-label">{translations.chauffeur.events.travelTime}:</div>
                <div class="detail-value">{Math.round(travelTime)} {translations.chauffeur.events.minutes}</div>
            </div>
        {/if}
    </div>

    <div class="availability-section">
        <div class="availability-title">{translations.chauffeur.events.availability}:</div>
        {#if isLoading}
            <div class="status-message loading">
                {translations.chauffeur.events.loadingStatus}
            </div>
        {:else}
            <div class="availability-buttons">
                <button 
                    class="availability-button {currentStatus === 'Available' ? 'selected' : ''}"
                    on:click={() => updateAvailability('Available')}
                    disabled={isUpdating}
                >
                    {translations.chauffeur.events.statuses.available}
                </button>
                <button 
                    class="availability-button {currentStatus === 'Not Available' ? 'selected' : ''}"
                    on:click={() => updateAvailability('Not Available')}
                    disabled={isUpdating}
                >
                    {translations.chauffeur.events.statuses.notAvailable}
                </button>
                <button 
                    class="availability-button {currentStatus === 'Maybe Available' ? 'selected' : ''}"
                    on:click={() => updateAvailability('Maybe Available')}
                    disabled={isUpdating}
                >
                    {translations.chauffeur.events.statuses.maybeAvailable}
                </button>
            </div>
            <div class="availability-title"><br/>{translations.chauffeur.events.remarksLabel}</div>
            <div class="remarks-container">
                <textarea
                    bind:value={remarks}
                    on:input={handleRemarksChange}
                    placeholder={translations.chauffeur.events.remarksPlaceholder}
                    rows="2"
                    disabled={isUpdating}
                ></textarea>
            </div>

            {#if isUpdating}
                <div class="status-message updating">
                    {translations.chauffeur.events.updating}
                </div>
            {/if}

            {#if error}
                <div class="status-message error" transition:fade>
                    {error}
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .event-card {
        background: transparent;
        border: 2px solid #C9DA9A;
        border-radius: 7px;
        padding: 1.5rem;
        color: #C9DA9A;
        font-family: "Inter", sans-serif;
    }

    .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .event-title {
        color: #FFFFFF;
        font-family: "Inter", sans-serif;
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        line-height: 1.2;
    }

    .event-date {
        font-size: 16px;
        font-weight: 400;
        margin-top: 0.5rem;
    }

    .event-details {
        display: grid;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .detail-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .detail-label {
        min-width: 120px;
        font-weight: 500;
    }

    .detail-value {
        flex: 1;
    }

    .availability-section {
        border-top: 1px solid rgba(201, 218, 154, 0.3);
        padding-top: 1.5rem;
    }

    .availability-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    .availability-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
    }

    .availability-button {
        height: 40px;
        background: transparent;
        border: 2px solid #C9DA9A;
        border-radius: 7px;
        color: #C9DA9A;
        font-family: "Inter", sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .availability-button:hover {
        background-color: rgba(201, 218, 154, 0.1);
        border-color: #FFFFFF;
        color: #FFFFFF;
    }

    .availability-button.selected {
        background-color: #C9DA9A;
        color: #326334;
        border-color: #C9DA9A;
    }

    .availability-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .remarks-container {
        margin-top: 1rem;
        width: 100%;
    }

    textarea {
        width: 100%;
        padding: 0.5rem;
        border: 2px solid #C9DA9A;
        border-radius: 4px;
        font-family: inherit;
        resize: vertical;
        background-color: #497c4c;
    }

    textarea:disabled {
        background-color: #497c4c;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .event-card {
            padding: 1.25rem;
        }

        .event-header {
            margin-bottom: 1.25rem;
        }

        .event-title {
            font-size: 18px;
        }

        .event-details {
            margin-bottom: 1.25rem;
        }

        .detail-row {
            flex-direction: column;
            gap: 0.25rem;
        }

        .detail-label {
            min-width: unset;
        }

        .availability-section {
            padding-top: 1.25rem;
        }

        .availability-buttons {
            grid-template-columns: 1fr;
        }

        .availability-button {
            height: 44px;
        }
    }
</style>
