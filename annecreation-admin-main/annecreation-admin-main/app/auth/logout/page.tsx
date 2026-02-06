"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { logout } from "@/lib/auth";
import { useLogoutMutation } from "@/lib/redux/api/authApi";

export default function LogoutPage() {
  const router = useRouter();
  const [logoutApi] = useLogoutMutation();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call the API endpoint to invalidate server-side session/token
        await logoutApi().unwrap();
      } catch (error) {
        console.error("Logout API call failed:", error);
      } finally {
        // Always perform client-side logout to clear localStorage
        logout();
        // Redirect to login page
        router.replace("/admin");
      }
    };

    performLogout();
  }, [logoutApi, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#ffb729]" />
        <p className="text-lg font-medium">Logging out...</p>
      </div>
    </div>
  );
}
