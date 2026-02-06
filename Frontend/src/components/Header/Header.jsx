'use client';
import '@/i18n';
import React from 'react';
import Container from '@mui/material';
import dynamic from 'next/dynamic';

const HeaderLinks = dynamic(() => import('./Header_links'), { ssr: true });

const Header = () => {
  return (
    <div className='w-full sticky shadow-sm bg-[var(--card-bg)] top-0 z-50'>
      <div className="container mx-auto px-4 py-2">
        <HeaderLinks />
      </div>
    </div>
  );
};

export default Header;
