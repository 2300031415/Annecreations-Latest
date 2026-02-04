'use client';

import { create } from 'zustand';
import { API_URL } from './authStore'; // adjust the path

export const useAuthStore = create((set) => ({
  isVerifying: false,
  verifyMessage: '',
  isResending: false,
  resendMessage: '',

  verifyEmail: async (email, token) => {
    if (!email || !token) {
      set({ verifyMessage: '❌ Missing token or email in the URL.' });
      return false;
    }

    set({ isVerifying: true, verifyMessage: '' });

    try {
      const res = await fetch(`${API_URL}/api/customers/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();

      if (res.ok) {
        set({ verifyMessage: '✅ Email verified successfully!' });
        return true;
      } else {
        set({ verifyMessage: data.error || '❌ Verification failed.' });
        return false;
      }
    } catch (err) {
      console.error(err);
      set({ verifyMessage: '⚠️ Something went wrong. Please try again.' });
      return false;
    } finally {
      set({ isVerifying: false });
    }
  },

  resendVerification: async (email) => {
    if (!email) {
      set({ resendMessage: '❌ Email is required to resend verification.' });
      return false;
    }

    set({ isResending: true, resendMessage: '' });

    try {
      const res = await fetch(`${API_URL}/api/customers/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        set({ resendMessage: '✅ Verification email resent successfully!' });
        return true;
      } else {
        set({ resendMessage: data.error || '❌ Failed to resend verification email.' });
        return false;
      }
    } catch (err) {
      console.error(err);
      set({ resendMessage: '⚠️ Something went wrong. Please try again.' });
      return false;
    } finally {
      set({ isResending: false });
    }
  },
}));
