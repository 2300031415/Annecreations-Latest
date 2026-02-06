'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Tabs, Tab, Container, CircularProgress, Typography, Box, Button } from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import WishListCard from '@/components/WishListCard/WishListCard';
import useCategory from '@/hook/useCategory';
import useWishlistStore from '@/Store/wishlistStore';
import { useAuthStore } from '@/Store/authStore';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

const Wishlist = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { wishlist, loading } = useWishlistStore();
  const { categories } = useCategory();
  const { isAuthenticated } = useAuthStore();

  const tabsContainerRef = useRef(null);



  const [selectedItems, setSelectedItems] = useState([]);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const subcategories = useMemo(
    () => ['All', ...categories.map((cat) => cat.name)],
    [categories]
  );

  const handleChange = (_event, newValue) => setActiveTab(newValue);

  const filteredWishlist = useMemo(() => {
    if (!wishlist || wishlist.length === 0) return [];
    return wishlist;
  }, [wishlist]);

  // Handle selection
  const handleSelect = (id, isChecked) => {
    if (isChecked) {
      if (selectedItems.length >= 3) {
        enqueueSnackbar('You can compare a maximum of 3 products.', { variant: 'warning' });
        return;
      }
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  // Handle Compare Navigation
  const handleCompare = () => {
    if (selectedItems.length < 2) {
      enqueueSnackbar('Select at least 2 products to compare.', { variant: 'info' });
      return;
    }
    const idsParam = selectedItems.join(',');
    router.push(`/compare?ids=${idsParam}`);
  };

  // Scroll functions for mobile arrows
  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <Box textAlign="center" py={10}>
          <Typography variant="h6" mb={2}>
            Please log in to view your wishlist.
          </Typography>
          <Link href="/Auth/Login" passHref>
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                '&:hover': { backgroundColor: '#e6a521', color: 'var(--secondary)' },
              }}
            >
              Login
            </Button>
          </Link>
        </Box>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full py-10">
          <CircularProgress color="warning" />
        </div>
      );
    }

    if (!wishlist || wishlist.length === 0) {
      return <p className="text-center text-gray-500">Your wishlist is empty.</p>;
    }

    if (filteredWishlist.length > 0) {
      return filteredWishlist.map((item) => (
        <WishListCard
          key={item._id}
          item={item}
          isSelected={selectedItems.includes(item._id)}
          onSelect={handleSelect}
        />
      ));
    }

    return <p className="text-center text-gray-500">No items found in this category.</p>;
  };

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'WishList', href: '/WishList' },
        ]}
      />

      <Container className="my-10 relative">
        <h1 className="text-center text-3xl font-bold text-[var(--secondary)] mb-10">
          WishList
        </h1>

        {/* Compare Action Bar */}
        {selectedItems.length > 0 && (
          <div className="sticky top-20 z-40 mb-6 bg-[var(--secondary)] text-white p-4 rounded-lg shadow-lg flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedItems.length} selected
            </Typography>
            <Button
              variant="contained"
              onClick={handleCompare}
              disabled={selectedItems.length < 2}
              sx={{
                backgroundColor: 'var(--primary)',
                color: 'var(--secondary)',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#fff' },
                '&:disabled': { backgroundColor: 'gray', color: 'white' }
              }}
            >
              Compare ({selectedItems.length})
            </Button>
          </div>
        )}

        {/* Wishlist Content */}
        <div className="w-full bg-white/10 rounded-lg p-4 md:p-6 text-[var(--secondary)]">
          {renderContent()}
        </div>
      </Container>
    </>
  );
};

export default Wishlist;
