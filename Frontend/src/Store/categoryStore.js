import axios from 'axios';
import { create } from 'zustand';

import { API_URL } from './authStore';
import axiosClient from '@/lib/axiosClient';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  products: {
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 1,
    },
  },
  isCategoriesLoading: false,
  isProductsLoading: false,
  error: null,
  _categoriesAbortController: null, // for cancelling category requests
  _productsAbortController: null, // for cancelling product requests

  // Fetch all categories
  fetchCategories: async () => {
    set({ isCategoriesLoading: true, error: null });

    // Cancel any existing category request
    if (get()._categoriesAbortController) {
      get()._categoriesAbortController.abort();
    }
    const abortController = new AbortController();
    set({ _categoriesAbortController: abortController });

    try {
      const response = await axios.get(`${API_URL}/api/categories`, {
        signal: abortController.signal,
      });

      // Normalize and sort categories and their subcategories alphabetically
      const rawCategories = Array.isArray(response.data.data) ? response.data.data : [];
      const normalizeSubcategories = (sub) => {
        if (!Array.isArray(sub)) return [];
        // if sub items are objects with a name field, sort by name
        if (sub.length > 0 && typeof sub[0] === 'object') {
          return [...sub]
            .filter((s) => s && (s.name || s.label))
            .sort((a, b) => ((a.name || a.label) || '').localeCompare((b.name || b.label) || ''));
        }
        // otherwise assume array of strings
        return [...new Set(sub.filter(Boolean))].sort((a, b) => a.localeCompare(b));
      };

      const categories = rawCategories
        .map((cat) => ({
          ...cat,
          subcategories: normalizeSubcategories(cat.subcategories),
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      set({
        categories,
        isCategoriesLoading: false,
        _categoriesAbortController: null,
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        // Request was cancelled, do nothing
        return;
      }

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'An error occurred';
      set({ isCategoriesLoading: false, error: errorMsg, _categoriesAbortController: null });
    }
  },

  // Reset only products and cancel product requests
  resetProducts: () => {
    const productsController = get()._productsAbortController;
    if (productsController) {
      productsController.abort();
    }

    set({
      products: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } },
      error: null,
      _productsAbortController: null,
    });
  },

  // Fetch products for a category with pagination
  fetchCategoryProducts: async (categoryId, page = 1, sort = 'price_asc', filters = {}) => {
    const { products } = get();
    set({ isProductsLoading: true, error: null });

    // Cancel previous product request if it exists
    if (get()._productsAbortController) {
      get()._productsAbortController.abort();
    }
    const abortController = new AbortController();
    set({ _productsAbortController: abortController });

    try {
      const params = { page, sort, ...filters };

      // Serialize array params properly for axios (e.g. priceRanges[]=100-200&priceRanges[]=500+)
      const queryString = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (Array.isArray(params[key])) {
          params[key].forEach(val => queryString.append(key, val));
        } else if (params[key] !== undefined && params[key] !== null) {
          queryString.append(key, params[key]);
        }
      });

      const response = await axiosClient.get(
        `/api/products/category/${categoryId}?${queryString.toString()}`,
        { signal: abortController.signal },
      );

      const { data, pagination } = response.data;

      set({
        products: {
          data: page > 1 ? [...products.data, ...data] : data,
          pagination,
        },
        isProductsLoading: false,
        _productsAbortController: null,
      });

      return { data, pagination };
    } catch (error) {
      if (axios.isCancel(error)) {
        // Request was cancelled, do nothing
        return { data: [], pagination: products.pagination };
      }

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'An error occurred';

      set({ isProductsLoading: false, error: errorMsg, _productsAbortController: null });
      throw new Error(errorMsg);
    }
  },
}));
