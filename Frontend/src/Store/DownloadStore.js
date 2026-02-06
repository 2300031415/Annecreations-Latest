import { create } from 'zustand';
import axiosClient from '@/lib/axiosClient';

export const useDownloadStore = create((set) => ({
  downloads: [],
  totalDownloads: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  isSearchMode: false,

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  // ✅ Fetch all downloadable orders
  fetchDownloads: async (page = 1) => {
    set({ isLoading: true, error: null, isSearchMode: false });

    try {
      const response = await axiosClient.get(`/api/orders?page=${page}`);
      const { data, pagination } = response.data;

      set({
        downloads: data || [],
        totalDownloads: pagination?.total || data.length,
        totalPages: pagination?.pages || 1,
        currentPage: pagination?.page || page,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message;

      set({ isLoading: false, error: errorMsg });
    }
  },

  // ✅ Search orders (for downloads)
  searchDownloads: async (searchQuery) => {
    set({ isLoading: true, error: null, isSearchMode: true });

    try {
      const response = await axiosClient.get(
        `/api/orders?search=${encodeURIComponent(searchQuery)}&page=1&limit=100`
      );
      const { data, pagination } = response.data;

      set({
        downloads: data || [],
        totalDownloads: pagination?.total || data.length,
        totalPages: 1, // disable pagination for search
        currentPage: 1,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message;

      set({ isLoading: false, error: errorMsg });
    }
  },
}));
