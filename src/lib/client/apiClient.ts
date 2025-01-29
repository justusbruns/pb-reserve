let apiToken: string | null = null;

interface ApiRequestOptions {
    method?: string;
    body?: any;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Login to get a session token
 */
export async function login(credentials: LoginCredentials): Promise<void> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }
}

/**
 * Get the API token using session authentication
 */
async function getToken(): Promise<string> {
    if (!apiToken) {
        const response = await fetch('/api/auth');
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        const data = await response.json();
        apiToken = data.token;
    }
    return apiToken;
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint path
 * @param options - Request options
 */
export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
    const {
        method = 'GET',
        body,
        params = {},
        headers = {}
    } = options;

    // Build URL with query parameters
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    // Prepare request options
    const requestOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        credentials: 'include' // Important: This ensures cookies are sent with the request
    };

    // Add body if present
    if (body) {
        requestOptions.body = JSON.stringify(body);
    }

    // Make the request
    const response = await fetch(url.toString(), requestOptions);

    // Handle response
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
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
