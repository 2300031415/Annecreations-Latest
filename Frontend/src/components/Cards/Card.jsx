'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  Box,
  IconButton,
  Typography,
  Rating,
} from '@mui/material';
import { FaHeart, FaRegHeart, FaEye } from 'react-icons/fa';
import { MdPictureAsPdf } from 'react-icons/md';
import LoginModal from './ActionModal';
import ProductPreviewModal from './productdetails';
import { useArrivalCardLogic } from './CardLogic';
import QuickViewModal from '../ProductCard/QuickViewModal';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ArrivalCard = ({ item, showQuickView = false }) => {
  const { t } = useTranslation();
  const {
    hover,
    setHover,
    loading,
    modalOpen,
    setModalOpen,
    previewOpen,
    setPreviewOpen,
    liked,
    handleToggleWishlist,
  } = useArrivalCardLogic(item);

  const [quickViewOpen, setQuickViewOpen] = React.useState(false);

  // Determine display price
  let displayPrice = "N/A";
  if (Array.isArray(item.options) && item.options.length > 0) {
    const validPrices = item.options
      .map(option => option?.price)
      .filter(price => typeof price === 'number' && !isNaN(price));
    if (validPrices.length > 0) {
      const minPrice = Math.min(...validPrices);
      if (minPrice > 0) {
        displayPrice = `₹${minPrice}`;
      } else {
        displayPrice = "Free";
      }
    }
  }

  return (
    <>
      <Card
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 2,
          borderRadius: 2,
          cursor: 'pointer',
          overflow: 'hidden',
          m: 1,
          backgroundColor: 'var(--primary)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-12px) scale(1.03)',
            boxShadow: 10,
          },
        }}
      >
        <Link href={`/product/${item.productModel}`} passHref>

          {/* Product Image */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '100%', // maintains square aspect ratio
              backgroundColor: 'black',
            }}
          >
            {item.image ? (
              <Image
                src={`${item.image.startsWith('http')
                  ? item.image
                  : `${process.env.NEXT_PUBLIC_API_URL}/${item.image}`
                  }`}
                alt={item.design || 'Product image'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                No Image Available
              </Box>
            )}

            {/* Hover Actions */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(0,0,0,0.4)',
                opacity: hover ? 1 : 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                zIndex: 2,
              }}
            >
              <Box className="flex m-2 flex-col items-end gap-2">
                {/* ❤️ Wishlist Button */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleToggleWishlist();
                  }}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'var(--primary)',
                    '&:hover': {
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--primary)',
                    },
                  }}
                >
                  {liked ? (
                    <FaHeart size={18} color="red" />
                  ) : (
                    <FaRegHeart size={18} />
                  )}
                </IconButton>

                {/* 👁️ Preview Button */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPreviewOpen(true);
                  }}
                  sx={{
                    backgroundColor: 'var(--primary)',
                    '&:hover': {
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--primary)',
                    },
                  }}
                >
                  <FaEye size={18} />
                </IconButton>

                {/* 📄 PDF Download Button */}
                {process.env.NEXT_PUBLIC_API_URL && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${item._id}/pdf`, '_blank');
                    }}
                    sx={{
                      backgroundColor: 'var(--primary)',
                      '&:hover': {
                        backgroundColor: 'var(--secondary)',
                        color: 'var(--primary)',
                      },
                    }}
                  >
                    <MdPictureAsPdf size={18} />
                  </IconButton>
                )}

                {/* ⚡ Quick View Button */}
                {showQuickView && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setQuickViewOpen(true);
                    }}
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: 'white',
                      color: 'var(--secondary)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      borderRadius: '20px',
                      '&:hover': {
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                      },
                    }}
                  >
                    {t('buttons.quick_view')}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Product Info */}
          <CardContent
            sx={{
              bgcolor: 'var(--primary)',
              p: '12px',
              '&:last-child': { pb: '12px' },
            }}
          >
            <Box display="flex" justifyContent="space-between" gap={1}>
              <Typography variant="body2" fontWeight={600} fontSize={16} noWrap>
                {item.productModel}
              </Typography>

              <Typography variant="body2" color="var(--secondary)" fontWeight={600}>
                {displayPrice}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <Rating
                value={item.averageRating || 0}
                readOnly
                precision={0.5}
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': { color: 'var(--secondary)' },
                  '& .MuiRating-iconEmpty': { color: 'transparent', stroke: 'var(--secondary)', strokeWidth: '1px' },
                }}
              />
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                ({item.reviewCount || 0})
              </Typography>
            </Box>
          </CardContent>
        </Link>

      </Card>

      {/* Modals */}
      <LoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ProductPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        product={item}
      />
      {showQuickView && (
        <QuickViewModal
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          item={item}
        />
      )}
    </>
  );
};

ArrivalCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    productModel: PropTypes.string,
    design: PropTypes.string,
    image: PropTypes.string,
    price: PropTypes.number,
    sku: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        option: PropTypes.shape({
          _id: PropTypes.string.isRequired,
        }),
        price: PropTypes.number,
      })
    ),
  }).isRequired,
};

export default ArrivalCard;
