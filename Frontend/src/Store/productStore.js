import { create } from "zustand";
import axiosClient from "@/lib/axiosClient";

export const useProductStore = create((set) => ({
  products: [],
  productDetail: null,
  relatedProducts: [],

  isProductsLoading: false,
  isProductDetailLoading: false,
  isRelatedProductsLoading: false,

  error: null,

  pagination: null,

  // =============================
  // FETCH ALL PRODUCTS
  // =============================
  fetchProducts: async (limit = 5000) => {
    set({ isProductsLoading: true, error: null });

    try {
      const res = await axiosClient.get("/api/products", {
        params: { limit }
      });

      const productsArray = res.data?.data || [];
      const paginationData = res.data?.pagination || null;

      set({
        products: productsArray,
        pagination: paginationData,
        isProductsLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isProductsLoading: false,
      });
    }
  },

  // =============================
  // FETCH PRODUCTS BY FILTER (Tab)
  // =============================
  fetchProductsByFilter: async (filterType, limit = 5000) => {
    set({ isProductsLoading: true, error: null });

    try {
      // Use 'tab' query param which backend supports
      const params = { tab: filterType, limit };
      const res = await axiosClient.get("/api/products", { params });

      const productsArray = res.data?.data || [];
      const paginationData = res.data?.pagination || null;

      set({
        products: productsArray,
        pagination: paginationData,
        isProductsLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isProductsLoading: false,
      });
    }
  },

  // =============================
  // FETCH SINGLE PRODUCT
  // =============================
  fetchProductById: async (productModel) => {
    set({ isProductDetailLoading: true, error: null });

    try {
      const res = await axiosClient.get(`/api/products/${productModel}`);

      set({
        productDetail: res.data?.data || res.data,
        isProductDetailLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isProductDetailLoading: false,
      });
    }
  },

  // =============================
  // FETCH RELATED PRODUCTS
  // =============================
  fetchProductIdRelatedProducts: async (productModel) => {
    set({ isRelatedProductsLoading: true, error: null });

    try {
      const res = await axiosClient.get(
        `/api/products/${productModel}/related`
      );

      set({
        relatedProducts: res.data?.data || res.data || [],
        isRelatedProductsLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isRelatedProductsLoading: false,
      });
    }
  },
  // =============================
  // FETCH PRODUCTS BY IDS (Bulk)
  // =============================
  fetchProductsByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    set({ isProductsLoading: true, error: null });

    try {
      // Since there's no bulk endpoint, we fetch them individually or use a filter
      // For now, let's use the individual fetch for each ID to ensure we get the full details
      const promises = ids.map(id => axiosClient.get(`/api/products/${id}`));
      const results = await Promise.all(promises);
      const products = results.map(res => res.data?.data || res.data);

      set({ isProductsLoading: false });
      return products;
    } catch (err) {
      console.error("FETCH PRODUCTS BY IDS ERROR:", err);
      set({
        error: err.response?.data?.message || err.message,
        isProductsLoading: false,
      });
      return [];
    }
  },

  // =============================
  // REVIEWS
  // =============================
  reviews: [],
  reviewStats: { averageRating: 0, totalReviews: 0 },
  isReviewsLoading: false,

  fetchReviewsByProductId: async (productId) => {
    set({ isReviewsLoading: true });
    try {
      const res = await axiosClient.get(`/api/reviews/${productId}`);
      set({
        reviews: res.data?.data || [],
        reviewStats: res.data?.meta || { averageRating: 0, totalReviews: 0 },
        isReviewsLoading: false,
      });
    } catch (err) {
      console.error("FETCH REVIEWS ERROR:", err);
      set({ isReviewsLoading: false });
    }
  },

  submitReview: async (reviewData) => {
    try {
      const res = await axiosClient.post("/api/reviews", reviewData);
      // Refresh reviews after submission
      if (res.status === 201) {
        const { productId } = reviewData;
        const currentStore = useProductStore.getState();
        await currentStore.fetchReviewsByProductId(productId);
        return { success: true };
      }
    } catch (err) {
      console.error("SUBMIT REVIEW ERROR:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to submit review",
      };
    }
  },
}));
