'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Container,
  Box,
  Typography,
  Tab,
  Tabs,
  Drawer,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdTune } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';

import Banner from '../components/Banner/Banner';
import AnnouncementStrip from '../components/AnnouncementStrip/AnnouncementStrip';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import CategoryCard from '@/components/categoryCard/CategeroyCard';
import Loading from '@/components/categoryCard/Loading';

import SearchBar from '@/components/Header/SearchBar';
import CustomDesignOptions from '@/components/Home/CustomDesignOptions';
import FilterContent from '@/components/Home/FilterContent';

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
  color: 'white',
  borderRadius: '50px',
  padding: '10px 24px',
  minHeight: 'auto',
  transition: 'all 0.3s ease',
  backgroundColor: 'var(--secondary)',
  '&:hover': {
    backgroundColor: 'var(--secondary)',
    opacity: 0.9,
  },
  '&.Mui-selected': {
    backgroundColor: '#fff',
    color: 'var(--secondary)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
}));



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



  return (
    <>
      <Banner />
      <AnnouncementStrip />

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          ...(activeTab === 'custom' ? {
            background: 'linear-gradient(135deg, #FFEFD5 0%, #FFFFFF 50%, #FFE4B5 100%)',
            '@keyframes slowRotate': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' }
            }
          } : {})
        }}
      >
        {activeTab === 'custom' && (
          <>
            {/* Dynamic Colorful Background Accents */}
            <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,183,41,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', bottom: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(233,177,96,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', top: '40%', right: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(49,24,7,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />

            {/* Decorative Mandalas */}
            <Box sx={{ position: 'absolute', top: -100, left: -100, opacity: 0.6, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.8) contrast(1.1)', animation: 'slowRotate 60s linear infinite' }}>
              <Image src="/assets/decor/01.png" alt="decor" width={450} height={450} priority />
            </Box>
            <Box sx={{ position: 'absolute', top: '10%', right: -150, opacity: 0.5, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)', animation: 'slowRotate 80s linear infinite reverse' }}>
              <Image src="/assets/decor/02.png" alt="decor" width={550} height={550} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: '20%', left: -150, opacity: 0.45, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.4)', animation: 'slowRotate 100s linear infinite' }}>
              <Image src="/assets/decor/03.png" alt="decor" width={500} height={500} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -50, right: -50, opacity: 0.65, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(2) brightness(1.1)', animation: 'slowRotate 70s linear infinite reverse' }}>
              <Image src="/assets/decor/04.png" alt="decor" width={400} height={400} />
            </Box>

            {/* Extra Patterns to fill space */}
            <Box sx={{ position: 'absolute', top: '40%', left: '80%', opacity: 0.35, transform: 'scale(0.8) rotate(30deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)' }}>
              <Image src="/assets/decor/01.png" alt="decor" width={300} height={300} />
            </Box>
            <Box sx={{ position: 'absolute', top: '70%', left: '5%', opacity: 0.3, transform: 'scale(0.7) rotate(-45deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.6)' }}>
              <Image src="/assets/decor/04.png" alt="decor" width={300} height={300} />
            </Box>
            <Box sx={{ position: 'absolute', top: '5%', left: '40%', opacity: 0.2, transform: 'scale(0.5) rotate(90deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
              <Image src="/assets/decor/03.png" alt="decor" width={200} height={200} />
            </Box>
            <Box sx={{ position: 'absolute', top: '25%', left: '15%', opacity: 0.3, transform: 'scale(0.6) rotate(-30deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
              <Image src="/assets/decor/04.png" alt="decor" width={250} height={250} />
            </Box>
            <Box sx={{ position: 'absolute', top: '35%', left: '0%', opacity: 0.2, transform: 'scale(0.8) rotate(75deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
              <Image src="/assets/decor/02.png" alt="decor" width={350} height={350} />
            </Box>
          </>
        )}

        {/* Big Search Bar Area */}
        <Box sx={{ py: 4, bgcolor: activeTab === 'custom' ? 'transparent' : '#fff', position: 'relative', zIndex: 10 }}>
          <Container maxWidth="md">
            <SearchBar centered={true} />
          </Container>
        </Box>

        {/* Tab Icons Area */}
        <Box sx={{ bgcolor: activeTab === 'custom' ? 'transparent' : 'white', pb: 2 }}>
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
          {activeTab === 'all' && (
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
          {!isSidebarOpen && activeTab === 'all' && (
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
            {isSidebarOpen && activeTab === 'all' && (
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

                  <FilterContent
                    categories={categories}
                    selectedCategories={selectedCategories}
                    handleCategoryChange={handleCategoryChange}
                    priceRanges={priceRanges}
                    selectedPriceRanges={selectedPriceRanges}
                    handlePriceChange={handlePriceChange}
                  />
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
                          className="px-8 py-3 bg-[var(--anne-gold)] text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
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
                        className="px-8 py-3 bg-[var(--anne-gold)] text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
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
          <FilterContent
            mobile
            categories={categories}
            selectedCategories={selectedCategories}
            handleCategoryChange={handleCategoryChange}
            priceRanges={priceRanges}
            selectedPriceRanges={selectedPriceRanges}
            handlePriceChange={handlePriceChange}
          />
        </Drawer>
      </Box>
    </>
  );
};

export default Page;
