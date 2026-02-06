'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import axiosClient from '@/lib/axiosClient';

export const AnalyticsProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Call analytics start endpoint once on app startup
    const initializeAnalytics = async () => {
      try {
        await axiosClient.get(`/api/analytics/start`, {
          withCredentials: true,
        });
        console.log('Analytics initialized with browserId');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        // Still allow the app to render even if analytics fails
        setIsInitialized(true);
      }
    };

    initializeAnalytics();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Show loader while initializing analytics - DO NOT render Header or other children to prevent API calls
  if (!isInitialized) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Logo & Text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Logo Image */}
          <Image 
            src="/assets/logo.svg" 
            alt="Anne Creations" 
            width={80} 
            height={80}
            style={{
              objectFit: 'contain'
            }}
          />
          
          {/* Brand Text */}
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#311807',
            letterSpacing: '2px'
          }}>
            ANNE CREATIONS
          </div>
        </div>

        {/* Small Loading Dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '32px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#FFB729',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '0s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#311807',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.2s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#FFB729',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.4s'
          }}></div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.5;
            }
            40% {
              transform: translateY(-12px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  // Once initialized, render all children (which includes Header)
  // Prevent Header from being rendered twice by not including it in children's initial render
  return <>{children}</>;
};

