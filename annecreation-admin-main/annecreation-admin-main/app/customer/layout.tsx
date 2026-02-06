"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Only show navigation if the user is in the account section
  const showNavigation = pathname.startsWith("/customer/account");

  // Define navigation items
  const navItems = [
    { href: "/customer/account", label: "Dashboard" },
    { href: "/customer/account/orders", label: "My Orders" },
    { href: "/customer/account/addresses", label: "Addresses" },
    { href: "/customer/account/wishlist", label: "Wishlist" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold">Anne Creations</span>
          </Link>

          <div className="flex items-center gap-4">
            {!showNavigation && (
              <>
                <Link
                  href="/customer/login"
                  className={cn(
                    "text-sm font-medium",
                    pathname === "/customer/login" && "text-[#ffb729]"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/customer/register"
                  className={cn(
                    "rounded-md bg-[#ffb729] px-4 py-2 text-sm font-medium text-[#311807]",
                    pathname === "/customer/register" && "bg-[#ffb729]/90"
                  )}
                >
                  Register
                </Link>
              </>
            )}

            {showNavigation && (
              <Link href="/" className="text-sm font-medium">
                Back to Shop
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {showNavigation ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Sidebar navigation for account pages */}
            <aside className="md:col-span-1">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      pathname === item.href
                        ? "bg-[#ffb729]/10 text-[#ffb729]"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Page content */}
            <div className="md:col-span-3">{children}</div>
          </div>
        ) : (
          // Full width content for login/register pages
          children
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Anne Creations. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
