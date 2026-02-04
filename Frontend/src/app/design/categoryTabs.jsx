'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Tab, CircularProgress, Box, IconButton } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';

const CategoryTabs = ({ categories, activeTab, onChange, isLoading }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen width for orientation
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768); // Tailwind md = 768px
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <CircularProgress color="warning" />
      </div>
    );
  }

  const handleTabChange = (event, newIndex) => {
    const selectedCategory = categories[newIndex];
    onChange(newIndex);
    router.push(`${pathname}?category=${encodeURIComponent(selectedCategory)}`);
  };

  const ScrollButton = ({ direction, ...props }) => (
    <IconButton {...props} className="text-yellow-500">
      {direction === 'left' ? <AiOutlineLeft size={24} /> : <AiOutlineRight size={24} />}
    </IconButton>
  );

  return (
    <Box className={`w-full ${isDesktop ? 'flex flex-col' : 'flex flex-row overflow-x-auto'}`}>
      <Tabs
        orientation={isDesktop ? 'vertical' : 'horizontal'}
        variant="scrollable"
        value={activeTab}
        onChange={handleTabChange}
        scrollButtons="auto"
        allowScrollButtonsMobile
        ScrollButtonComponent={(props) => <ScrollButton {...props} direction={props.direction} />}
        sx={{
          '& .MuiTabs-indicator': { backgroundColor: '#f59e0b' },
          '& .MuiTab-root': {
            alignItems: 'flex-start',
            textAlign: 'left',
            color: '#000',
            fontSize: '0.9rem',
            textTransform: 'none',
            paddingLeft: '12px',
            minWidth: '120px',
            '&.Mui-selected': {
              color: '#fff',
              fontWeight: 600,
              backgroundColor: '#f59e0b',
            },
          },
        }}
      >
        {categories.map((name) => (
          <Tab key={name} label={name} />
        ))}
      </Tabs>
    </Box>
  );
};

export default React.memo(CategoryTabs);
