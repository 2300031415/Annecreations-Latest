import { createApi, fetchBaseQuery, FetchBaseQueryError, BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query/react';
import { updateSession } from '@/lib/auth';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Mutex to prevent multiple simultaneous refresh token requests
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Base query configuration
const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState, endpoint, type, forced, extra, arg }) => {
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                headers.set('authorization', `Bearer ${accessToken}`);
            }
        }

        const isFormData = typeof arg !== 'string' && arg?.body instanceof FormData;
        if (isFormData) {
            console.log('FormData detected, not setting Content-Type header');

            if (headers.has('Content-Type')) {
                headers.delete('Content-Type');
            }
        } else {
            headers.set('Content-Type', 'application/json');
        }

        return headers;
    },
});

// Base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await baseQuery(args, api, extraOptions);

    // Check if we got a 401 or 403 error
    if (result.error && (result.error.status === 401 || result.error.status === 403)) {
        
        // If already refreshing, wait for that refresh to complete
        if (isRefreshing && refreshPromise) {
            console.log('Refresh already in progress, waiting for it to complete...');
            try {
                await refreshPromise;
                // Retry the original request with the refreshed token
                console.log('Retrying original request after refresh...');
                result = await baseQuery(args, api, extraOptions);
                return result;
            } catch {
                // Refresh failed, return the error
                return result;
            }
        }

        // Start refresh process
        isRefreshing = true;
        console.log('Token expired or unauthorized, attempting to refresh (first request only)...');

        // Get the refresh token
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (refreshToken) {
            // Create the refresh promise that other requests can wait on
            refreshPromise = (async () => {
                try {
                    const refreshResult = await baseQuery(
                        {
                            url: '/api/admin/refresh-token',
                            method: 'POST',
                            body: { refreshToken },
                            credentials: 'include',
                        },
                        api,
                        extraOptions
                    );

                    if (refreshResult.data) {
                        const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as {
                            accessToken: string;
                            refreshToken?: string;
                        };

                        // Update tokens in localStorage
                        updateSession(accessToken, newRefreshToken);

                        console.log('Token refreshed successfully');
                        return true;
                    } else {
                        // Refresh token is invalid, logout the user
                        console.log('Refresh token is invalid, logging out...');
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            localStorage.removeItem('user');
                            window.location.href = '/admin';
                        }
                        return false;
                    }
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    // Logout on refresh failure
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        window.location.href = '/admin';
                    }
                    return false;
                } finally {
                    // Reset refresh state
                    isRefreshing = false;
                    refreshPromise = null;
                }
            })();

            // Wait for refresh to complete
            const refreshSuccess = await refreshPromise;
            
            if (refreshSuccess) {
                // Retry the original request with the new token
                result = await baseQuery(args, api, extraOptions);
            }
        } else {
            // No refresh token available, logout
            console.log('No refresh token available, logging out...');
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/admin';
            }
            isRefreshing = false;
            refreshPromise = null;
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'Auth',
        'AdminProfile',
        'Products',
        'Coupons',
        'Categories',
        'Orders',
        'Customers',
        'Users',
        'Analytics',
        'Marketing',
        'Settings',
        'Dashboard',
        'Sales',
        'OnlineUsers',
        'Banners',
        'Roles',
        'Admins'
    ],
    endpoints: () => ({}),
});

export const isErrorWithMessage = (
    error: unknown
): error is { data: { message: string } } => {
    return (
        typeof error === 'object' &&
        error != null &&
        'data' in error &&
        typeof (error as any).data === 'object' &&
        'message' in (error as any).data
    );
};

export const getErrorMessage = (error: FetchBaseQueryError | undefined): string => {
    if (!error) return 'An unknown error occurred';

    if (isErrorWithMessage(error)) {
        return error.data.message;
    }

    return 'Failed to process your request. Please try again.';
}; 