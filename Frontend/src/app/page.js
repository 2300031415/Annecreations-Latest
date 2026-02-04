'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdExpandMore, MdTune, MdBrush, MdHistory } from 'react-icons/md';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';

import Banner from '../components/Banner/Banner';
import AnnouncementStrip from '../components/AnnouncementStrip/AnnouncementStrip';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import CategoryCard from '@/components/categoryCard/CategeroyCard';
import Loading from '@/components/categoryCard/Loading';

import SearchBar from '@/components/Header/SearchBar';
import RecentlyViewedSidebar from '@/components/RecentlyViewedSidebar';

import { useProductStore } from '@/Store/productStore';
import { useAuthStore } from '@/Store/authStore';
import useWishlistStore from '@/Store/wishlistStore';
import useCartStore from '@/Store/cartStore';
import useCategory from '@/hook/useCategory';

export const whatsappUrl = 'https://wa.me/919951916767?text=Hello%20Annecreations';

const StyledTabs = styled(Tabs)({
  borderBottom: 'none',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  marginRight: theme.spacing(1),
  color: 'var(--secondary)',
  borderRadius: '50px',
  padding: '10px 24px',
  minHeight: 'auto',
  transition: 'all 0.3s ease',
  backgroundColor: '#f8f9fa',
  '&.Mui-selected': {
    color: 'var(--primary)',
    backgroundColor: 'var(--secondary)',
  },
  '&:hover': {
    backgroundColor: '#e9ecef',
  },
}));

const CustomDesignOptions = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: 'var(--secondary)' }}>
        {t('custom_design.title', 'Custom Design Services')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
        {t('custom_design.subtitle', 'Bring your creative ideas to life. Request a new custom design or track the status of your existing requests.')}
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* New Request Option */}
        <Link href="/my-style-requests" className="group">
          <Box sx={{
            p: 4,
            height: '100%',
            bgcolor: 'white',
            borderRadius: 4,
            border: '1px solid #eee',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              borderColor: 'var(--primary)',
            }
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(233, 177, 96, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              color: 'var(--primary)',
              transition: 'all 0.3s ease',
              '.group-hover &': {
                bgcolor: 'var(--primary)',
                color: 'white'
              }
            }}>
              <MdBrush size={40} />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              {t('custom_design.new_request', 'New Design Request')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('custom_design.new_request_desc', 'Submit a new idea, upload reference images, and get a quote for your custom embroidery design.')}
            </Typography>
          </Box>
        </Link>

        {/* View Requests Option */}
        <Link href="/Profile?tab=requests" className="group">
          <Box sx={{
            p: 4,
            height: '100%',
            bgcolor: 'white',
            borderRadius: 4,
            border: '1px solid #eee',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              borderColor: 'var(--primary)',
            }
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(49, 24, 7, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              color: 'var(--secondary)',
              transition: 'all 0.3s ease',
              '.group-hover &': {
                bgcolor: 'var(--secondary)',
                color: 'white'
              }
            }}>
              <MdHistory size={40} />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              {t('custom_design.view_requests', 'View My Requests')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('custom_design.view_requests_desc', 'Check the status of your submitted requests, view quotes, and download completed designs.')}
            </Typography>
          </Box>
        </Link>
      </div>
    </Box>
  );
};

const PRODUCTS_PER_PAGE = 8;

