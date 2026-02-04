'use client';
import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import axiosClient from '@/lib/axiosClient';
import { generateOTPSignature } from '@/lib/signatureUtils';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SECRET_KEY = process.env.NEXT_PUBLIC_OTP_SECRET_KEY;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      MobileOTP: null,
      otpVerified: false, // ✅ New flag to track OTP verification
      isAdminSession: false,
      adminContext: null,

      // ---------------- TOKEN MANAGEMENT ----------------
      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
      setRefreshToken: (token) => set({ refreshToken: token }),

      // ---------------- LOGIN ----------------
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.post(`${API_URL}/api/customers/login`, { email, password }, { withCredentials: true });
          set({
            user: data.customer,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          set({ isLoading: false, error: errorMsg, isAuthenticated: false });
          return { success: false, error: errorMsg };
        }
      },

      // ---------------- REGISTER ----------------
      register: async (formData) => {
        
        set({ isLoading: true, error: null });
        try {
          const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            mobile: formData.mobile || formData.phone,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            newsletter: formData.termsAccepted || false,
            otp: formData.otp, // ✅ use stored OTP
          };

          const { data } = await axios.post(`${API_URL}/api/customers/register`, payload, { withCredentials: true });

          set({
            user: data.customer,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            otpVerified: false, // reset after register
            MobileOTP: null,
          });

          return { success: true, data };
        } catch (error) {
          console.error(error);
          const errorMsg = error?.response?.data?.message || error.message;
          set({ isLoading: false, error: errorMsg, isAuthenticated: false });
          return { success: false, error: errorMsg };
        }
      },

      // ---------------- SEND OTP ----------------
      sendOtp: async (mobile, clientSource = 'web') => {
      
        if (!SECRET_KEY) {throw new Error('SECRET_KEY is not defined in env');}

        try {
          set({ isLoading: true, error: null });
          const payload = { mobile, timestamp: Date.now() };
          const signature = generateOTPSignature(payload, SECRET_KEY);

          const response = await axios.post(
            `${API_URL}/api/customers/send-otp`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Client-Source': clientSource,
                'X-Signature': signature,
              },
            },
          );

          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          console.log(err);
          const errorMsg = err?.response?.data?.message || 'Failed to send OTP';
          console.error('OTP error:', errorMsg);
          set({ isLoading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      // ---------------- VERIFY / STORE OTP ----------------
      verifyOtpAndRegister: async (otp, formData) => {
        try {
          // ✅ store OTP first
          set({ MobileOTP: otp, otpVerified: true });

          // ✅ automatically call register after OTP success
          const response = await get().register(formData);

          return response;
        } catch (err) {
          console.error('verifyOtpAndRegister failed:', err);
          return { success: false, error: err.message || 'Verification failed' };
        }
      },

      // ---------------- OTP Helpers ----------------
      storeOTP: async (otp) => {
        set({ MobileOTP: otp });
        console.log('OTP stored:', otp);
        return { success: true };
      },

      clearOTP: () => set({ MobileOTP: null, otpVerified: false }),

      // ---------------- ADMIN LOGIN AS CUSTOMER ----------------
      handleAdminLoginAsCustomer: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.get(`${API_URL}/api/customers/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            user: data,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            isAdminSession: true,
            adminContext: data.adminContext || null,
          });

          return { success: true };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          set({
            isLoading: false,
            error: errorMsg,
            isAuthenticated: false,
            isAdminSession: false,
            adminContext: null,
          });
          return { success: false, error: errorMsg };
        }
      },

      // ---------------- LOGOUT ----------------
      logout: async () => {
        try {
          await axiosClient.post('/api/customers/logout', {}, { withCredentials: true });
        } catch (err) {
          console.warn('Logout request failed', err);
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isAdminSession: false,
          adminContext: null,
          MobileOTP: null,
          otpVerified: false,
        });
      },

      // ---------------- PROFILE ACTIONS ----------------
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosClient.put('/api/customers/profile', {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            mobile: profileData.mobile,
            newsletter: true,
          });
          set((state) => ({
            user: { ...state.user, ...data.customer },
            isLoading: false,
          }));
          return { success: true, data: data.customer };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          set({ isLoading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      getProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosClient.get('/api/customers/profile');
          set({ user: data, isLoading: false });
          return { success: true, data };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          set({ isLoading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      // ---------------- PASSWORD ----------------
      changePassword: async (currentPassword, newPassword, confirmPassword) => {
        try {
          const { data } = await axiosClient.post('/api/customers/change-password', {
            currentPassword,
            newPassword,
            confirmPassword,
          });
          return { success: true, message: data?.message || 'Password updated successfully!' };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          return { success: false, error: errorMsg };
        }
      },

      forgotPassword: async (email) => {
        try {
          const { data } = await axiosClient.post('/api/customers/forgot-password', { email });
          return { success: true, data };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          return { success: false, error: errorMsg };
        }
      },

      resetPassword: async (passwordData) => {
        try {
          await axios.post(`${API_URL}/api/customers/reset-password`, {
            token: passwordData.token,
            newPassword: passwordData.password,
            confirmPassword: passwordData.confirmPassword,
          });
          return { success: true };
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error.message;
          return { success: false, error: errorMsg };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isAdminSession: state.isAdminSession,
        adminContext: state.adminContext,
        MobileOTP: state.MobileOTP,
        otpVerified: state.otpVerified,
      }),
    },
  ),
);
  