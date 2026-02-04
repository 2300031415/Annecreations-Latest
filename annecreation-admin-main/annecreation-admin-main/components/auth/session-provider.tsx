"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

interface SessionProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function SessionProvider({ children, requireAuth = false }: SessionProviderProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === 'undefined') {
        setIsChecking(false);
        return;
      }

      const authenticated = isAuthenticated();

      if (requireAuth && !authenticated) {
        // If authentication is required but user is not authenticated, redirect to login
        router.push('/');
      }

      setIsChecking(false);
    };

    checkSession();
  }, [requireAuth, router]);

  if (isChecking && requireAuth) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}

