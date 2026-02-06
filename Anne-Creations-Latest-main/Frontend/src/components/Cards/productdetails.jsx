'use client';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Box, IconButton } from '@mui/material';
import { LuX } from 'react-icons/lu';
import ProductCard from '../ProductCard/ProductCard';
import ReviewSection from '../ReviewSection/ReviewSection';
import { Divider } from '@mui/material';

const ProductPreviewModal = ({ open, onClose, product }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: 800, lg: 1000 }, // responsive width
          maxHeight: '90vh', // prevent overflow
          overflowY: 'auto',  // scroll if content too tall
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: { xs: 2, md: 4 }, // padding
        }}
      >
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={onClose}>
            <LuX size={24} />
          </IconButton>
        </Box>
        <Box mt={1}>
          <ProductCard item={product} />
        </Box>
        <Box mt={6}>
          <Divider sx={{ mb: 4 }} />
          <ReviewSection productId={product._id} />
        </Box>
      </Box>
    </Modal>
  );
};

ProductPreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    model: PropTypes.string,
    design: PropTypes.string,
    image: PropTypes.string,
    price: PropTypes.number,
    manufacturer_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

export default ProductPreviewModal;
