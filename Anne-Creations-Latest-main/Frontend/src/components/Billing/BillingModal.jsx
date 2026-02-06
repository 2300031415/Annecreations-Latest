'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useCheckoutStore } from '../../Store/checkoutStore';
import { useBillingStore } from '@/Store/addressStore';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton
} from '@mui/material';
import { IoMdClose } from "react-icons/io";

import AddressList from './AddressList';
import BillingForm from './BillingForm';

const initialBillingState = {
  firstName: "", lastName: "", company: "",
  addressLine1: "", addressLine2: "", city: "",
  postcode: "", country: "", zone: "", preferedBillingAddress: false,
};

const BillingModal = ({ open, setOpen }) => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { startCheckout, loading, error } = useCheckoutStore();
  const {
    addresses, fetchAddresses, deleteAddress, updateAddress,
    addAddress, fetchZones, fetchCountries, zones, countries,
    loading: addressLoading, error: addressError,
  } = useBillingStore();

  const [editAddress, setEditAddress] = useState(null);
  const [form, setForm] = useState(initialBillingState);
  const [selectedAddress, setSelectedAddress] = useState(null);


  // Load addresses when modal opens
  useEffect(() => { if (open) fetchAddresses(); }, [open, fetchAddresses]);
  // Load countries on mount
  useEffect(() => { fetchCountries(); }, [fetchCountries]);
  // Load zones if editing
  useEffect(() => {
    if (editAddress?.country) {
      fetchZones(editAddress.country);
      setForm(editAddress);
    }
  }, [editAddress, fetchZones]);

  const handleClose = () => {
    setOpen(false);
    setEditAddress(null);
    setForm(initialBillingState);
    setSelectedAddress(null);
  };

  // 🔹 Format only payment fields
  const formatBillingData = (billingData) => ({
    paymentFirstName: billingData.firstName || "",
    paymentLastName: billingData.lastName || "",
    paymentCompany: billingData.company || "",
    paymentAddress1: billingData.addressLine1 || "",
    paymentAddress2: billingData.addressLine2 || "",
    paymentCity: billingData.city || "",
    paymentPostcode: billingData.postcode || "",
    paymentCountry: billingData.country || "",
    paymentZone: billingData.zone || "",
  });

  // 🔹 Save/Edit form and reload addresses
  const handleBillingSubmit = async (billingData) => {
    try {
      if (editAddress) {
        await updateAddress(editAddress._id, billingData);
        enqueueSnackbar('Address updated successfully!', { variant: 'success' });
      } else {
        await addAddress(billingData);
        enqueueSnackbar('New billing address added!', { variant: 'success' });
      }

      // 🔹 Refresh addresses so AddressList updates
      await fetchAddresses();

      // 🔹 Select the saved address
      setSelectedAddress(billingData);

      // 🔹 Reset form and close edit mode
      setEditAddress(null);
      setForm(initialBillingState);
    } catch (err) {
      enqueueSnackbar(error || 'Something went wrong!', { variant: 'error' });
    }
  };

  // 🔹 Final Step: proceed to checkout
  const handleNext = async () => {
    const dataToUse = selectedAddress || form;
    if (!dataToUse || !dataToUse.firstName) {
      enqueueSnackbar('Please select or add a billing address first.', { variant: 'warning' });
      return;
    }

    try {
      const response = await startCheckout(formatBillingData(dataToUse));
      if (response) {
        enqueueSnackbar('Proceeding to checkout...', { variant: 'success' });
        handleClose();
        router.push('/Checkout');
      }
    } catch (err) {
      enqueueSnackbar(error || 'Something went wrong!', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Billing Information
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <IoMdClose />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 🔹 Address Selection List */}
        <AddressList
          addresses={addresses}
          addressLoading={addressLoading}
          addressError={addressError}
          deleteAddress={deleteAddress}
          setEditAddress={setEditAddress}
          setSelectedAddress={setSelectedAddress}
          selectedAddress={selectedAddress}
        />

        {/* 🔹 Billing Form */}
        <BillingForm
          editAddress={editAddress}
          form={form}
          setForm={setForm}
          handleBillingSubmit={handleBillingSubmit}
          loading={loading}
          error={error}
          countries={countries}
          zones={zones}
          fetchZones={fetchZones}
        />
      </DialogContent>

      <DialogActions >
        <Button
          onClick={handleClose}
          variant="outlined"
          color='error'
          sx={{
            mt: 2,
            mb: 2,
            width: "10%",
            borderRadius: "8px",
            border: "2px solid",
            fontWeight: 600,
            fontSize: { xs: "14px", sm: "16px" },
            textTransform: "none",
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleNext}
          disabled={loading}
          sx={{
            mt: 2,
            mb:  2,
            width: "10%",
            borderRadius: "8px",
            border: "2px solid",
            fontWeight: 600,
            fontSize: { xs: "14px", sm: "16px" },
            textTransform: "none",
            borderColor: "var(--primary)",
            backgroundColor: "var(--primary)",
            color: "white",
            "&:hover": {
              backgroundColor: "white",
              color: "var(--secondary)",
            },
          }}
        >
          {"Next"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillingModal;
