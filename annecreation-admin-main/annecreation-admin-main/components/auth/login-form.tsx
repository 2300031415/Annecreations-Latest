"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLoginMutation } from "@/lib/redux/api/authApi";
import { updateSession } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [adminLogin, { isLoading }] = useLoginMutation();

  // Admin login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Common fields
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Admin login validation
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      // Make admin login request
      const result = await adminLogin({ username, password }).unwrap();

      // Extract tokens from response (flat structure)
      const { accessToken, refreshToken, admin } = result;

      // Store tokens
      if (accessToken && admin) {
        updateSession(
          accessToken,
          refreshToken,
          admin
        );
        // Show success message
        toast.success(result.message || "Admin login successful");

        // Check if rememberMe is true, if so, save username for future login
        if (rememberMe) {
          localStorage.setItem("savedUsername", username);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedUsername");
          localStorage.removeItem("savedPassword");
        }

        // Use window.location for hard navigation to avoid any routing issues
        window.location.href = "/admin/dashboard";
      } else {
        toast.error("Login failed: Invalid response from server");
        return;
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      handleLoginError(err);
    }
  };

  // Handle login errors
  const handleLoginError = (err: any) => {
    let errorMessage = "Invalid credentials";

    if (err.data?.message) {
      errorMessage = err.data.message;
    } else if (err.error) {
      errorMessage = err.error;
    } else if (err.message) {
      errorMessage = err.message;
    }

    setError(errorMessage);
    toast.error(errorMessage);
  };

  // Load saved credentials if they exist
  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
    const savedPassword = localStorage.getItem("savedPassword");
    
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#ffb729] hover:text-[#ffb729]/90"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="text-sm">
            Remember me
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
