'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '@/Store/authStore';
import useWishlist from '@/hook/useWishlist';

export const useArrivalCardLogic = (item) => {
  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;
  const { items: wishlist, toggleWishlist, error } = useWishlist();

  // Only mark as liked if authenticated
  const liked = useMemo(() => {
    return isAuthenticated && wishlist?.some((p) => p._id === item._id);
  }, [wishlist, item, isAuthenticated]);

  useEffect(() => {
    if (error) enqueueSnackbar(error, { variant: 'error' });
  }, [error, enqueueSnackbar]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      setModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await toggleWishlist({
        _id: item._id,
        productModel: item.productModel,
        sku: item.sku,
        image: item.image,
        price: item.price,
      });

      enqueueSnackbar(liked ? 'Removed from wishlist!' : 'Added to wishlist!', {
        variant: liked ? 'warning' : 'success',
      });
    } catch {
      enqueueSnackbar('Failed to update wishlist', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return {
    hover,
    setHover,
    loading,
    modalOpen,
    setModalOpen,
    previewOpen,
    setPreviewOpen,
    liked,
    handleToggleWishlist,
    isAuthenticated,
    accessToken,
  };
};
