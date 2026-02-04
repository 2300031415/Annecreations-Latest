import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import axiosClient from '@/lib/axiosClient';


export const useCheckoutStore = create(
  persist(
    (set, get) => ({
      orderId: null, // store billing/checkout response
      checkoutStatus: null, // store order status
      checkoutMessage: null, // store checkout status message
      loading: false,
      coupon: null,
      autoCouponData: null,
      manualCouponApplied: false,
      error: null,
      couponDetails: null,
      applyCouponError: null,

      // ✅ Start checkout
      startCheckout: async () => {
       
        set({ loading: true, error: null });

        try {
          const payload = {
            // languageId: billingData.languageId || "en",
            // paymentFirstName: billingData.paymentFirstName || billingData.firstName || "",
            // paymentLastName: billingData.paymentLastName || billingData.lastName || "",
            // paymentCompany: billingData.paymentCompany || billingData.company || "",
            // paymentAddress1: billingData.paymentAddress1 || billingData.addressLine1 || "",
            // paymentAddress2: billingData.paymentAddress2 || billingData.addressLine2 || "",
            // paymentCity: billingData.paymentCity || billingData.city || "",
            // paymentPostcode: billingData.paymentPostcode || billingData.postcode || "",

            paymentCountry: 'India',

            // paymentZone:
             
            //   billingData.paymentZone?.name ||
         
            //   billingData.zone?.name ||
           
            //   "",

            // paymentAddressFormat: billingData.paymentAddressFormat || billingData.addressFormat || "",

          };

          const res = await axiosClient.post('/api/checkout/start', payload);

          set({ orderId: res.data.data.orderId, loading: false });
          return res.data;
        } catch (err) {
         
          const message = err.response?.data?.message || 'Checkout start failed';
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      // ✅ Apply coupon
      applyCoupon: async ({ orderId, couponCode }) => {

        set({ loading: true, error: null, applyCouponError: null });
        try {
          const res = await axiosClient.post('/api/coupons/apply-coupon', {
            orderId,
            code: couponCode,

          });

          // For manual applyCoupon, success response doesn't have 'applied' field
          // It directly returns coupon, calculation, order data
          set({
            coupon: res.data.calculation,
            couponDetails: res.data.coupon,
            manualCouponApplied: true,
            autoCouponData: null, // Clear auto coupon when manual coupon is applied
            loading: false,
          });

          // Fetch updated checkout status after successful coupon application
          await get().fetchCheckoutStatus(orderId);

          return res.data;
        } catch (err) {


          const message = err.response?.data?.message;
          set({ applyCouponError: message, loading: false });
          throw err; // Re-throw to handle in component
        }
      },
      autoApplyCoupon: async (orderId) => {

  
        // Start loading and clear previous errors
        set({ loading: true, error: null });

        try {
    
          // Make API call to auto-apply coupon
          const res = await axiosClient.get(`/api/coupons/auto-apply/${orderId}`);
   

          // Update store with coupon data and stop loading
          set({
            autoCouponData: res.data,
            couponDetails: res.data.coupon,
            loading: false,
          });

          // Only fetch updated checkout status if coupon was successfully applied
          if (res.data.applied) {
            await get().fetchCheckoutStatus(orderId);
          }

          return res.data;
        } catch (err) {
          console.error('Error applying auto coupon:', err);
 

          // Update store with error and stop loading
          set({ applyCouponError: err.response?.data?.message || 'Auto coupon not available', loading: false });
          return null;
        }
      },

      // ✅ Fetch checkout status
      fetchCheckoutStatus: async (id) => {

        set({ loading: true, error: null });
        try {
          const res = await axiosClient.get(`/api/checkout/${id}/status`);

          // Extract coupon data if present
          const checkoutData = res.data.data;
          const updateObj = {
            checkoutStatus: checkoutData,
            loading: false,
          };

          // If coupon is applied to the order, update coupon-related state
          if (checkoutData.applied && checkoutData.coupon) {
            updateObj.couponDetails = checkoutData.coupon;
            updateObj.coupon = checkoutData.calculation;
            updateObj.checkoutMessage = checkoutData.message || null;
            // Set autoCouponData if this appears to be an auto-applied coupon
            // (when coupon has reason field, it's likely auto-applied)
            if (checkoutData.coupon.reason) {
              updateObj.autoCouponData = checkoutData;
            }
            // Note: We don't set manualCouponApplied here since we can't determine
            // from the status response whether it was manual or auto applied
          } else {
            // Clear coupon state if no coupon is applied
            updateObj.couponDetails = null;
            updateObj.coupon = null;
            updateObj.manualCouponApplied = false;
            // Only clear autoCouponData if it doesn't have a reason (meaning no auto apply was attempted)
            // Preserve autoCouponData with reason to prevent repeated auto apply attempts
            if (!get().autoCouponData?.reason) {
              updateObj.autoCouponData = null;
            }
            updateObj.checkoutMessage = null;
          }

          set(updateObj);
        } catch (err) {
          console.error('Failed to fetch checkout status:', err);
          set({
            error: err.response?.data?.message || 'Failed to fetch checkout status',
            loading: false,
          });
          throw new Error(err.response?.data?.message || 'Failed to fetch checkout status');
        }
      },

      // ✅ Cancel checkout
      cancelCheckout: async (id) => {
      
       
        if (!id) {
          set({ error: 'Order ID is required to cancel checkout' });
          return;
        }
        set({ loading: true, error: null });
        try {
          const res = await axiosClient.delete(`/api/checkout/${id}/cancel`);
          // Clear state after cancel
          set({
            CheckoutData: null,
            coupon: null,
            checkoutStatus: null,
            checkoutMessage: null,
            loading: false,
            orderId: null,
          });
          return res.data;
        } catch (err) {
          console.error('Cancel checkout error:', err);
          const message = err.response?.data?.message || 'Failed to cancel checkout';
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      paymentCreate: async (orderId) => {
        try {
          set({ loading: true, error: null });

          const payload = { orderId };
          const res = await axiosClient.post(
            '/api/checkout/payment/create',
            payload,
          );

          set({ loading: false });
          return res.data; // ✅ return the response so caller can use it
        } catch (err) {
          set({
            loading: false,
            error: err.response?.data?.message || err.message,
          });
          throw err; // ✅ rethrow so UI can handle failure
        }
      },

      // ✅ Clear checkout state
      clearCheckout: () =>
        set({
          CheckoutData: null,
          checkoutStatus: null,
          checkoutMessage: null,
          coupon: null,
          autoCouponData: null,
          manualCouponApplied: false,
          error: null,
          loading: false,
          response: null,
        }),

      // ✅ Reset loading state
      resetLoading: () => set({ loading: false }),

      // ✅ Remove manual coupon
      removeCoupon: () =>
        set({ 
          coupon: null,
          manualCouponApplied: false,
          applyCouponError: null,
        }),
    }),
    {
      name: 'checkout-storage', // persisted key in localStorage
    },
  ),
);
