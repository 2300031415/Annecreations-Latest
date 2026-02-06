'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Select, MenuItem, FormControl, Box, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import useCategory from '@/hook/useCategory';
import { useCategoryStore } from '@/Store/categoryStore';
import CategoryTabs from './categoryTabs';
import DesignList from './DesginlIst';
import { useSearchParams, useRouter } from 'next/navigation';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import { useSnackbar } from 'notistack';

// ✅ Memoized components for performance
const MemoizedCategoryTabs = React.memo(CategoryTabs);
const MemoizedDesignList = React.memo(DesignList);

function DesignPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters State
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [sortOption, setSortOption] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeType, setActiveType] = useState(searchParams.get('tab') || searchParams.get('type') || 'all');

  const categoryFromUrl = searchParams.get('category');

  const { categories, isCategoriesLoading, error: categoryError } = useCategory();
  const { products, fetchCategoryProducts, isProductsLoading, resetProducts } = useCategoryStore();

  // ✅ Memoize category names
  const categoryNames = useMemo(() => categories.map(cat => cat.name), [categories]);

  // ✅ Sync tab from URL
  useEffect(() => {
    if (!categories.length) return;

    const foundIndex = categories.findIndex(cat => cat.name === categoryFromUrl);
    const indexToUse = foundIndex >= 0 ? foundIndex : 0;

    if (indexToUse !== activeTab) {
      setActiveTab(indexToUse);
      setPage(1);
      setHasMore(true);
      resetProducts();
    }
  }, [categories, categoryFromUrl]);

  // ✅ Get selected category ID
  const selectedCategoryId = useMemo(
    () => categories[activeTab]?._id || null,
    [categories, activeTab]
  );

  // ✅ Fetch products
  useEffect(() => {
    if (!selectedCategoryId) return;
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const filters = {
          priceRanges: selectedPriceRanges,
          order: sortOrder,
          tab: activeType
        };

        const res = await fetchCategoryProducts(selectedCategoryId, page, sortOption, filters);
        if (!cancelled) {
          setHasMore(page < res.pagination.pages);
        }
      } catch {
        if (!cancelled) setHasMore(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, page, selectedPriceRanges, sortOption, sortOrder, activeType]);

  const handlePriceRangeChange = (range) => {
    setSelectedPriceRanges(prev => {
      if (prev.includes(range)) {
        return prev.filter(r => r !== range);
      } else {
        return [...prev, range];
      }
    });
    setPage(1);
    resetProducts();
  };


  // ✅ Handle tab change
  const handleTabChange = useCallback((index) => {
    if (index === activeTab) return;
    setActiveTab(index);
    setPage(1);
    setHasMore(true);
    resetProducts();
  }, [activeTab, resetProducts]);

  const currentCategoryName = useMemo(
    () => categories[activeTab]?.name || 'Designs',
    [categories, activeTab]
  );


  const handleSortChange = (event) => {
    const value = event.target.value;
    if (value === 'price_asc') {
      setSortOption('options.price');
      setSortOrder('asc');
    } else if (value === 'price_desc') {
      setSortOption('options.price');
      setSortOrder('desc');
    } else if (value === 'name_asc') {
      setSortOption('productModel');
      setSortOrder('asc');
    } else if (value === 'name_desc') {
      setSortOption('productModel');
      setSortOrder('desc');
    } else {
      setSortOption('createdAt');
      setSortOrder('desc');
    }
    setPage(1);
    resetProducts();
  };

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Category', href: '/Category' },
          { label: currentCategoryName },
        ]}
      />

      <div className="w-full px-4 md:px-6 my-[20px]">
        <div className="flex flex-col md:flex-row gap-6">
          {/* ✅ Category Sidebar */}
          <aside className="w-full md:w-1/4 flex flex-col gap-4">
            {/* Filters Section */}

            {/* Sort By Section - Moved to top to match some patterns, or just styled */}
            <Box sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              bgcolor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
                {t('filters.sort_by', 'Sort By')}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={
                    sortOption === 'options.price'
                      ? (sortOrder === 'asc' ? 'price_asc' : 'price_desc')
                      : sortOption === 'productModel'
                        ? (sortOrder === 'asc' ? 'name_asc' : 'name_desc')
                        : 'latest'
                  }
                  onChange={handleSortChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary)',
                    }
                  }}
                >
                  <MenuItem value="latest">Latest</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="name_asc">Alphabetical: A to Z</MenuItem>
                  <MenuItem value="name_desc">Alphabetical: Z to A</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Price Filter Section */}
            <Box sx={{
              mb: 0,
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              bgcolor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
                {t('filters.price_range')}
              </Typography>
              <FormGroup>
                {['100-200', '200-300', '300-500', '500+'].map((range) => {
                  const isActive = selectedPriceRanges.includes(range);
                  return (
                    <FormControlLabel
                      key={range}
                      control={
                        <Checkbox
                          checked={isActive}
                          onChange={() => handlePriceRangeChange(range)}
                          size="small"
                          sx={{ color: 'var(--secondary)', '&.Mui-checked': { color: 'var(--primary)' } }}
                        />
                      }
                      label={<Typography variant="body2" fontWeight={500}>{range === '500+' ? '₹500+' : `₹${range.replace('-', ' - ₹')}`}</Typography>}
                    />
                  );
                })}
              </FormGroup>
            </Box>

            {/* Categories Section */}
            <Box sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              bgcolor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
                All Categories
              </Typography>

              <MemoizedCategoryTabs
                categories={categoryNames}
                activeTab={activeTab}
                onChange={handleTabChange}
                isLoading={isCategoriesLoading}
              />
            </Box>
          </aside>

          {/* ✅ Design List Section */}
          <section className="w-full md:w-3/4 bg-white/10 rounded-lg mt-4 md:mt-0">

            <div className="flex flex-row items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                {currentCategoryName}
              </h2>
              <p className="text-sm font-semibold text-gray-500">
                Total: {products.pagination?.total || 0} designs | Showing {products.data.length} of {products.pagination?.total || 0}
              </p>
            </div>

            <div className="w-full">
              {isProductsLoading && page === 1 ? (
                <ArrivalCardSkeleton count={6} columns="grid-cols-1 md:grid-cols-3" />
              ) : (
                <>
                  <MemoizedDesignList
                    products={products.data}
                    isLoading={isProductsLoading}
                    error={categoryError}
                    hasMore={hasMore}
                    showQuickView={true}
                  />

                  {/* Show More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={isProductsLoading}
                        className="px-8 py-3 bg-[var(--anne-gold)] text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {isProductsLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} sx={{ color: 'white' }} />
                            Loading...
                          </Box>
                        ) : (
                          `Show More (${(products.pagination?.total || 0) - products.data.length} more)`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <DesignPageContent />
    </Suspense>
  );
}
