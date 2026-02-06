'use client';
import React, { useEffect } from 'react';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Typography,
  IconButton
} from '@mui/material';
import { MdDelete, MdEdit } from "react-icons/md";

const AddressList = ({
  addresses,
  addressLoading,
  addressError,
  deleteAddress,
  setEditAddress,
  setSelectedAddress,
  selectedAddress
}) => {

  // Automatically select the first valid address if none is selected
  useEffect(() => {
    if (!selectedAddress && addresses && addresses.length > 0) {
      const firstValidAddress = addresses.find(addr => addr && addr._id);
      if (firstValidAddress) {
        setSelectedAddress(firstValidAddress);
      }
    }
  }, [addresses, selectedAddress, setSelectedAddress]);

  if (addressLoading) return <CircularProgress />;
  if (addressError) return <Typography color="error">{addressError}</Typography>;
  if (!addresses || addresses.length === 0) {
    return <Typography>No saved addresses. Please add one.</Typography>;
  }

  return (
    <RadioGroup
      value={selectedAddress?._id || ""}
      onChange={(e) => {
        const selected = addresses.find(a => a && a._id === e.target.value);
        setSelectedAddress(selected || null);
      }}
      className="w-full"
    >
      {addresses
        .filter(addr => addr && addr._id) // ✅ filter out invalid entries
        .map((addr) => (
          <div
            key={addr._id}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg mb-3"
          >
            <FormControlLabel
              value={addr._id}
              control={<Radio />}
              label={`${addr.firstName} ${addr.lastName}, ${addr.addressLine1}, ${addr.city}, ${addr.postcode}`}
              className="flex-1 text-sm md:text-base break-words"
            />
            <div className="flex gap-2 self-end md:self-auto">
              <IconButton onClick={() => setEditAddress(addr)} size="small">
                <MdEdit className="text-lg" />
              </IconButton>
              <IconButton onClick={() => deleteAddress(addr._id)} size="small">
                <MdDelete className="text-lg text-red-500" />
              </IconButton>
            </div>
          </div>
        ))}
    </RadioGroup>
  );
};

export default AddressList;
