"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserForm } from "@/components/users/user-form"
import { AdminUser } from "@/lib/redux/api/adminUsersApi"
import { usePermissions } from "@/hooks/use-permissions"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  mode?: "create" | "edit"
}

export function UserDialog({ open, onOpenChange, user = null, mode = "create" }: UserDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to create/update admin users
  // Admin user management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canManageUsers = isSuperAdmin || hasPermission('admins', mode === "create" ? 'create' : 'update')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Admin User" : "Edit Admin User"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new admin user and assign them a role with specific permissions." 
              : "Edit admin user details and role assignment."}
          </DialogDescription>
        </DialogHeader>
        <UserForm user={user} onSuccess={handleSuccess} />
        {canManageUsers && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
              {mode === "create" ? "Create Admin User" : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
