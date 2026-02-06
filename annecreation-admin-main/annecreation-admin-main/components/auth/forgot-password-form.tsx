"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPasswordMutation } from "@/lib/redux/api/authApi";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your admin email address");
      return;
    }

    try {
      // Make the API call to the admin forgot password endpoint
      const result = await forgotPassword({ email }).unwrap();

      // Show success message
      toast.success(result.message || "Password reset instructions sent");
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);

      // Extract error message
      let errorMessage = "Failed to process your request";
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

  if (isSubmitted) {
    return (
      <div className="mt-8 space-y-6">
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            If an account exists with the email {email}, you will receive
            password reset instructions.
          </p>
        </div>
        <Link href="/">
          <Button
            type="button"
            className="flex w-full items-center justify-center"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <Label htmlFor="email">Admin Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div className="flex flex-col space-y-4">
        <Button
          type="submit"
          className="w-full bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        <Link href="/">
          <Button
            type="button"
            className="flex w-full items-center justify-center"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    </form>
  );
}
