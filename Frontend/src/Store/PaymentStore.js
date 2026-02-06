import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import axiosClient from '@/lib/axiosClient';

export const usePaymentStore = create(
  persist(
    (set) => ({
      paymentInfo: null,
      paymentLoader: false,
      verificationResult: null, // store verify result

      createPaymentInfo: async (orderId) => {
        set({ paymentLoader: true });
        try {
          const res = await axiosClient.post('/api/checkout/payment/create', {
            orderId,
          });
          
          return res.data.data;
        } catch (err) {
          console.error('Create payment failed:', err);
          return null;
        } finally {
          set({ paymentLoader: false });
        }
      },

      verifyPayment: async (payload) => {
     
        set({ paymentLoader: true });
        try {
          const res = await axiosClient.post('/api/checkout/payment/verify', {
            orderId: payload.orderId,
            razorpayOrderId: payload.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            razorpaySignature: payload.razorpaySignature,
          });
          set({ verificationResult: res.data });
          return res.data;
        } catch (err) {
          console.error('Payment verification failed:', err);
          return null;
        } finally {
          set({ paymentLoader: false });
        }
      },

      retryPayment: async (orderId) => {
        set({ paymentLoader: true });
        try {
          const res = await axiosClient.post('/api/checkout/retry-payment', {
            orderId,
          });
          set({ paymentInfo: res.data });
          return res.data;
        } catch (err) {
          console.error('Retry payment failed:', err);
          return null;
        } finally {
          set({ paymentLoader: false });
        }
      },
    }),
    {
      name: 'payment-store',
    },
  ),
);
