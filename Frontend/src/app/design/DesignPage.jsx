'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import useCategory from '@/hook/useCategory';
import { useCategoryStore } from '@/Store/categoryStore';
import CategoryTabs from './categoryTabs';
import DesignList from './DesginlIst';
import { useSearchParams, useRouter } from 'next/navigation';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { API_URL } from '@/Store/authStore';
import SortMenu from '@/components/SortMenu/SortMenu';
import RecentlyViewed from '@/components/RecentlyViewed';

// ✅ Memoized components for performance
const MemoizedCategoryTabs = React.memo(CategoryTabs);
const MemoizedDesignList = React.memo(DesignList);

function DesignPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const loaderRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters State
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [sortOption, setSortOption] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeType, setActiveType] = useState(searchParams.get('tab') || searchParams.get('type') || 'all');

  // ✅ New: Track which category is downloading
  const [downloadingCategoryId, setDownloadingCategoryId] = useState(null);

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

  const handleTypeChange = (type) => {
    setActiveType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', type);
    params.delete('type'); // Clean up old param
    router.push(`?${params.toString()}`);
    setPage(1);
    resetProducts();
  };

  // ✅ Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || isProductsLoading || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage(prev => prev + 1);
    }, { threshold: 1.0 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef, isProductsLoading, hasMore]);

  const currentCategoryName = useMemo(
    () => categories[activeTab]?.name || 'Designs',
    [categories, activeTab]
  );

  // ✅ PDF Download Function (per-category loading)
  const downloadCategoryPdf = async (id, categoryName) => {
    if (!id) {
      console.warn('No category selected for PDF download');
      enqueueSnackbar('No category selected!', { variant: 'warning' });
      return;
    }

    setDownloadingCategoryId(id); // ✅ set active downloading ID

    try {
      const res = await axios.get(`${API_URL}/api/categories/${id}/catalog/pdf`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      });

      const fileURL = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `${categoryName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);

      enqueueSnackbar('PDF downloaded successfully!', { variant: 'success' });
    } catch (err) {
      console.error('❌ Error downloading PDF:', err);
      enqueueSnackbar('Failed to download PDF!', { variant: 'error' });
    } finally {
      setDownloadingCategoryId(null); // ✅ reset loading only after done
    }
  };

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
            {/* Price Filter Section */}
            <div className="border border-[var(--primary)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
              <div className="bg-[var(--card-bg)] text-center py-3 font-bold border-b border-[var(--primary)]">
                <span className="gradient-text">{t('filters.price_range')}</span>
              </div>
              <div className="flex flex-col">
                {['100-200', '200-300', '300-500', '500+'].map((range) => {
                  const isActive = selectedPriceRanges.includes(range);
                  return (
                    <div
                      key={range}
                      onClick={() => handlePriceRangeChange(range)}
                      className={`flex items-center gap-3 px-4 py-3 text-[0.9rem] cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${isActive
                        ? 'bg-[var(--primary)] text-white font-semibold'
                        : 'text-black hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        readOnly
                        className="accent-[var(--secondary)] w-4 h-4 cursor-pointer"
                      />
                      <span>
                        {range === '500+' ? '₹500+' : `₹${range.replace('-', ' - ₹')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sort By Section */}
            <div className="border border-[var(--primary)] bg-[var(--card-bg)] rounded-lg p-4">
              <FormControl fullWidth size="small">
                <InputLabel>{t('filters.sort_by')}</InputLabel>
                <Select
                  value={
                    sortOption === 'options.price'
                      ? (sortOrder === 'asc' ? 'price_asc' : 'price_desc')
                      : sortOption === 'productModel'
                        ? (sortOrder === 'asc' ? 'name_asc' : 'name_desc')
                        : 'latest'
                  }
                  label={t('filters.sort_by')}
                  onChange={handleSortChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary)',
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
            </div>

            <div className="border border-[var(--primary)] bg-[var(--card-bg)] rounded-lg max-h-[150vh] overflow-y-auto">
              <div className="bg-[var(--card-bg)] text-center py-3 font-bold border-b border-[var(--primary)]">
                <span className="gradient-text">All Categories</span>
              </div>

              <MemoizedCategoryTabs
                categories={categoryNames}
                activeTab={activeTab}
                onChange={handleTabChange}
                isLoading={isCategoriesLoading}
              />
            </div>
          </aside>

          {/* ✅ Design List Section */}
          <section className="w-full md:w-3/4 bg-white/10 rounded-lg mt-4 md:mt-0">
            <SortMenu activeType={activeType} onTypeChange={handleTypeChange} />
            <div className="flex flex-row items-center justify-between mb-3 gap-3">
              <p className="text-sm text-[var(--text)]">
                Showing {products.data.length} of {products.pagination?.total || 0} designs
              </p>

              <Button
                title="Download pdf"
                onClick={() => downloadCategoryPdf(selectedCategoryId, currentCategoryName)}
                disabled={!selectedCategoryId || downloadingCategoryId === selectedCategoryId}

                sx={{
                  background: 'var(--secondary)',
                  color: 'var(--primary)',
                  borderRadius: 2,
                  px: 2,
                  minWidth: 140,
                  height: 38,
                  fontSize: "12px"
                }}
              >
                {downloadingCategoryId === selectedCategoryId ? (
                  <>
                    <CircularProgress size={20} sx={{ color: 'var(--primary)', mr: 1 }} />

                  </>
                ) : (
                  'Download PDF'
                )}
              </Button>
            </div>

            <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] mb-3">
              {currentCategoryName}
            </h2>

            <div className="w-full">
              {isProductsLoading && page === 1 ? (
                <ArrivalCardSkeleton count={6} columns="grid-cols-1 md:grid-cols-3" />
              ) : (
                <MemoizedDesignList
                  products={products.data}
                  isLoading={isProductsLoading}
                  error={categoryError}
                  hasMore={hasMore}
                  loaderRef={loaderRef}
                  showQuickView={true}
                />
              )}
            </div>
          </section>
        </div>

        {/* Recently Viewed Section */}
        <div className="mt-12">
          <RecentlyViewed />
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
