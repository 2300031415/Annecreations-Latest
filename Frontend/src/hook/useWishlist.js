import { useEffect } from 'react';
import useWishlistStore from '@/Store/wishlistStore';

const useWishlist = () => {
  const {
    wishlist,
    wishlistCount,
    loading,
    error,
    
    addToWishlist,
    removeFromWishlist,
  } = useWishlistStore();

  // Fetch wishlist when hook is used


  // Toggle wishlist (add/remove)
  const toggleWishlist = async (product) => {
    const productId = product._id;

    const exists = wishlist.some(
      (item) => item._id === productId,
    );

    if (exists) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(product);
    }
  };

  return {
    items: wishlist,        // matches API: data.products
    count: wishlistCount,   // matches API: data.count
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
   
  };
};

export default useWishlist;
