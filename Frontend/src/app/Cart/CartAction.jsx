'use client';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '../../Store/checkoutStore';
import useCartStore from '../../Store/cartStore';
import BillingModal from '@/components/Billing/BillingModal';
import { useMediaQuery } from '@mui/material';

const CartActions = ({ onContinue }) => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const {startCheckout, loading, clearCheckout } = useCheckoutStore();
  const { cartCount } = useCartStore();
  const [open, setOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width:632px)');
  
  // Disable checkout if cart is empty
  const isDisabled = loading || cartCount === 0;

  const handleCheckout = async () => {
    try {
      // Clear any existing checkout state before starting new checkout
      clearCheckout();

      await startCheckout();
      router.push('/Checkout');
    } catch (error) {
      console.error('Failed to start checkout:', error);
      enqueueSnackbar('Failed to start checkout. Please try again.', {
        variant: 'error',
      });
    }
  };

  return (
    <>
      {/* Cart action buttons */}
      <div
        className={`flex gap-4 flex-wrap justify-between ${isMobile ? 'flex-col-reverse' : 'flex-row'}`}
      >
        <button
          onClick={onContinue}
          className="rounded-lg font-[700] text-md px-4 py-2 border-[var(--primary)] hover:bg-[var(--primary)] border-2 cursor-pointer text-[var(--secondary)]"
        >
          Continue Shopping
        </button>
        <button
          onClick={handleCheckout}
          disabled={isDisabled}
          className={`${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          } bg-[var(--primary)] border-2 text-md hover:bg-white border-[var(--primary)] font-[700] rounded-lg px-8 py-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-[var(--secondary)]`}
        >
          {loading ? 'Processing...' : 'Check out'}
        </button>
      </div>

      {/* Billing Modal */}
      {/* <BillingModal open={open} setOpen={setOpen} /> */}
    </>
  );
};

export default CartActions;
