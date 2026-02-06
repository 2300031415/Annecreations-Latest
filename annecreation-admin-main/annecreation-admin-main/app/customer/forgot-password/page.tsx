"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForgotPasswordMutation } from "@/lib/redux/api/customerApi";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      // Send forgot password request
      const result = await forgotPassword({ email }).unwrap();

      // Show success message
      toast.success(result.message || "Password reset email has been sent");

      // Set submitted state to show success message
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);

      // Extract error message from response
      let errorMessage = "Failed to process your request. Please try again.";

      if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Logo className="h-16 w-16" />
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-center text-sm text-gray-500">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                We've sent a password reset link to your email address. Please
                check your inbox.
              </p>
            </div>
            <Button
              className="w-full bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
              onClick={() => router.push("/customer/login")}
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/customer/login"
                className="text-[#ffb729] hover:text-[#ffb729]/90"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
