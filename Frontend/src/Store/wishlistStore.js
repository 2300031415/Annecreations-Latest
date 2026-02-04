import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '@/lib/axiosClient';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      wishlistCount: 0,
      loading: false,
      error: null,

      // Fetch wishlist
      getWishlist: async () => {
        if (get().loading) return; 
        set({ loading: true, error: null });
        try {
          const { data } = await axiosClient.get('/api/wishlist');
  
     
          set({
            wishlist: data.data.products,
            wishlistCount: data.data.count || 0,
          });
        } catch (err) {
          const message =
            err?.response?.data?.message || err?.message || 'Failed to fetch wishlist.';
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      // Add product to wishlist
      addToWishlist: async (product) => {
    
        set({ error: null });
        try {
          await axiosClient.post('/api/wishlist/add', {
            productId: product._id,
          });
          await get().getWishlist(); // Refresh wishlist
        } catch (err) {
          const message =
            err?.response?.data?.message || err?.message || 'Failed to add product to wishlist.';
          set({ error: message });
        }
      },

      // Remove product from wishlist
      removeFromWishlist: async (product_id) => {
 
        set({ error: null });
        try {
          await axiosClient.delete(`/api/wishlist/remove/${product_id}`);
          set((state) => {
            const updatedWishlist = state.wishlist.filter(
              (item) => item._id !== product_id && item.id !== product_id
            );
            return {
              wishlist: updatedWishlist,
              wishlistCount: updatedWishlist.length,
            };
          });
        } catch (err) {
          const message =
            err?.response?.data?.message || err?.message || 'Failed to remove product from wishlist.';
          set({ error: message });
        }
      },
      clearWishlist: () => set({ wishlist: [], wishlistCount: 0})
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
        wishlistCount: state.wishlistCount,
      }),
    }
  )
);

export default useWishlistStore;
