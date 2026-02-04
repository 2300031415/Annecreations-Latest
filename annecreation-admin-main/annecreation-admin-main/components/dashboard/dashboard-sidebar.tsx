"use client"

import {
  BarChart3,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils";
import Logo from '@/public/logo.svg'
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const showBanners = process.env.NEXT_PUBLIC_ENABLE_BANNERS === "true";

const sidebarLinks = [
  {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
  },
  {
      title: "Products",
      href: "/dashboard/products",
      icon: Box,
  },
  {
      title: "Categories",
      href: "/dashboard/categories",
      icon: Tag,
  },

  {
      title: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
  },
  {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Users,
  },
  {
    title:"Banners",
      href: "/dashboard/banners",
      icon: Box,
  },
  {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      subItems: [
        {
          title: "Online Users",
          href: "/dashboard/analytics/online-users",
        },
        {
          title: "Customers By order",
          href: "/dashboard/analytics/sales",
        },
    ],
  },
  {
      title: "Marketing",
      href: "/dashboard/marketing",
      icon: ShoppingCart,
      subItems: [
        {
          title: "Coupons",
          href: "/dashboard/marketing/coupons",
        },
    ],
  },
  {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      subItems: [
        {
          title: "Admin Users",
          href: "/dashboard/settings/users",
        },
        {
          title: "Roles",
          href: "/dashboard/settings/roles",
        },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isExpanded, toggleSidebar } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "/dashboard/marketing": false, // Always collapsed
    "/dashboard/settings": false, // Always collapsed
  })

  // Initialize expanded sections based on current path and default collapsed sections
  useEffect(() => {
    const initialExpandedSections: Record<string, boolean> = {
      "/dashboard/marketing": false, // Always collapsed
      "/dashboard/settings": false, // Always collapsed
    }

    sidebarLinks.forEach((link) => {
      if (link.subItems) {
        // Check if the current path is in this section's subitems
        const isCurrentSection = link.subItems.some(
          (subItem) => pathname === subItem.href || pathname.startsWith(subItem.href + "/"),
        )

        // Always expand Analytics if we're in an Analytics page
        if (link.title === "Analytics") {
          initialExpandedSections[link.href] = isCurrentSection || pathname.includes("/dashboard/analytics")
        } else {
          initialExpandedSections[link.href] = isCurrentSection
        }
      }
    })

    setExpandedSections(initialExpandedSections)
  }, [pathname])

  const toggleSection = (href: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [href]: !prev[href],
    }))
  }

  const isLinkActive = (link: (typeof sidebarLinks)[0]) => {
    if (pathname === link.href) return true
    if (
      link.subItems &&
      link.subItems.some((subItem) => pathname === subItem.href || pathname.startsWith(subItem.href + "/"))
    )
      return true
    return false
  }

  return (
    <aside
      className={cn(
        "h-screen border-r border-gray-200 bg-white shadow-sm transition-all duration-300",
        isExpanded ? "w-64" : "w-20",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {isExpanded ? (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={Logo}
              alt="Anne Creations Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              />
          </Link>
        ) : (
          <div className="mx-auto">
            <Image
            src={Logo}
              alt="Anne Creations Logo"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
            />
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="hidden border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 md:flex"
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-2">
          <TooltipProvider delayDuration={0}>
            {sidebarLinks
              .filter((link) => !(link.title === "Banners" && !showBanners))
              .map((link) => (
              <React.Fragment key={link.href}>
                {link.subItems ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isLinkActive(link) ? "default" : "ghost"}
                          className={cn(
                            isExpanded ? "justify-between" : "justify-center",
                            "gap-2 transition-all",
                            isLinkActive(link)
                              ? "bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90 hover:text-[#311807]"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                            link.title === "Analytics" &&
                              pathname.includes("/dashboard/analytics") &&
                              !isLinkActive(link)
                              ? "bg-gray-100"
                              : "",
                          )}
                          onClick={() => isExpanded && toggleSection(link.href)}
                        >
                          <div className="flex items-center gap-2">
                            <link.icon className="h-5 w-5" />
                            {isExpanded && <span>{link.title}</span>}
                          </div>
                          {isExpanded &&
                            (expandedSections[link.href] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </Button>
                      </TooltipTrigger>
                      {!isExpanded && <TooltipContent side="right">{link.title}</TooltipContent>}
                    </Tooltip>

                    {isExpanded && expandedSections[link.href] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {link.subItems.map((subItem) => (
                          <Button
                            key={subItem.href}
                            variant={
                              pathname === subItem.href || pathname.startsWith(subItem.href + "/") ? "default" : "ghost"
                            }
                            className={cn(
                              "w-full justify-start pl-6",
                              pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                                ? "bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90 hover:text-[#311807]"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                            )}
                            asChild
                          >
                            <Link href={subItem.href}>{subItem.title}</Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pathname === link.href ? "default" : "ghost"}
                        className={cn(
                          isExpanded ? "justify-start" : "justify-center",
                          "gap-2 transition-all",
                          pathname === link.href
                            ? "bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90 hover:text-[#311807]"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        )}
                        asChild
                      >
                        <Link href={link.href}>
                          <link.icon className="h-5 w-5" />
                          {isExpanded && <span>{link.title}</span>}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    {!isExpanded && <TooltipContent side="right">{link.title}</TooltipContent>}
                  </Tooltip>
                )}
              </React.Fragment>
            ))}
          </TooltipProvider>
        </nav>
      </ScrollArea>
      <div className="border-t border-gray-200 p-4">
        {isExpanded ? (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffb729]">
              <Home className="h-5 w-5 text-[#311807]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Anne Creations</p>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffb729]">
              <Home className="h-5 w-5 text-[#311807]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
