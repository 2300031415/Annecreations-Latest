"use client"

import { Edit, MoreHorizontal, Trash, Eye, Loader2, Users, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RoleDialog } from "@/components/roles/role-dialog"
import { useGetRolesQuery, useDeleteRoleMutation, useGetRoleAdminsQuery, Role, Permission } from "@/lib/redux/api/rolesApi"
import { Input } from "@/components/ui/input"
import { usePermissions } from "@/hooks/use-permissions"

export function RolesList() {
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)

  const { data: rolesData, isLoading, refetch } = useGetRolesQuery({ page: 1, limit: 50, search: searchQuery })
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to manage roles
  // Role management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canCreateRoles = isSuperAdmin || hasPermission('admins', 'create')
  const canUpdateRoles = isSuperAdmin || hasPermission('admins', 'update')
  const canDeleteRoles = isSuperAdmin || hasPermission('admins', 'delete')

  const handleEdit = (role: Role) => {
    // Prevent editing SuperAdmin role
    if (role.name.toLowerCase() === 'superadmin') {
      toast.error("Cannot edit SuperAdmin role. SuperAdmin is a protected system role.")
      return
    }
    setEditRole(role)
    setOpen(true)
  }

  const handleCreate = () => {
    setEditRole(null)
    setOpen(true)
  }

  const handleDeleteClick = (role: Role) => {
    // Prevent deleting SuperAdmin role
    if (role.name.toLowerCase() === 'superadmin') {
      toast.error("Cannot delete SuperAdmin role. SuperAdmin is a protected system role.")
      return
    }
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return

    try {
      await deleteRole(roleToDelete._id).unwrap()
      toast.success("Role deleted successfully")
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete role")
    }
  }

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditRole(null)
      refetch()
    }
  }

  const roles = rolesData?.data || []

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb729]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-gray-500">No roles found</p>
              {canCreateRoles && (
                <Button onClick={handleCreate} className="mt-4 bg-[#ffb729] hover:bg-[#ffb729]/90 text-[#311807]">
                  Create Your First Role
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{role.description || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setSelectedRoleForPermissions(role)
                          setPermissionsDialogOpen(true)
                        }}
                      >
                        {role.permissions.filter(p => p.create || p.read || p.update || p.delete).length} features
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          role.status === "active" || role.status === true
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {role.status === true || role.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {role.name.toLowerCase() !== 'superadmin' && (
                            <>
                              {canUpdateRoles && (
                                <DropdownMenuItem onClick={() => handleEdit(role)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteRoles && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(role)} className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {role.name.toLowerCase() === 'superadmin' && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              Protected System Role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RoleDialog open={open} onOpenChange={handleDialogClose} role={editRole} mode={editRole ? "edit" : "create"} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role "{roleToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissions for {selectedRoleForPermissions?.name}</DialogTitle>
            <DialogDescription>
              View all permissions assigned to this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRoleForPermissions?.permissions && selectedRoleForPermissions.permissions.length > 0 ? (
              selectedRoleForPermissions.permissions
                .filter(p => p.create || p.read || p.update || p.delete)
                .map((permission: Permission) => {
                  // Format feature name: handle camelCase, kebab-case, and common names
                  const formatFeatureName = (feature: string) => {
                    // Common feature name mappings
                    const featureMap: Record<string, string> = {
                      'products': 'Products',
                      'categories': 'Categories',
                      'orders': 'Orders',
                      'customers': 'Customers',
                      'coupons': 'Coupons',
                      'dashboard': 'Dashboard',
                      'analytics': 'Analytics',
                      'loginAsUser': 'Login as User',
                      'login-as-user': 'Login as User',
                    }
                    
                    if (featureMap[feature]) {
                      return featureMap[feature]
                    }
                    
                    // Handle kebab-case
                    if (feature.includes('-')) {
                      return feature
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    }
                    
                    // Handle camelCase
                    return feature
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim()
                  }
                  
                  const featureName = formatFeatureName(permission.feature)
                  
                  return (
                    <Card key={permission.feature}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{featureName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="flex items-center gap-2">
                            {permission.read ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`text-sm ${permission.read ? 'text-gray-900' : 'text-gray-400'}`}>
                              Read
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {permission.create ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`text-sm ${permission.create ? 'text-gray-900' : 'text-gray-400'}`}>
                              Create
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {permission.update ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`text-sm ${permission.update ? 'text-gray-900' : 'text-gray-400'}`}>
                              Update
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {permission.delete ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`text-sm ${permission.delete ? 'text-gray-900' : 'text-gray-400'}`}>
                              Delete
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
            ) : (
              <p className="text-center text-gray-500 py-4">No permissions assigned</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