const Page = () => {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const {
    products,
    fetchProducts,
    fetchProductsByFilter,
    isProductsLoading,
    error,
  } = useProductStore();

  const { isAuthenticated } = useAuthStore();
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const getCartItem = useCartStore((state) => state.getCartItem);
  const { categories } = useCategory();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(PRODUCTS_PER_PAGE);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isResizing = useRef(false);
  const sidebarRef = useRef(null);

  // Resizer Logic
  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
  }, []);

  const resize = React.useCallback((mouseMoveEvent) => {
    if (isResizing.current && sidebarRef.current) {
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      let newWidth = mouseMoveEvent.clientX - sidebarLeft;

      // Constraint clamping
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;

      setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Sync activeTab with URL param
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const priceRanges = useMemo(() => [
    { label: '₹0 - ₹100', value: '0-100', min: 0, max: 100 },
    { label: '₹100 - ₹500', value: '100-500', min: 100, max: 500 },
    { label: '₹500 - ₹1000', value: '500-1000', min: 500, max: 1000 },
    { label: '₹1000+', value: '1000+', min: 1000, max: Infinity },
  ], []);

  const categoryTabs = useMemo(() => [
    { id: 1, label: t('tabs.all', 'All'), value: 'all' },
    { id: 2, label: 'Our Designs', value: 'our_designs' },
    { id: 3, label: t('tabs.todays_deals', "Today's Deals"), value: 'deals' },
    { id: 4, label: t('tabs.new_releases', 'New Arrivals'), value: 'new' },
    { id: 5, label: t('tabs.best_selling', 'Best Sellers'), value: 'best' },
    { id: 6, label: t('tabs.free_designs', 'Free Designs'), value: 'free' },
    { id: 7, label: t('nav.custom_design', 'Custom Design'), value: 'custom' },
  ], [t]);

  useEffect(() => {
    if (isAuthenticated) {
      getCartItem();
      getWishlist();
    }
  }, [isAuthenticated, getCartItem, getWishlist]);

  // Fetch products based on active tab
  useEffect(() => {
    if (activeTab === 'custom' || activeTab === 'our_designs') {
      // Don't fetch products for custom and our_designs tabs
      return;
    }

    setVisibleCount(PRODUCTS_PER_PAGE);

    // Map internal tab values to API tab values if they differ
    let apiTab = activeTab;
    if (activeTab === 'deals') apiTab = 'todays-deals';
    if (activeTab === 'our_designs') apiTab = 'all';

    if (activeTab === 'all' || activeTab === 'our_designs') {
      fetchProducts(5000);
    } else {
      fetchProductsByFilter?.(apiTab, 5000) || fetchProducts(5000);
    }
  }, [activeTab, fetchProducts, fetchProductsByFilter]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    router.push(`/?tab=${newValue}`, { scroll: false });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handlePriceChange = (value) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategories.length === 0 ||
        p.categories?.some(c => selectedCategories.includes(c._id || c));

      const price = p.options?.[0]?.price || 0;
      const matchPrice = selectedPriceRanges.length === 0 || selectedPriceRanges.some(rangeValue => {
        const range = priceRanges.find(r => r.value === rangeValue);
        return price >= range.min && price <= range.max;
      });

      return matchCategory && matchPrice;
    });
  }, [products, selectedCategories, selectedPriceRanges, priceRanges]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;
  const remainingProducts = filteredProducts.length - visibleCount;

  const handleShowMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  const filteredCategories = useMemo(() => categories?.filter(c => c.name !== 'All') || [], [categories]);
  const visibleCategories = filteredCategories.slice(0, visibleCategoryCount);
  const hasMoreCategories = visibleCategoryCount < filteredCategories.length;
  const remainingCategories = filteredCategories.length - visibleCategoryCount;

  const handleShowMoreCategories = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCategoryCount((prev) => prev + PRODUCTS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  const FilterContent = ({ mobile = false }) => (
    <Box sx={{
      p: mobile ? 3 : 0,
      border: mobile ? 'none' : 'none',
    }}>
      {mobile && (
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          {t('filters.title', 'Filters')}
        </Typography>
      )}

      {/* Price Filter Block */}
      <Box sx={{
        mb: 3,
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 3,
        bgcolor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
          {t('filters.price_range', 'Price')}
        </Typography>
        <FormGroup>
          {priceRanges.map((range) => (
            <FormControlLabel
              key={range.value}
              control={
                <Checkbox
                  checked={selectedPriceRanges.includes(range.value)}
                  onChange={() => handlePriceChange(range.value)}
                  size="small"
                  sx={{ color: 'var(--secondary)', '&.Mui-checked': { color: 'var(--primary)' } }}
                />
              }
              label={<Typography variant="body2" fontWeight={500}>{range.label}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      {/* Categories Filter Block - Scrollable */}
      <Box sx={{
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 3,
        bgcolor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
          {t('filters.categories', 'Categories')}
        </Typography>
        <Box sx={{
          height: 300,
          minHeight: 150,
          maxHeight: '60vh',
          overflowY: 'auto',
          resize: 'vertical',
          pr: 1,
          pb: 1, // Padding for resize handle
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: '4px' }
        }}>
          <FormGroup>
            {categories?.filter(cat => cat.name !== 'All').map((cat) => (
              <FormControlLabel
                key={cat._id}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => handleCategoryChange(cat._id)}
                    size="small"
                    sx={{ color: 'var(--secondary)', '&.Mui-checked': { color: 'var(--primary)' } }}
                  />
                }
                label={<Typography variant="body2" fontWeight={500}>{cat.name}</Typography>}
              />
            ))}
          </FormGroup>
        </Box>
      </Box>

      {/* Recently Viewed in Sidebar - Moved Outside and Below Categories */}
      <RecentlyViewedSidebar />

    </Box>
  );

  return (
    <>
      <Banner />
      <AnnouncementStrip />

      {/* Big Search Bar Area */}
      <Box sx={{ py: 4, bgcolor: '#fff', position: 'relative', zIndex: 10 }}>
        <Container maxWidth="md">
          <SearchBar centered={true} />
        </Container>
      </Box>

      {/* Tab Icons Area */}
      <Box sx={{ bgcolor: 'white', pb: 2 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {categoryTabs.map((tab) => (
                <StyledTab
                  key={tab.id}
                  label={tab.label}
                  value={tab.value}
                />
              ))}
            </StyledTabs>
          </Box>
        </Container>
      </Box>

      {/* Main Content with Filter Sidebar */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {activeTab !== 'custom' && (
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[var(--primary)] text-[var(--secondary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-all"
            >
              <MdTune size={20} />
              {t('filters.title', 'Filters')}
            </button>
          </Box>
        )}

        {/* Desktop Sidebar Toggle (Open) */}
        {!isSidebarOpen && activeTab !== 'custom' && (
          <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', left: 20, top: '50%', zIndex: 99 }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-[var(--primary)] text-white rounded-r-lg shadow-lg hover:bg-[var(--secondary)] transition-all"
            >
              <MdTune size={24} />
            </button>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar - Desktop (Hidden on Custom Design tab) */}
          {isSidebarOpen && activeTab !== 'custom' && (
            <Box
              ref={sidebarRef}
              sx={{
                width: sidebarWidth,
                flexShrink: 0,
                display: { xs: 'none', md: 'block' },
                position: 'relative',
                pr: 2,
                transition: isResizing.current ? 'none' : 'width 0.1s ease',
              }}
            >
              {/* Resizer Handle */}
              <Box
                onMouseDown={startResizing}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0, // Align exactly to the right edge
                  width: '12px', // Slightly narrower but still clickable
                  height: '100%',
                  cursor: 'col-resize',
                  zIndex: 50,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: 'translateX(50%)', // Center it on the border line
                  '&:hover': {
                    '.resize-line': {
                      height: '100%',
                      opacity: 1
                    }
                  },
                }}
              >
                {/* Visible Line - Always visible now */}
                <Box
                  className="resize-line"
                  sx={{
                    width: '4px',
                    height: '40px', // Small handler by default
                    bgcolor: 'var(--primary)', // Always colored
                    borderRadius: '4px',
                    transition: 'all 0.2s',
                    opacity: 0.8, // Visible by default
                    boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>

              <Box
                sx={{
                  position: 'sticky',
                  top: 100,
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: '10px' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--secondary)' }}>
                    FILTERS
                  </Typography>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-[var(--primary)]">
                    <MdTune size={20} />
                  </button>
                </Box>

                <FilterContent />
              </Box>
            </Box>
          )}

          {/* Product Grid Area */}
          <Box sx={{ flexGrow: 1 }}>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight="bold">
                {categoryTabs.find(t => t.value === activeTab)?.label || 'Designs'}
              </Typography>
              {activeTab !== 'custom' && (
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {activeTab === 'our_designs'
                    ? `Total: ${filteredCategories.length} categories | Showing ${visibleCategories.length} of ${filteredCategories.length}`
                    : `Total: ${filteredProducts.length} designs | Showing ${visibleProducts.length} of ${filteredProducts.length}`
                  }
                </Typography>
              )}
            </Box>

            {activeTab === 'custom' ? (
              <CustomDesignOptions />
            ) : activeTab === 'our_designs' ? (
              categories && categories.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {visibleCategories.map((cat) => (
                      <div key={cat._id} className="flex justify-center">
                        <CategoryCard item={cat} shape="square" />
                      </div>
                    ))}
                  </div>
                  {/* Show More Categories Button */}
                  {hasMoreCategories && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                      <button
                        onClick={handleShowMoreCategories}
                        disabled={isLoadingMore}
                        className="px-8 py-3 bg-[var(--primary)] text-white rounded-full font-semibold hover:bg-[var(--secondary)] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} sx={{ color: 'white' }} />
                            {t('common.loading', 'Loading...')}
                          </Box>
                        ) : (
                          `${t('common.show_more', 'Show More')} (${remainingCategories} ${t('common.more', 'more')})`
                        )}
                      </button>
                    </Box>
                  )}
                </>
              ) : (
                <Loading count={8} />
              )
            ) : isProductsLoading ? (
              <ArrivalCardSkeleton count={12} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-y-8">
                  {visibleProducts.map((item) => (
                    <ArrivalCard item={item} key={item._id} showQuickView />
                  ))}
                </div>

                {/* Show More Button */}
                {hasMoreProducts && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <button
                      onClick={handleShowMore}
                      disabled={isLoadingMore}
                      className="px-8 py-3 bg-[var(--primary)] text-white rounded-full font-semibold hover:bg-[var(--secondary)] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                          {t('common.loading', 'Loading...')}
                        </Box>
                      ) : (
                        `${t('common.show_more', 'Show More')} (${remainingProducts} ${t('common.more', 'more')})`
                      )}
                    </button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{ sx: { width: 300 } }}
      >
        <FilterContent mobile />
      </Drawer>
    </>
  );
};

export default Page;
