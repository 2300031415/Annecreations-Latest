"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { logout } from "@/lib/auth";
import { toast } from "sonner";

interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  showIcon?: boolean;
  redirectTo?: string;
}

export function LogoutButton({
  children = "Logout",
  variant = "default",
  showIcon = true,
  redirectTo = "/",
  className,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call the API endpoint to invalidate server-side session/token
      await logoutApi().unwrap();

      // Perform client-side logout to clear localStorage
      logout();

      // Show success message
      toast.success("Logged out successfully");

      // Redirect to specified page
      router.push(redirectTo);
    } catch (error) {
      console.error("Logout failed:", error);

      // Show error message
      toast.error("Failed to logout. Please try again.");

      // Still perform client-side logout in case of API error
      logout();

      // Redirect to login page
      router.push(redirectTo);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      {...props}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  );
}
