/**
 * Authentication utility functions for the application
 */

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const accessToken = localStorage.getItem('accessToken');

    const userData = localStorage.getItem('user');

    return !!accessToken && !!userData;
};

// Get the current authenticated user (client-side only)
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const userData = localStorage.getItem('user');
        if (!userData) return null;

        return JSON.parse(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// Get authentication headers for fetch requests
export const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
    }

    return headers;
};

export const logout = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/admin';
};


export const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return user?.isAdmin === true;
};


export const updateSession = (accessToken: string, refreshToken?: string, userData?: any): void => {
    if (typeof window === 'undefined') return;


    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }


    if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    }
};


export const getTokenExpiration = (token: string): number | null => {
    try {

        const payload = token.split('.')[1];
        if (!payload) return null;


        const decodedPayload = JSON.parse(atob(payload));


        return decodedPayload.exp || null;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};


export const isTokenExpired = (buffer = 300): boolean => {
    if (typeof window === 'undefined') return true;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return true;

    const expiration = getTokenExpiration(accessToken);
    if (!expiration) return true;


    const currentTime = Math.floor(Date.now() / 1000) + buffer;

    return expiration <= currentTime;
}; 