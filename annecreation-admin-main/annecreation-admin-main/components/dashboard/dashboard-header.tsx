"use client";

import { Bell, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from '@/public/logo.svg'

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "./mobile-sidebar";
import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white px-6 shadow-sm">
      <div className="flex w-10 items-center">
        <MobileSidebar />
      </div>
      {/* <div className="flex flex-1 items-center justify-center">
        <form className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 bg-white pl-8 shadow-none focus-visible:border-[#ffb729] focus-visible:ring-[#ffb729]"
            />
          </div>
        </form>
      </div> */}
      <div className="flex items-center gap-4">
        {/* <Button
          variant="outline"
          size="icon"
          className="relative border border-gray-300 bg-white"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffb729] text-xs font-bold text-white">
            5
          </span>
        </Button> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border border-gray-300 bg-white"
            >
              <Image
                src={logo}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="flex w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton
                variant="ghost"
                className="w-full justify-start p-0"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
