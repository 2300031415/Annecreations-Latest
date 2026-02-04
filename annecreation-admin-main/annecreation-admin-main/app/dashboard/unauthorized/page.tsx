"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AccessDenied } from "@/components/ui/access-denied";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <AccessDenied
        className="min-h-screen"
        actions={
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full bg-[#ffb729] hover:bg-[#ffb729]/90 text-[#311807]">
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/profile">View My Profile</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}

