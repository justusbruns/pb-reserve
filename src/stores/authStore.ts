import { writable } from 'svelte/store';

interface ChauffeurUser {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    user: ChauffeurUser | null;
    isAuthenticated: boolean;
}

// Initialize state from localStorage if it exists
const storedAuth = localStorage.getItem('authState');
const initialState: AuthState = storedAuth 
    ? JSON.parse(storedAuth)
    : { user: null, isAuthenticated: false };

const createAuthStore = () => {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        login: (user: ChauffeurUser) => {
            const newState = { user, isAuthenticated: true };
            localStorage.setItem('authState', JSON.stringify(newState));
            set(newState);
        },
        logout: () => {
            localStorage.removeItem('authState');
            set({ user: null, isAuthenticated: false });
        }
    };
};

export const authStore = createAuthStore();
