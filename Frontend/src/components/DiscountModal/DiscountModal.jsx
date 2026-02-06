'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { IoClose, IoGift, IoBag, IoCopy } from 'react-icons/io5';
// import { useSnackbar } from 'notistack';

const DiscountModal = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const couponCode = 'NEW';
  const discountPercentage = 10;

  useEffect(() => {
    // Check if modal was already shown in this session
    const modalShown = sessionStorage.getItem('discountModalShown');
    
    if (!modalShown) {
      // Show modal after 2 seconds delay
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('discountModalShown', 'true');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      // enqueueSnackbar('Coupon code copied to clipboard!', { variant: 'success' });
      alert('Coupon code copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // enqueueSnackbar('Failed to copy coupon code', { variant: 'error' });
      alert('Failed to copy coupon code');
    }
  };

  const handleShopNow = () => {
    setOpen(false);
    window.location.href = '/';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '3px solid var(--primary)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,1)',
            },
          }}
        >
          <IoClose size={24} />
        </IconButton>

        <Card
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            boxShadow: 'none',
            borderRadius: 0,
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <IoGift
                size={80}
                style={{
                  color: 'var(--primary)',
                  marginBottom: '16px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  color: 'var(--secondary)',
                  mb: 1,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  background: 'linear-gradient(45deg, var(--secondary) 30%, var(--primary) 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Special Offer!
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  mb: 2,
                }}
              >
                Get {discountPercentage}% OFF
              </Typography>
            </Box>

            {/* Coupon Code Section */}
            <Box
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, var(--primary) 0%, #FFC947 100%)',
                border: '2px solid var(--primary)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Use this coupon code:
              </Typography>
              
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Chip
                  label={couponCode}
                  sx={{
                    backgroundColor: 'white',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    px: 2,
                    py: 1,
                    height: 'auto',
                    '& .MuiChip-label': {
                      px: 2,
                    },
                  }}
                />
                <IconButton
                  onClick={handleCopyCode}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  <IoCopy size={20} />
                </IconButton>
              </Box>

              {copied && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    mt: 1,
                    display: 'block',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  ✓ Copied to clipboard!
                </Typography>
              )}
            </Box>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                mb: 4,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Welcome to Anne Creations! Get {discountPercentage}% off on your order. 
              Use the coupon code <strong>{couponCode}</strong> at checkout to claim your discount.
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  minWidth: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                  },
                }}
              >
                Maybe Later
              </Button>
              
              <Button
                variant="contained"
                startIcon={<IoBag size={20} />}
                onClick={handleShopNow}
                sx={{
                  background: 'linear-gradient(45deg, var(--primary) 30%, #FFC947 90%)',
                  color: 'white',
                  fontWeight: 700,
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  minWidth: { xs: '100%', sm: 'auto' },
                  boxShadow: '0 4px 15px rgba(255, 183, 41, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(255, 183, 41, 0.4)',
                  },
                }}
              >
                Shop Now
              </Button>
            </Box>

            {/* Footer */}
            <Typography
              variant="caption"
              sx={{
                color: '#999',
                mt: 3,
                display: 'block',
                fontSize: '0.8rem',
              }}
            >
             
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Dialog>
  );
};

export default DiscountModal;
