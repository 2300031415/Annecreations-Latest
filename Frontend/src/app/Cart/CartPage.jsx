'use client';
import React, { useEffect } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Card,
  Box,
  CircularProgress,
} from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import useCartStore from '@/Store/cartStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/Store/authStore';
import CartTable from './CartTable';
import PriceDetails from './Pricedetails';
import CartActions from './CartAction';

const CartPage = () => {
  const { cart, subtotal, cartCount, cartLoader } = useCartStore();
  const { accessToken } = useAuthStore();
  const router = useRouter();

  return (
    <>
      {/* ✅ SEO Meta Tags */}
      <Head>
        <title>Your Shopping Cart | Annecreatons</title>
        <meta
          name="description"
          content="Review your selected items, adjust quantities, and proceed to checkout on Annecreatons."
        />
        <meta
          name="keywords"
          content="shopping cart, online store, ecommerce, checkout"
        />
        <meta property="og:title" content="Your Shopping Cart | Annecreatons" />
        <meta
          property="og:description"
          content="Manage your cart items and checkout easily on Annecreatons."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/cart" />
        <meta
          property="og:image"
          content="https://yourdomain.com/images/cart-preview.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Your Shopping Cart | Annecreatons"
        />
        <meta
          name="twitter:description"
          content="Easily manage your cart and checkout securely on Annecreatons."
        />
        <meta
          name="twitter:image"
          content="https://yourdomain.com/images/cart-preview.jpg"
        />
      </Head>

      {/* Existing UI */}
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Shopping Cart' },
        ]}
      />

      <Container sx={{ py: 5 }}>
        <Typography
          variant="h1"
          fontSize="32px"
          sx={{
            mb: 6,
            fontWeight: 'bold',
            fontFamily: 'Poppins',
            color: '#311807',
            textAlign: 'center',
          }}
        >
          Shopping Cart
        </Typography>

        {!accessToken ? (
          <Box className="text-center text-lg text-gray-600 py-10">
            Please login to view your cart.
          </Box>
        ) : cartLoader ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary">
              Updating your cart...
            </Typography>
          </Box>
        ) : (
          <>
            <div className="flex flex-wrap justify-between gap-4">
              <CartTable items={cart} />
              <PriceDetails subtotal={subtotal} itemsCount={cartCount} />
            </div>

            <Box sx={{ paddingTop: 4, width: { xs: '100%', md: '70%' } }}>
              <CartActions onContinue={() => router.push('/')} />
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default CartPage;
