import { create } from 'zustand';
import { API_URL } from './authStore'; // ✅ include useAuthStore
import axios from 'axios';

export const useSearchStore = create((set) => ({
  matchingProducts: [],
  loading: false,
  error: null,

  fetchMatchingProducts: async (searchTerm, page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/search/suggestions`, {
        params: { q: searchTerm, page },
      });
      set({ matchingProducts: response.data.products, loading: false });
    } catch (err) {
      set({ error: err.message || 'Error fetching products', loading: false });
    }
  },

  visualSearch: async (imageFile) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await axios.post(`${API_URL}/api/search/visual`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      set({ matchingProducts: response.data.products, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || 'Error uploading image',
        loading: false
      });
    }
  },

  clearMatchingProducts: () => set({ matchingProducts: [], error: null }),
}));
