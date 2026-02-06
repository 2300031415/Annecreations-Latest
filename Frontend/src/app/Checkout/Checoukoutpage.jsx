'use client';
import { useAuthStore } from '@/Store/authStore';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { keyframes } from '@mui/system';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { useCheckoutStore } from '@/Store/checkoutStore';
import OrderSummary from './OrderSummary';
import { usePaymentStore } from '@/Store/PaymentStore';
import useCartStore from '@/Store/cartStore';
import axiosClient from '@/lib/axiosClient';

// 🌟 Glow animation keyframes
const glowPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(150, 211, 88, 0.6); /* soft green glow */
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(150, 211, 88, 0.9); /* brighter glow */
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(150, 211, 88, 0.6);
  }
`;


const Page = () => {
  const { accessToken } = useAuthStore();
  const {
    fetchCheckoutStatus,
    applyCoupon,
    loading,
    coupon,
    applyCouponError,
    checkoutStatus,
    checkoutMessage,
    orderId,
    cancelCheckout,
    autoCouponData,
    autoApplyCoupon,
    manualCouponApplied,
    removeCoupon,
    couponDetails,
    clearCheckout,
    resetLoading
  } = useCheckoutStore();

  const { createPaymentInfo, verifyPayment } = usePaymentStore();
  const { clearCartState } = useCartStore();
  const router = useRouter();

  const [openDialog, setOpenDialog] = useState(false);
  const [paymentInfoState, setPaymentInfoState] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cart', href: '/Cart' },
    { label: 'Checkout', href: '/Checkout' },
  ];

  useEffect(() => {
    if (loading && orderId && checkoutStatus) {
      resetLoading();
    }
  }, [loading, orderId, checkoutStatus]);

  useEffect(() => {
    if (orderId && !checkoutStatus) {
      fetchCheckoutStatus(orderId).catch((error) => {
        console.error('Failed to fetch checkout status:', error);
        clearCheckout();
        router.push('/Cart');
      });
    } else if (!orderId) {
      router.push('/Cart');
    }
  }, [orderId, checkoutStatus]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleDialogAgree = async () => {
    setOpenDialog(false);
    if (!orderId) return;

    let paymentData;
    try {
      paymentData = await createPaymentInfo(orderId);
      setPaymentInfoState(paymentData);
    } catch (err) {
      console.error('Payment creation failed:', err);
      alert('Unable to initiate payment.');
      return;
    }

    // Check if payment is required
    if (paymentData?.paymentRequired === false) {
      // Mark order as completed (for free orders or coupon orders)
      try {        
        // Show success and redirect to orders/downloads
        clearCartState();
        clearCheckout();
        router.push('/Profile?tab=orders');
      } catch (err) {
        console.error('Failed to complete order:', err);
        alert('Failed to complete order. Please try again.');
      }
      return;
    }

    // Payment is required - initialize Razorpay and continue as normal
    const res = await loadRazorpayScript();
    if (!res || !window.Razorpay) return alert('Razorpay SDK failed to load.');

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'Annie Creations',
      notes: { merchant_order_id: paymentData.orderNumber },
      description: 'Computer Embroidery Designs',
      order_id: paymentData.razorpayOrderId,
      handler: async (response) => {
        setVerifying(true);
        const payload = {
          orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        };
        verifyPayment(payload)
          .then(() => {
            setTimeout(() => {
              setVerifying(false);
              router.push('/Profile?tab=orders');
              clearCartState();
              clearCheckout();
            }, 0);
          })
          .catch((err) => {
            setVerifying(false);
            console.error('Payment Verification Failed:', err);
            alert('Payment verification failed.');
          });
      },
      prefill: {
        name: paymentData.customerName || '',
        email: paymentData.customerEmail || '',
        contact: paymentData.customerContact || '',
      },
      theme: { color: '#FFB729' },
    };

    new window.Razorpay(options).open();
  };

  const handleDialogCancel = () => setOpenDialog(false);
  const handleContinue = () => setOpenDialog(true);

  const handleCancelCheckout = async () => {
    try {
      if (orderId) {
        await cancelCheckout(orderId);
      }
      clearCheckout();
      router.push('/Cart');
    } catch (error) {
      console.error('Failed to cancel checkout:', error);
      clearCheckout();
      router.push('/Cart');
    }
  };

  if (verifying) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} sx={{ color: '#FFB729' }} />
        <Typography variant="h6" sx={{ mt: 2, color: '#311807' }}>
          Verifying Payment, Please wait...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <BreadCrum crumbs={crumbs} />

      {/* 🌟 Animated Offer Box */}
    <div className="flex justify-center items-center mt-5">
      <Box
        sx={{
          backgroundColor:"#96d358ff",
          color: 'var(--secondary)',
          borderRadius: '8px',
          textAlign: 'center',
          padding: '12px 16px',
          fontWeight: 600,
          fontFamily: 'Poppins',
          width: { xs: '90%', sm: '70%', md: '50%', lg: '30%' }, // ✅ responsive width
          animation: `${glowPulse} 2s ease-in-out infinite`,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, fontSize: { xs: '14px', sm: '16px' } }}
        >
          🎉 Exclusive offer — Get 10% OFF on orders above ₹100
        </Typography>
      </Box>
    </div>
     

      <Container sx={{ py: { xs: 3, sm: 5 } }}>
        <Typography
          variant="h1"
          fontSize={{ xs: '24px', sm: '28px', md: '32px' }}
          sx={{
            mb: { xs: 4, sm: 6 },
            fontWeight: 'bold',
            fontFamily: 'Poppins',
            color: '#311807',
            textAlign: 'center',
          }}
        >
          Checkout
        </Typography>

        {!accessToken ? (
          <Box className="text-center text-base sm:text-lg text-gray-600 py-10">
            Please login to checkout.
          </Box>
        ) : !orderId ? (
          <Box className="text-center text-base sm:text-lg text-gray-600 py-10">
            No active order found.
          </Box>
        ) : (
          checkoutStatus && (
            <>
              <OrderSummary
                CheckoutData={checkoutStatus}
                applyCoupon={applyCoupon}
                loading={loading}
                applyCouponError={applyCouponError}
                coupon={coupon}
                checkoutMessage={checkoutMessage}
                orderId={orderId}
                autoApplyCoupon={autoApplyCoupon}
                autoCouponData={autoCouponData}
                manualCouponApplied={manualCouponApplied}
                removeCoupon={removeCoupon}
                couponDetails={couponDetails}
              />

              <Stack
                direction={{ xs: 'column-reverse', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                sx={{ mt: 4, alignItems: { xs: 'stretch', sm: 'center' } }}
              >
                <Button
                  variant="outlined"
                  onClick={handleCancelCheckout}
                  disabled={loading}
                  sx={{
                    borderColor: 'var(--error)',
                    color: 'var(--secondary)',
                    fontWeight: 600,
                    px: { xs: 2, sm: 4 },
                    py: { xs: 1.5, sm: 1.5 },
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: 'var(--secondary)', color: 'white' },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {loading ? 'Cancelling...' : 'Cancel Checkout'}
                </Button>

                <Button
                  onClick={handleContinue}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--secondary)',
                    border: '2px solid var(--primary)',
                    fontWeight: 600,
                    px: { xs: 2, sm: 4 },
                    py: { xs: 1.5, sm: 1.5 },
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: 'white', color: 'var(--secondary)' },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Continue to Payment
                </Button>
              </Stack>

              <Dialog open={openDialog} onClose={handleDialogCancel} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontSize: { xs: 18, sm: 20 } }}>Terms & Conditions</DialogTitle>
                <DialogContent>
                  <Typography sx={{ fontSize: { xs: 14, sm: 16 } }}>
                    The purchased products will be available in downloads. If you cannot find them in your downloads, please report the issue via WhatsApp. Do not purchase the same products again. No refunds/exchange will be issued for any digital goods purchased.
                  </Typography>
                  <Typography sx={{ mt: 2, fontSize: { xs: 14, sm: 16 } }}>
                    మీరు కొనుగోలు చేసిన డిజైన్లు మీ డౌన్లోడ్స్ లో ఉంటాయి. మీకు డిజైన్ కనపడకుంటే దయచేసి మళ్లీ కొనవద్దు. వాట్సాప్ లో మమ్మల్ని సంప్రదించండి. కొనుగోలు చేసిన డిజైన్లకు రీఫండ్/మార్పులు చేయబడవు.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleDialogCancel} color="error" sx={{ fontSize: { xs: 12, sm: 14 } }}>
                    Cancel
                  </Button>
                  <Button onClick={handleDialogAgree} sx={{ backgroundColor: '#FFB729', color: '#311807', fontSize: { xs: 12, sm: 14 } }}>
                    Agree
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )
        )}
      </Container>
    </>
  );
};

export default Page;
