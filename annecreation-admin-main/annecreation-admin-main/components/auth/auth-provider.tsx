"use client";

import React, { useEffect, useState } from "react";
import { useRefreshTokenMutation } from "@/lib/redux/api/authApi";
import { isAuthenticated, isTokenExpired } from "@/lib/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [refreshToken] = useRefreshTokenMutation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to handle token refresh
  const handleTokenRefresh = async () => {
    try {
      // Only try to refresh if user is authenticated and token is expired/close to expiring
      if (isAuthenticated() && isTokenExpired()) {
        await refreshToken().unwrap();
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
    } finally {
      setIsInitialized(true);
    }
  };

  // Initial token refresh check
  useEffect(() => {
    handleTokenRefresh();
  }, []);

  // Set up token refresh interval (every 14 minutes)
  // Assuming tokens expire after 15 minutes
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      if (isAuthenticated()) {
        handleTokenRefresh();
      }
    }, 14 * 60 * 1000); // 14 minutes in milliseconds

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Don't block rendering since token refresh happens in the background
  return <>{children}</>;
}
