import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosClient from "@/lib/axiosClient";

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      cartCount: 0,
      subtotal: 0,
      cartLoader: false, // ✅ single loader state

      // ✅ Get cart from API
      getCartItem: async () => {
        set({ cartLoader: true });
        try {
          const response = await axiosClient.get("/api/cart");
          set({
            cart: response.data.items || [],
            subtotal: response.data.subtotal || 0,
            cartCount: response.data.itemCount || 0,
          });
        } catch (error) {
          console.error(
            "Error fetching cart items:",
            error?.response?.data || error.message
          );
        } finally {
          set({ cartLoader: false });
        }
      },

      // ✅ Add item to cart
      addToCart: async (item) => {
        set({ cartLoader: true });
        try {
          const options = Array.isArray(item.options)
            ? item.options.map((opt) =>
                typeof opt === "string" ? opt : opt._id
              )
            : [];

          await axiosClient.post("/api/cart/add", {
            productId: item.productId,
            options,
          });

          await get().getCartItem();
        } catch (error) {
          console.error(
            "❌ Failed to add to cart:",
            error?.response?.data || error.message
          );
        } finally {
          set({ cartLoader: false });
        }
      },

      // ✅ Remove item from cart
      removeFromCart: async (itemId) => {
        set({ cartLoader: true });
        try {
          await axiosClient.delete(`/api/cart/remove/${itemId}`);
          await get().getCartItem();
        } catch (error) {
          console.error(
            "Failed to remove from cart:",
            error?.response?.data || error.message,
          );
        } finally {
          set({ cartLoader: false });
        }
      },

      // ✅ Clear cart completely
      clearCart: async () => {
        set({ cartLoader: true });
        try {
          await axiosClient.post("/api/cart/clear");
          set({ cart: [], cartCount: 0, subtotal: 0 });
        } catch (error) {
          console.error(
            "Failed to clear cart:",
            error?.response?.data || error.message,
          );
        } finally {
          set({ cartLoader: false });
        }
      },
      clearCartState: () => set({ cart: [], cartCount: 0,}),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        cart: state.cart,
        cartCount: state.cartCount,
        subtotal: state.subtotal,
      }),
    }
  )
);

export default useCartStore;
