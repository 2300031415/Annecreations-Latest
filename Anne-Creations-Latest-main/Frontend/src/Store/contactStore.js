import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from './authStore';

export const useContactStore = create((set, get) => ({
  loading: false,
  error: null,

  // Action: send contact form
  contactUs: async (formData) => {
    try {
      set({ loading: true, error: null });

      // Build the payload with required fields
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        message: formData.message,
      };

      const res = await axios.post(`${API_URL}/api/contact`, payload);

      set({ loading: false });
      return res.data; // return response to the caller
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message,
      });
      throw err;
    }
  },
}));
