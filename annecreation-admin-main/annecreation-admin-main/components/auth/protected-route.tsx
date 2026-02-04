"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication client-side
    const checkAuth = () => {
      // Check if user is authenticated
      const authenticated = isAuthenticated();

      if (!authenticated) {
        // Redirect to login page if not authenticated
        window.location.href = "/admin";
        return;
      }

      // If admin access is required, check admin status
      if (requireAdmin) {
        const userData = localStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;

        if (!user?.isAdmin) {
          // Redirect to dashboard if user is not an admin
          router.replace("/admin/dashboard");
          return;
        }
      }

      // User is authorized
      setIsAuthorized(true);
      setAuthChecked(true);
    };

    // Small timeout to ensure component is fully mounted
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [requireAdmin, router]);

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#ffb729]" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If authorized, render children
  return isAuthorized ? <>{children}</> : null;
}
