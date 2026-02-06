'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import useCartStore from '@/Store/cartStore';
import useWishlistStore from '@/Store/wishlistStore';
import { useAuthStore, API_URL } from '@/Store/authStore';

export const useProductCardStore = (item) => {
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [addonError, setAddonError] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  const accessToken = useAuthStore((state) => state.accessToken);
  const addToCart = useCartStore((state) => state.addToCart);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const wishlist = useWishlistStore((state) => state.wishlist || []);

  const alreadyInWishlist =
    Array.isArray(wishlist) && wishlist.some((w) => w._id === item._id);

  // ✅ Resume action after login
  useEffect(() => {
    if (accessToken && pendingAction) {
      if (pendingAction === 'cart') addItemToCart(true);
      if (pendingAction === 'wishlist') addItemToWishlist(true);
      setPendingAction(null);
      setModalOpen(false);
    }
  }, [accessToken, pendingAction]);

  // ✅ Share design link
  const handleShare = (text) => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Check out this design',
          text,
          url: `${window.location.origin}/product/${item.productModel}`,
        })
        .catch((err) => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => enqueueSnackbar('Link copied to clipboard!', { variant: 'success' }))
        .catch(() => enqueueSnackbar('Failed to copy link', { variant: 'error' }));
    }
  };

  const handleAddonChange = (optionId, checked) => {
    setAddonError(false);
    setSelectedAddons((prev) =>
      checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
    );
  };

  // ✅ Add to cart
  const addItemToCart = useCallback((afterLogin = false) => {
    const hasOptions = Array.isArray(item.options) && item.options.length > 0;

    if (!accessToken && !afterLogin) {
      setPendingAction('cart');
      setModalOpen(true);
      enqueueSnackbar('Please login to add items to cart', { variant: 'warning' });
      return;
    }

    if (hasOptions && selectedAddons.length === 0) {
      setAddonError(true);
      enqueueSnackbar('Please select at least one addon', { variant: 'warning' });
      return;
    }

    const selectedOptions = item.options.filter((opt) =>
      selectedAddons.includes(opt._id)
    );

    addToCart({ productId: item._id, options: selectedOptions });
    enqueueSnackbar('Item added to cart!', { variant: 'success' });
    setSelectedAddons([]);
  }, [accessToken, selectedAddons, item, addToCart, enqueueSnackbar]);

  // ✅ Add to wishlist
  const addItemToWishlist = useCallback((afterLogin = false) => {
    if (!accessToken && !afterLogin) {
      setPendingAction('wishlist');
      setModalOpen(true);
      enqueueSnackbar('Please login to add items to wishlist', { variant: 'warning' });
      return;
    }

    if (!item?._id) {
      enqueueSnackbar('Product ID missing', { variant: 'error' });
      return;
    }

    addToWishlist(item);
    enqueueSnackbar('Added to wishlist!', { variant: 'success' });
  }, [accessToken, item, addToWishlist, enqueueSnackbar]);

  return {
    selectedAddons,
    setSelectedAddons,
    modalOpen,
    setModalOpen,
    pendingAction,
    setPendingAction,
    addonError,
    setAddonError,
    open,
    setOpen,
    containerRef,
    handleShare,
    handleAddonChange,
    addItemToCart,
    addItemToWishlist,
    alreadyInWishlist,
    API_URL,
  };
};
