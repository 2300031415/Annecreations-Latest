"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect } from "react"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useGetRolesQuery } from "@/lib/redux/api/rolesApi"
import { useCreateAdminMutation, useUpdateAdminMutation, useGetAdminByIdQuery, AdminUser } from "@/lib/redux/api/adminUsersApi"

const createUserSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  firstName: z.string().min(1, { message: "First name is required." }).max(32, { message: "First name must not exceed 32 characters." }),
  lastName: z.string().min(1, { message: "Last name is required." }).max(32, { message: "Last name must not exceed 32 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  roleId: z.string({ required_error: "Please select a role." }),
  status: z.boolean().default(true),  // Backend expects boolean
})

const updateUserSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  firstName: z.string().min(1, { message: "First name is required." }).max(32, { message: "First name must not exceed 32 characters." }),
  lastName: z.string().min(1, { message: "Last name is required." }).max(32, { message: "Last name must not exceed 32 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  roleId: z.string({ required_error: "Please select a role." }),
  status: z.boolean().default(true),  // Backend expects boolean
}).refine((data) => {
  // If password is provided, it must be at least 8 characters
  if (data.password && data.password.trim() !== '') {
    return data.password.length >= 8;
  }
  return true;
}, {
  message: "Password must be at least 8 characters",
  path: ["password"],
}).refine((data) => {
  // If password is provided, confirmPassword must be provided and match
  if (data.password && data.password.trim() !== '') {
    if (!data.confirmPassword || data.confirmPassword.trim() === '') {
      return false;
    }
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type CreateUserFormValues = z.infer<typeof createUserSchema>
type UpdateUserFormValues = z.infer<typeof updateUserSchema>

interface UserFormProps {
  user: AdminUser | null;
  onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery({ page: 1, limit: 100 })
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation()
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation()
  
  // Fetch fresh admin data when editing
  const { data: adminData, isLoading: isLoadingAdmin } = useGetAdminByIdQuery(
    user?._id || '',
    { skip: !user?._id }
  )

  const roles = rolesData?.data?.filter((r) => r.status === true || r.status === "active") || []
  const isEditMode = !!user
  
  // Use fetched admin data if available, otherwise use the passed user prop
  const currentUser = adminData?.data || user

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      username: currentUser?.username || "",
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || "",
      password: "",
      confirmPassword: "",
      roleId: currentUser?.role?._id || "",
      status: currentUser ? (currentUser.status === "active" || currentUser.status === true ? true : false) : true,  // Default to active for new users
    },
  })

  // Update form when user prop changes (when dialog opens/closes)
  useEffect(() => {
    if (user) {
      // When editing, use the user prop initially, then update when adminData loads
      const roleId = user.role?._id || (typeof user.role === 'string' ? user.role : '') || ""
      form.reset({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        roleId: roleId,
        status: user.status === "active" || user.status === true ? true : false,
      })
    } else {
      // Reset form for create mode
      form.reset({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        roleId: "",
        status: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id])

  // Update form when fetched admin data arrives (this will override the initial values)
  useEffect(() => {
    if (isEditMode && adminData?.data) {
      console.log('Updating form with fetched admin data:', {
        username: adminData.data.username,
        roleId: adminData.data.role?._id,
        roleName: adminData.data.role?.name,
      });
      
      // Use the fetched admin data
      form.reset({
        username: adminData.data.username,
        firstName: adminData.data.firstName || "",
        lastName: adminData.data.lastName || "",
        email: adminData.data.email,
        password: "",
        confirmPassword: "",
        roleId: adminData.data.role?._id || "",
        status: adminData.data.status === "active" || adminData.data.status === true ? true : false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminData?.data, isEditMode])

  async function onSubmit(data: CreateUserFormValues | UpdateUserFormValues) {
    try {
      if (isEditMode) {
        // Update existing user - single API call with all fields
        const updateData: any = {
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          status: data.status,
        }
        
        // Include password fields only if password is provided
        if (data.password && data.password.trim() !== '') {
          updateData.newPassword = data.password
          updateData.confirmPassword = data.confirmPassword || data.password
        }
        
        await updateAdmin({ id: user._id, data: updateData }).unwrap()
        toast.success("Admin user updated successfully")
      } else {
        // Create new user
        await createAdmin(data as CreateUserFormValues).unwrap()
        toast.success("Admin user created successfully")
      }
      onSuccess()
    } catch (error: any) {
      console.error("Admin save error:", error)
      
      // Handle validation errors with detailed field-level messages
      if (error?.data?.errors && Array.isArray(error.data.errors)) {
        // Display each field-level error
        error.data.errors.forEach((err: { field: string; message: string; value?: any }) => {
          toast.error(`${err.field}: ${err.message}`)
        })
        // Also show the main message if available
        if (error.data.message && error.data.message !== "Validation failed") {
          toast.error(error.data.message)
        }
      } else {
        // Fallback to simple error message
        const errorMessage = error?.data?.message || error?.message || "Failed to save admin user"
        toast.error(errorMessage)
      }
    }
  }

  const isSubmitting = isCreating || isUpdating

  // Show loading spinner while fetching data
  if (isRolesLoading || (isEditMode && isLoadingAdmin)) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffb729]" />
      </div>
    )
  }

  // Don't render form in edit mode until admin data is loaded
  if (isEditMode && !adminData?.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffb729]" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form id="user-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isEditMode ? "New Password (leave blank to keep current)" : "Password *"}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  {isEditMode ? "Only fill this if you want to change the password" : "Minimum 8 characters"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditMode && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Required if changing password. Must match new password.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => {
              const roleId = field.value || ""
              
              return (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={roleId} 
                    disabled={isSubmitting || roles.length === 0}
                    key={`role-select-${user?._id || 'new'}-${roleId}`}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={roles.length === 0 ? "Loading roles..." : "Select a role"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <SelectItem value="no-roles" disabled>
                          No roles available
                        </SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>This determines what permissions the user will have.</FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>Disable to temporarily revoke user access.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}
