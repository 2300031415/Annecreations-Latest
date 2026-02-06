'use client';

import React, { useState } from 'react';
import {
  TableCell,
  TableRow,
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from '@mui/material';
import Image from 'next/image';
import PropTypes from 'prop-types';
import useCartStore from '@/Store/cartStore';
import { API_URL } from '@/Store/authStore';
import { useRouter } from 'next/navigation';
import useWishlist from '@/hook/useWishlist';

const CartItemRow = ({ item, checkout = false }) => {
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const router = useRouter();
  const { addToWishlist } = useWishlist();
  const [openModal, setOpenModal] = useState(false);

  const isMobile = useMediaQuery('(max-width:640px)');

  const goToProductPage = () => {
    if (item.product?._id) router.push(`/product/${item.product.productModel}`);
  };

  const optionsTotal = Array.isArray(item.options)
    ? item.options.reduce((sum, opt) => sum + (opt.price || 0), 0)
    : 0;

  const itemPrice = (item.price || 0) + optionsTotal;

  const handleRemove = () => {
    removeFromCart(item.product._id);
    setOpenModal(false);
  };

  const handleAddToWishlist = () => {
    addToWishlist(item.product);
    setOpenModal(false);
  };

  return (
    <>
      {/* ------------------------
          MOBILE: card layout
        ------------------------ */}
      {isMobile ? (
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          p={1}
          mb={1.5}
          border="1px solid var(--primary)"
          borderRadius={2}
          sx={{ flexDirection: 'row' }}
        >
          {/* Image */}
          <Box
            onClick={goToProductPage}
            sx={{
              cursor: 'pointer',
              width: 90,
              height: 90,
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {item.product?.image ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/${item.product.image}`}
                alt={item.product.productModel || 'Product'}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <Box
                width="100%"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="#f5f5f5"
              >
                <Typography variant="caption" color="textSecondary">
                  No image
                </Typography>
              </Box>
            )}
          </Box>

          {/* Info */}
          <Box flex={1} textAlign="left">
            <Typography
              variant="body2"
              fontWeight="bold"
              color="secondary"
              onClick={goToProductPage}
              sx={{ cursor: 'pointer' }}
            >
              {item.product?.productModel || 'Unknown Product'}
            </Typography>

            {Array.isArray(item.options) &&
              item.options.map((opt, index) => (
                <Typography
                  key={opt.option?._id || index}
                  variant="caption"
                  display="block"
                >
                  {opt.option?.name || 'Option'} - ₹{opt.price || 0}
                </Typography>
              ))}

            <Typography variant="body2" fontWeight={600} mt={0.5}>
              ₹{itemPrice.toFixed(2)}
            </Typography>

            {!checkout && (
              <Button
                onClick={() => setOpenModal(true)}
                variant="outlined"
                size="small"
                sx={{
                  mt: 0.5,
                  py: 0.3,
                  px: 2,
                  fontWeight: 600,
                  fontSize: 11,
                  color: '#311807',
                  borderColor: 'var(--primary)',
                  '&:hover': { backgroundColor: 'var(--primary)', color: '#fff' },
                }}
              >
                Remove
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        /* ------------------------
           DESKTOP: table row layout
         ------------------------ */
        <TableRow>
          <TableCell sx={{ width: 250, padding: '16px' }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ cursor: 'pointer' }}
              onClick={goToProductPage}
            >
              {item.product?.image ? (
                <Image
                  src={`${API_URL}/${item.product.image}`}
                  alt={item.product.productModel || 'Product image'}
                  width={250}
                  height={250}
                  style={{ objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <Box
                  width={150}
                  height={150}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="#f0f0f0"
                  borderRadius="8px"
                >
                  <Typography variant="caption" color="textSecondary">
                    No image
                  </Typography>
                </Box>
              )}
            </Box>
          </TableCell>

          <TableCell sx={{ verticalAlign: 'top', padding: '16px' }}>
            <Typography
              variant="body1"
              fontWeight="bold"
              color="secondary"
              sx={{ cursor: 'pointer' }}
              onClick={goToProductPage}
            >
              {item.product?.productModel || 'Unknown Product'}
            </Typography>

            {Array.isArray(item.options) && item.options.length > 0 && (
              <Box mt={1}>
                {item.options.map((opt, index) => (
                  <Typography key={opt.option?._id || index} variant="body2">
                    {opt.option?.name || 'Option'} - ₹{opt.price || 0}
                  </Typography>
                ))}
              </Box>
            )}

            {!checkout && (
              <Button
                onClick={() => setOpenModal(true)}
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  px: 2,
                  py: 0.5,
                  borderColor: 'var(--primary)',
                  color: '#311807',
                  fontWeight: 600,
                  width: '50%',
                  fontSize: 14,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'var(--primary)', color: '#fff' },
                }}
              >
                Remove
              </Button>
            )}
          </TableCell>

          <TableCell sx={{ verticalAlign: 'top', fontWeight: 600 }}>
            ₹{itemPrice.toFixed(2)}
          </TableCell>
        </TableRow>
      )}

      {/* ------------------------
          Shared Confirmation Modal
        ------------------------ */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove Item?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Do you want to remove{' '}
            <strong>
              {item.product.productModel}
            </strong>{' '}
            from the cart?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ flexDirection: 'row', gap: 1, px: 2, pb: 2 }}
        >
          <Button
            variant="outlined"
            onClick={handleAddToWishlist}
            fullWidth
            sx={{
              color: '#FFB729',
              fontWeight: 600,
              border: '2px solid var(--primary)',
              fontSize: 12,
              '&:hover': { backgroundColor: '#FFB729', color: 'white' },
            }}
          >
            Add to Wishlist
          </Button>
          <Box display="flex" gap={1} flexDirection="row" width="100%">
            <Button
              fullWidth
              onClick={() => setOpenModal(false)}
              sx={{ fontSize: 12 }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={handleRemove}
              sx={{ fontSize: 12 }}
            >
              Remove
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

CartItemRow.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    productModel: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    subtotal: PropTypes.number,
    product: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      image: PropTypes.string,
      description: PropTypes.string,
      productModel: PropTypes.string,
    }),
    options: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        option: PropTypes.shape({
          _id: PropTypes.string,
          name: PropTypes.string,
        }),
        price: PropTypes.number,
      })
    ),
  }).isRequired,
  checkout: PropTypes.bool,
};

export default CartItemRow;
