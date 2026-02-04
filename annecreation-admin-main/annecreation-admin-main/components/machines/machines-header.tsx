"use client"

import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MachineDialog } from "@/components/machines/machine-dialog"
import { MachineCategoryDialog } from "@/components/machines/machine-category-dialog"

export function MachinesHeader() {
  const [showMachineDialog, setShowMachineDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/settings">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/settings/machines">Machines</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-bold tracking-tight">Machines</h1>
        <p className="text-sm text-gray-500">Manage embroidery machines and their formats.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
        <Button onClick={() => setShowMachineDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>
      <MachineDialog open={showMachineDialog} onOpenChange={setShowMachineDialog} />
      <MachineCategoryDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog} />
    </div>
  )
}
