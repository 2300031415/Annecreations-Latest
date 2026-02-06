"use client"

import { ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample permission data - in a real app, this would come from your backend
const permissionGroups = [
  {
    id: "dashboard",
    name: "Dashboard",
    permissions: [
      { id: "dashboard.view", name: "View Dashboard" },
      { id: "dashboard.analytics", name: "View Analytics" },
    ],
  },
  {
    id: "products",
    name: "Products",
    permissions: [
      { id: "products.view", name: "View Products" },
      { id: "products.create", name: "Create Products" },
      { id: "products.edit", name: "Edit Products" },
      { id: "products.delete", name: "Delete Products" },
    ],
  },
  {
    id: "categories",
    name: "Categories",
    permissions: [
      { id: "categories.view", name: "View Categories" },
      { id: "categories.create", name: "Create Categories" },
      { id: "categories.edit", name: "Edit Categories" },
      { id: "categories.delete", name: "Delete Categories" },
    ],
  },
  {
    id: "orders",
    name: "Orders",
    permissions: [
      { id: "orders.view", name: "View Orders" },
      { id: "orders.process", name: "Process Orders" },
      { id: "orders.refund", name: "Refund Orders" },
      { id: "orders.delete", name: "Delete Orders" },
    ],
  },
  {
    id: "customers",
    name: "Customers",
    permissions: [
      { id: "customers.view", name: "View Customers" },
      { id: "customers.create", name: "Create Customers" },
      { id: "customers.edit", name: "Edit Customers" },
      { id: "customers.delete", name: "Delete Customers" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    permissions: [
      { id: "marketing.view", name: "View Marketing" },
      { id: "marketing.coupons", name: "Manage Coupons" },
      { id: "marketing.sms", name: "Manage SMS" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    permissions: [
      { id: "settings.view", name: "View Settings" },
      { id: "settings.edit", name: "Edit Settings" },
      { id: "settings.users", name: "Manage Users" },
    ],
  },
]

// Predefined role templates
const roleTemplates = {
  administrator: permissionGroups.flatMap((group) => group.permissions.map((p) => p.id)),
  manager: [
    "dashboard.view",
    "dashboard.analytics",
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "orders.view",
    "orders.process",
    "customers.view",
    "customers.edit",
    "marketing.view",
    "marketing.coupons",
    "settings.view",
  ],
  support: ["dashboard.view", "products.view", "categories.view", "orders.view", "orders.process", "customers.view"],
  editor: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
  ],
}

export function UserPermissions({ user }: { user: any }) {
  // If editing a user, use their role to determine initial permissions
  const initialRole = user?.role?.toLowerCase() || "support"
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    roleTemplates[initialRole as keyof typeof roleTemplates] || [],
  )
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((current) =>
      current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId],
    )
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

  const selectAllInGroup = (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return

    const groupPermissionIds = group.permissions.map((p) => p.id)
    const allSelected = groupPermissionIds.every((id) => selectedPermissions.includes(id))

    if (allSelected) {
      // Deselect all in group
      setSelectedPermissions((current) => current.filter((id) => !groupPermissionIds.includes(id)))
    } else {
      // Select all in group
      setSelectedPermissions((current) => [
        ...current.filter((id) => !groupPermissionIds.includes(id)),
        ...groupPermissionIds,
      ])
    }
  }

  const applyRoleTemplate = (role: keyof typeof roleTemplates) => {
    setSelectedPermissions(roleTemplates[role])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyRoleTemplate("administrator")}
          className={
            JSON.stringify(selectedPermissions) === JSON.stringify(roleTemplates.administrator)
              ? "bg-[#ffb729] text-[#311807]"
              : ""
          }
        >
          Administrator
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyRoleTemplate("manager")}
          className={
            JSON.stringify(selectedPermissions) === JSON.stringify(roleTemplates.manager)
              ? "bg-[#ffb729] text-[#311807]"
              : ""
          }
        >
          Manager
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyRoleTemplate("support")}
          className={
            JSON.stringify(selectedPermissions) === JSON.stringify(roleTemplates.support)
              ? "bg-[#ffb729] text-[#311807]"
              : ""
          }
        >
          Support
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyRoleTemplate("editor")}
          className={
            JSON.stringify(selectedPermissions) === JSON.stringify(roleTemplates.editor)
              ? "bg-[#ffb729] text-[#311807]"
              : ""
          }
        >
          Editor
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Permission Group</TableHead>
              <TableHead>Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`select-all-${group.id}`}
                      checked={group.permissions.every((p) => selectedPermissions.includes(p.id))}
                      onCheckedChange={() => selectAllInGroup(group.id)}
                    />
                    <label
                      htmlFor={`select-all-${group.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {group.name}
                    </label>
                  </div>
                </TableCell>
                <TableCell>
                  <Collapsible
                    open={openGroups[group.id]}
                    onOpenChange={() => toggleGroup(group.id)}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex w-full justify-between p-0">
                        <span>
                          {group.permissions.filter((p) => selectedPermissions.includes(p.id)).length} of{" "}
                          {group.permissions.length} selected
                        </span>
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {group.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
