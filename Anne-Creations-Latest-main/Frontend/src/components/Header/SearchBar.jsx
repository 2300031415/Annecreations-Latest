'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  InputBase,
  Paper,
  List,
  CircularProgress,
  ListItemButton,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Modal,
  Button,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { FiSearch } from 'react-icons/fi';
import { MdCameraAlt, MdCloudUpload, MdClose } from 'react-icons/md';
import { useSearchStore } from '@/Store/SearchStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_URL } from '@/Store/authStore';

const SearchWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.common.white, 0.95),
  border: '1px solid #e0e0e0', // Base border
  outline: 'none',
  borderRadius: '50px',
  padding: '12px 24px',
  width: '100%',
  maxWidth: 800,
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  backgroundColor: '#fff',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    borderColor: 'var(--primary)', // Hover color
  },
  '&:focus-within': {
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    borderColor: 'var(--primary)',
    borderWidth: '2px', // Thicker border on focus
    padding: '11px 23px', // Adjust padding to prevent layout shift with thicker border
    maxWidth: 850,
  },
}));

const SuggestionsList = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: 'calc(100% + 12px)',
  left: 0,
  right: 0,
  zIndex: 1000,
  maxHeight: 500,
  overflowY: 'auto',
  borderRadius: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  border: '1px solid rgba(0,0,0,0.08)',
  padding: '12px 0',
}));

const VisualSearchModal = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  backgroundColor: '#fff',
  borderRadius: '24px',
  boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
  padding: '32px',
  outline: 'none',
  textAlign: 'center',
}));

const SearchBar = ({ centered = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { matchingProducts, fetchMatchingProducts, visualSearch, loading, error } = useSearchStore();
  const router = useRouter();
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchMatchingProducts(searchTerm);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, fetchMatchingProducts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product) => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    router.push(`/product/${product.productModel}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || matchingProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchingProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex > -1) {
        handleSelect(matchingProducts[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Visual Search Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setIsModalOpen(false);
    await visualSearch(file);
    setShowSuggestions(true);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: centered ? 850 : 500,
        margin: centered ? '0 auto' : '0'
      }}
    >
      <SearchWrapper>
        <FiSearch style={{ marginRight: 15, color: 'var(--secondary)', fontSize: '1.4rem' }} />
        <InputBase
          placeholder="Search for amazing designs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--secondary)',
            '& input::placeholder': { opacity: 0.6 }
          }}
          inputProps={{ 'aria-label': 'search product' }}
        />

        <Box display="flex" alignItems="center" gap={1}>
          {loading && (
            <CircularProgress size={24} sx={{ color: 'var(--primary)' }} />
          )}

          <Tooltip title="Search by image">
            <IconButton
              onClick={() => setIsModalOpen(true)}
              sx={{
                color: 'var(--secondary)',
                '&:hover': { color: 'var(--primary)' }
              }}
            >
              <MdCameraAlt size={24} />
            </IconButton>
          </Tooltip>
        </Box>
      </SearchWrapper>

      {showSuggestions && (
        <SuggestionsList elevation={0}>
          {matchingProducts.length > 0 ? (
            <List disablePadding>
              <Typography variant="caption" sx={{ px: 3, py: 1.5, color: '#888', fontWeight: 800, letterSpacing: '1px', display: 'block' }}>
                {searchTerm ? 'SUGGESTED DESIGNS' : 'RELATED DESIGNS'}
              </Typography>

              {matchingProducts.map((product, index) => (
                <ListItemButton
                  key={product._id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(product);
                  }}
                  selected={index === selectedIndex}
                  sx={{
                    py: 2,
                    px: 3,
                    borderLeft: index === selectedIndex ? '6px solid var(--primary)' : '6px solid transparent',
                    bgcolor: index === selectedIndex ? 'rgba(0,0,0,0.03)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                  }}
                >
                  {/* Product Image */}
                  <Box sx={{
                    position: 'relative',
                    width: 60,
                    height: 60,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #f0f0f0',
                    mr: 3
                  }}>
                    {product.image ? (
                      <Image
                        src={`${API_URL}/${product.image}`}
                        alt={product.productModel || 'Product'}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiSearch color="#ddd" />
                      </Box>
                    )}
                  </Box>

                  {/* Product Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={700} noWrap sx={{ color: 'var(--secondary)' }}>
                      {product.productModel}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Typography variant="caption" sx={{ bgcolor: '#eee', color: '#666', px: 1, py: 0.4, borderRadius: '6px', fontWeight: 700 }}>
                        {product.categories?.[0]?.name || product.category || 'Design'}
                      </Typography>
                      {product.options?.[0]?.price > 0 && (
                        <Typography variant="body2" color="var(--primary)" fontWeight={800}>
                          ₹{product.options[0].price}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              ))}
            </List>
          ) : !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                No designs matches your search.
              </Typography>
            </Box>
          )}
          {error && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="error">{error}</Typography>
            </Box>
          )}
        </SuggestionsList>
      )}

      {/* Visual Search Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="visual-search-modal"
      >
        <VisualSearchModal>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={() => setIsModalOpen(false)}>
              <MdClose />
            </IconButton>
          </Box>
          <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: 'var(--secondary)' }}>
            Search by Image
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Search for similar embroidery designs by uploading or dragging an image here.
          </Typography>

          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: dragActive ? 'var(--primary)' : '#ccc',
              borderRadius: '20px',
              p: 6,
              mb: 4,
              bgcolor: dragActive ? 'rgba(var(--primary-rgb), 0.05)' : '#fcfcfc',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <MdCloudUpload size={64} style={{ color: dragActive ? 'var(--primary)' : '#bbb', marginBottom: '16px' }} />
            <Typography variant="body1" fontWeight={600}>
              {dragActive ? 'Drop it here!' : 'Drag & drop an image or click to upload'}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="image/*"
            />
          </Box>

          <Button
            variant="outlined"
            onClick={() => setIsModalOpen(false)}
            sx={{
              borderRadius: '50px',
              px: 4,
              color: 'var(--secondary)',
              borderColor: 'var(--secondary)',
              '&:hover': {
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              }
            }}
          >
            Cancel
          </Button>
        </VisualSearchModal>
      </Modal>
    </div>
  );
};

export default SearchBar;
