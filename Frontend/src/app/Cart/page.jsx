// 'use client';
// import React, { useEffect } from 'react';
// import {
//   Container,
//   Typography,
//   Card,
//   Box,
//   CircularProgress,
// } from '@mui/material';
// import BreadCrum from '@/components/BreadCrum/BreadCrum';
// import useCartStore from '@/Store/cartStore';
// import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/Store/authStore';
// import CartTable from './CartTable';
// import PriceDetails from './Pricedetails';
// import CartActions from './CartAction';

// const CartPage = () => {
//   const { cart,  subtotal, cartCount, cartLoader } = useCartStore();
//   const { accessToken } = useAuthStore();
//   const router = useRouter();


//   return (
//     <>
//       <BreadCrum
//         crumbs={[
//           { label: 'Home', href: '/' },
//           { label: 'Shopping Cart' },
//         ]}
//       />

//       <Container sx={{ py: 5 }}>
//         <Typography
//           variant="h1"
//           fontSize="32px"
//           sx={{
//             mb: 6,
//             fontWeight: 'bold',
//             fontFamily: 'Poppins',
//             color: '#311807',
//             textAlign: 'center',
//           }}
//         >
//           Shopping Cart
//         </Typography>

//         {!accessToken ? (
//           <Box className="text-center text-lg text-gray-600 py-10">
//             Please login to view your cart.
//           </Box>
//         ) : cartLoader ? (
//           // ✅ Loader shown while any cart action is running
//           <Box
//             sx={{
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//               minHeight: '300px',
//               flexDirection: 'column',
//               gap: 2,
//             }}
//           >
//             <CircularProgress color="primary" />
//             <Typography variant="body2" color="text.secondary">
//               Updating your cart...
//             </Typography>
//           </Box>
//         ) : (
//           <>
//             <div className="flex flex-wrap justify-between gap-4">
//               <CartTable items={cart} />
//               <PriceDetails subtotal={subtotal} itemsCount={cartCount} />
//             </div>

//             <Box
//               sx={{
//                 paddingTop: 4,
//                 width: { xs: '100%', md: '70%' },
//               }}
//             >
//               <CartActions onContinue={() => router.push('/')} />
//             </Box>
//           </>
//         )}
//       </Container>
//     </>
//   );
// };

// export default CartPage;
import CartPage from './CartPage';

export const metadata = {
  title: 'Your Shopping Cart | Annecreations',
  description: 'Review your selected items, adjust quantities, and proceed to checkout on Annecreatons.',
  keywords: ['shopping cart', 'online store', 'checkout', 'ecommerce'],
  openGraph: {
    title: 'Your Shopping Cart | Annecreatons',
    description: 'View and manage your cart items before checkout.',
    url: 'https://annecreationshb.com/Cart',
    siteName: 'Annecreations',
    // images: [
    //   {
    //     url: 'https://annecreationshb.com/images/cart-preview.jpg',
    //     width: 1200,
    //     height: 630,
    //     alt: 'Shopping Cart Preview',
    //   },
    // ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Shopping Cart | Annecreatons',
    description: 'Manage your cart items easily on Annecreatons.',
    // images: ['https://yourdomain.com/images/cart-preview.jpg'],
  },
};

export default function Page() {
  return <CartPage />;
}
