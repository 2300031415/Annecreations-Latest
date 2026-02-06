/**
 * Customer authentication utility functions
 */

import { Customer } from "@/lib/redux/api/customerApi";

// Check if a customer is authenticated (client-side only)
export const isCustomerAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for customer access token in localStorage
    const accessToken = localStorage.getItem('customerAccessToken');

    // Get customer data from localStorage
    const customerData = localStorage.getItem('customer');

    return !!accessToken && !!customerData;
};

// Get the current authenticated customer (client-side only)
export const getCurrentCustomer = (): Partial<Customer> | null => {
    if (typeof window === 'undefined') return null;

    try {
        const customerData = localStorage.getItem('customer');
        if (!customerData) return null;

        return JSON.parse(customerData);
    } catch (error) {
        console.error('Error parsing customer data:', error);
        return null;
    }
};

// Get customer authentication headers for fetch requests
export const getCustomerAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('customerAccessToken');
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
    }

    return headers;
};

// Log out the customer (client-side only)
export const customerLogout = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('customerAccessToken');
    localStorage.removeItem('customerRefreshToken');
    localStorage.removeItem('customer');

    // Redirect to home page or login page
    window.location.href = '/admin';
};

// Format customer full name
export const getCustomerFullName = (customer: Partial<Customer> | null): string => {
    if (!customer) return '';

    return `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
}; 