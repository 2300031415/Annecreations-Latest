import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { API_URL } from './authStore';

import axiosClient from '@/lib/axiosClient';

export const useBillingStore = create(
  persist(
    (set, get) => ({
      response: null,
      loading: false,
      error: null,
      addresses: [], // ✅ Store customer addresses
      zones: [],
      countries: [],

    

      // ✅ Get all addresses
      fetchAddresses: async () => {
        set({ loading: true, error: null });
        try {
          const res = await axiosClient.get('/api/customers/addresses');
  
          set({ addresses: res.data, loading: false });
          return res.data;
        } catch (err) {
          console.log(err);
          const errorMsg =
            err.response?.data?.message || 'Failed to fetch addresses';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      addAddress: async (formData) => {
        console.log('Adding address with data:', formData);
    
        set({ loading: true, error: null });
        try {
          // Send POST request with the exact structure
          const res = await axiosClient.post('/api/customers/addresses', {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.company,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            postcode: formData.postcode,
            country: formData.country, // country ID string
            zone: formData.zone,       // zone ID string
            preferedBillingAddress: formData.preferedBillingAddress, // boolean
          });

          // Update local addresses list
          const updatedAddresses = [...get().addresses, res.data.data];

          set({
            addresses: updatedAddresses,
            response: res.data,
            loading: false,
            error: null,
          });

          return res.data; // return API response
        } catch (err) {
          console.error('Error adding address:', err);
          const errorMsg =
      err.response?.data?.message || 'Failed to add address';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },


      // ✅ Update an address
      updateAddress: async (addressId, formData) => {
        set({ loading: true, error: null });
        try {
          const res = await axiosClient.put(
            `/api/customers/addresses/${addressId}`,
            {
              firstName: formData.firstName,
              lastName: formData.lastName,
              company: formData.company,
              addressLine1: formData.addressLine1,
              addressLine2: formData.addressLine2,
              city: formData.city,
              postcode: formData.postcode,
              country: formData.country,
              zone: formData.zone,
              preferedBillingAddress: formData.preferedBillingAddress,
            },
          );

          // update local state
          const updated = get().addresses.map((addr) =>
            addr.id === addressId ? res.data.data : addr,
          );

          set({
            addresses: updated,
            response: res.data,
            loading: false,
            error: null,
          });

          return res.data;
        } catch (err) {
          const errorMsg =
            err.response?.data?.message || 'Failed to update address';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      // ✅ Delete an address
      deleteAddress: async (addressId) => {
        
        set({ loading: true, error: null });
        try {
          await axiosClient.delete(`/api/customers/addresses/${addressId}`);

          // remove from local state
          const filtered = get().addresses.filter(
            (addr) => addr._id !== addressId,
          );

          set({
            addresses: filtered,
            loading: false,
            error: null,
          });

          return true;
        } catch (err) {
          const errorMsg =
            err.response?.data?.message || 'Failed to delete address';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      // =====================
      // Supporting data
      // =====================

      // ✅ Fetch Zones
      fetchZones: async (countryId) => {
        set({ loading: true, error: null });
        try {
          const res = await axios.get(`${API_URL}/api/zones`, {
            params: { countryId },
          });
          set({ zones: res.data.data, loading: false });
        } catch (err) {
          const errorMsg = err.response?.data?.message || 'Failed to fetch zones';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },


      // ✅ Fetch Countries
      fetchCountries: async () => {
        set({ loading: true, error: null });
        try {
          const res = await axios.get(`${API_URL}/api/countries`);
          set({ countries: res.data.data, loading: false });
        } catch (err) {
          const errorMsg =
            err.response?.data?.message || 'Failed to fetch countries';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      // ✅ Clear state
      clearBilling: () =>
        set({ response: null, error: null, addresses: [] }),
    }),
    {
      name: 'billing-storage',
    },
  ),
);
