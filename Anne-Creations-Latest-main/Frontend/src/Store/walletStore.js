import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

// Get API URL from env or default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const useWalletStore = create((set, get) => ({
    balance: 0,
    currency: 'INR',
    transactions: [],
    isLoading: false,
    error: null,

    // Fetch Wallet Data
    fetchWallet: async () => {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) return;

        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/wallet`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response.data.success) {
                set({
                    balance: response.data.data.balance,
                    currency: response.data.data.currency,
                    transactions: response.data.data.transactions,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.error('Fetch wallet error:', error);
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Failed to fetch wallet details'
            });
        }
    },

    // 1. Initiate Add Funds (Get Razorpay Order)
    initiateAddFunds: async (amount) => {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) return { success: false, message: 'Not authenticated' };

        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${API_URL}/wallet/initiate-add`,
                { amount },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            set({ isLoading: false });
            if (response.data.success) {
                return { success: true, data: response.data.data };
            }
            return { success: false, message: response.data.message || 'Failed to initiate payment' };
        } catch (error) {
            console.error('Initiate funds error:', error);
            set({ isLoading: false, error: error.response?.data?.message || 'Failed to initiate payment' });
            return { success: false, message: error.response?.data?.message || 'Failed to initiate payment' };
        }
    },

    // 2. Verify Payment & Add to Wallet
    verifyAddFunds: async (paymentData) => {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) return { success: false, message: 'Not authenticated' };

        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${API_URL}/wallet/verify-add`,
                paymentData,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.data.success) {
                // Refresh wallet to update UI
                await get().fetchWallet();
                return { success: true, message: 'Funds added successfully!' };
            }
            return { success: false, message: response.data.message || 'Payment verification failed' };
        } catch (error) {
            console.error('Verify funds error:', error);
            set({ isLoading: false, error: error.response?.data?.message || 'Payment verification failed' });
            return { success: false, message: error.response?.data?.message || 'Payment verification failed' };
        }
    },
}));

export default useWalletStore;
