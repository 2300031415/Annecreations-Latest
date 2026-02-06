"use client"

import { Menu } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSidebar } from "@/contexts/sidebar-context"
import { DashboardSidebar } from "./dashboard-sidebar"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const { toggleSidebar } = useSidebar()

  // Close the sheet when the screen size changes to prevent it from being open on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0">
          <div className="h-full w-full">
            <DashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
