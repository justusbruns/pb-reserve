let apiToken: string | null = null;

interface ApiRequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Get the API token from the server
 */
async function getToken(): Promise<string> {
    if (!apiToken) {
        const response = await fetch('/api/auth');
        const data = await response.json();
        apiToken = data.token;
    }
    return apiToken;
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<any> {
    const token = await getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(endpoint, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

/**
 * Geocoding API methods
 */
export async function geocodeAddress(address: string, language: string = 'en'): Promise<any> {
    const params = new URLSearchParams({ address, language });
    return apiRequest(`/api/geocoding?${params}`);
}

export async function reverseGeocode(lng: number, lat: number): Promise<any> {
    return apiRequest('/api/geocoding', {
        method: 'POST',
        body: JSON.stringify({ lng, lat })
    });
}

export { apiRequest };
