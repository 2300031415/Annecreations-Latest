"use client"

import { Edit, MoreHorizontal, Trash, Shield, Loader2, UserCog } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { UserDialog } from "@/components/users/user-dialog"
import { useGetAllAdminsQuery, useDeleteAdminMutation, AdminUser } from "@/lib/redux/api/adminUsersApi"
import { formatDateIST } from "@/lib/date-utils"
import { usePermissions } from "@/hooks/use-permissions"

export function UsersList() {
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: adminsData, isLoading, refetch } = useGetAllAdminsQuery({ page: 1, limit: 50, search: searchQuery })
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation()
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to manage admin users
  // Admin user management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canCreateUsers = isSuperAdmin || hasPermission('admins', 'create')
  const canUpdateUsers = isSuperAdmin || hasPermission('admins', 'update')
  const canDeleteUsers = isSuperAdmin || hasPermission('admins', 'delete')

  const handleEdit = (user: AdminUser) => {
    setEditUser(user)
    setOpen(true)
  }

  const handleCreate = () => {
    setEditUser(null)
    setOpen(true)
  }

  const handleDeleteClick = (user: AdminUser) => {
    if (user.isSuperAdmin) {
      toast.error("Cannot delete SuperAdmin users")
      return
    }
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await deleteAdmin(userToDelete._id).unwrap()
      toast.success("Admin user deleted successfully")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete admin user")
    }
  }

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditUser(null)
      refetch()
    }
  }

  // Handle both response structures: { data: { admins: [] } } or { data: [] }
  const admins = Array.isArray(adminsData?.data) 
    ? adminsData.data 
    : adminsData?.data?.admins || []

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
              placeholder="Search admin users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-gray-500">No admin users found</p>
              {canCreateUsers && (
                <Button onClick={handleCreate} className="mt-4 bg-[#ffb729] hover:bg-[#ffb729]/90 text-[#311807]">
                  Create Your First Admin User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {admin.username}
                        {admin.isSuperAdmin && (
                          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                            <Shield className="mr-1 h-3 w-3" />
                            SuperAdmin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.firstName || admin.lastName
                        ? `${admin.firstName || ""} ${admin.lastName || ""}`.trim()
                        : "-"}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.isSuperAdmin ? (
                        <span className="text-purple-600 font-semibold">SuperAdmin</span>
                      ) : admin.role ? (
                        admin.role.name
                      ) : (
                        <span className="text-gray-400">No role assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          admin.status === "active" || admin.status === true
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {typeof admin.status === 'boolean' ? (admin.status ? 'Active' : 'Inactive') : admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.lastLogin ? formatDateIST(admin.lastLogin) : "Never"}
                    </TableCell>
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
                          {canUpdateUsers && (
                            <DropdownMenuItem onClick={() => handleEdit(admin)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteUsers && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(admin)}
                              className="text-red-600"
                              disabled={admin.isSuperAdmin}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
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

      <UserDialog open={open} onOpenChange={handleDialogClose} user={editUser} mode={editUser ? "edit" : "create"} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the admin user "{userToDelete?.username}". This action cannot be undone.
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
    </>
  )
}
