<script lang="ts">
    import { personService } from '../services/airtable/personService';
    import { authStore } from '../stores/authStore';
    import { fade } from 'svelte/transition';

    export let translations: any;

    let email = '';
    let password = '';
    let error = '';
    let isLoading = false;

    async function handleSubmit(event: Event) {
        event.preventDefault();
        isLoading = true;
        error = '';

        try {
            const people = await personService.getByEmail(email);
            
            if (!people || people.length === 0) {
                throw new Error(translations.chauffeur.errors.invalidCredentials);
            }

            const person = people[0];
            if (person.fields['Type of person'] !== 'Chauffeur' || person.fields.Password !== password) {
                throw new Error(translations.chauffeur.errors.invalidCredentials);
            }

            // Login successful
            authStore.login({
                id: person.id,
                email: person.fields.Email,
                name: person.fields.Name
            });

        } catch (err) {
            console.error('Login error:', err.message);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="login-container" in:fade>
    <div class="login-box">
        <div class="logo-container">
            <div class="logo"></div>
        </div>

        <h1 class="title">{translations.chauffeur.login.title}</h1>
        
        <form on:submit={handleSubmit}>
            <div class="form-group">
                <label for="email" class="field-label">{translations.chauffeur.login.email}:</label>
                <input 
                    type="email" 
                    id="email"
                    class="field-input"
                    bind:value={email}
                    required
                    disabled={isLoading}
                    placeholder={translations.chauffeur.login.emailPlaceholder}
                />
            </div>

            <div class="form-group">
                <label for="password" class="field-label">{translations.chauffeur.login.password}:</label>
                <input 
                    type="password" 
                    id="password"
                    class="field-input"
                    bind:value={password}
                    required
                    disabled={isLoading}
                    placeholder={translations.chauffeur.login.passwordPlaceholder}
                />
            </div>

            {#if error}
                <div class="error-message" transition:fade>
                    {error}
                </div>
            {/if}

            <button type="submit" class="submit-button" disabled={isLoading}>
                {#if isLoading}
                    {translations.chauffeur.login.loading}
                {:else}
                    {translations.chauffeur.login.submit}
                {/if}
            </button>
        </form>
    </div>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #326334;
        padding: 1rem;
    }

    .login-box {
        width: 100%;
        max-width: 480px;
        background: transparent;
        padding: 3rem;
        border: 2px solid #C9DA9A;
        border-radius: 7px;
    }

    .title {
        text-align: center;
        margin: 0 0 3rem 0;
        color: #FFFFFF;
        font-family: "Inter", sans-serif;
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
    }

    .form-group {
        margin-bottom: 2rem;
    }

    .field-label {
        display: block;
        margin-bottom: 0.75rem;
        color: #C9DA9A;
        font-family: "Inter", sans-serif;
        font-size: 16px;
        font-weight: 400;
        line-height: normal;
    }

    .field-input {
        width: 100%;
        height: 50px;
        min-height: 50px;
        padding: 8px 12px;
        border: 2px solid #C9DA9A;
        border-radius: 7px;
        background: transparent;
        color: #C9DA9A;
        font-family: "Inter", sans-serif;
        font-size: 16px !important;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }

    .field-input:focus {
        outline: none;
        border-color: #FFFFFF;
    }

    .field-input:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .field-input::placeholder {
        color: rgba(201, 218, 154, 0.6);
    }

    .error-message {
        color: #FFFFFF;
        text-align: center;
        margin: 1rem 0;
        padding: 0.75rem;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 7px;
        font-family: "Inter", sans-serif;
        font-size: 14px;
    }

    .submit-button {
        width: 100%;
        height: 50px;
        background-color: #C9DA9A;
        color: #326334;
        border: none;
        border-radius: 7px;
        font-family: "Inter", sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 2rem;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #FFFFFF;
    }

    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .logo-container {
        text-align: center;
        margin-bottom: 2rem;
    }

    .logo {
        width: 100px;
        height: 100px;
        margin: 0 auto;
        background-image: url('/images/poemboothlogo.png');
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
    }

    @media (max-width: 480px) {
        .login-box {
            padding: 2rem;
        }

        .title {
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .field-label {
            margin-bottom: 0.5rem;
        }

        .submit-button {
            margin-top: 1.5rem;
        }
    }
</style>
