"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGetFeaturesQuery, useCreateRoleMutation, useUpdateRoleMutation, Role, Permission } from "@/lib/redux/api/rolesApi"

const roleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.boolean().default(true),
  permissions: z.array(z.object({
    feature: z.string(),
    create: z.boolean(),
    read: z.boolean(),
    update: z.boolean(),
    delete: z.boolean(),
  })),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

interface RoleFormProps {
  role: Role | null;
  onSuccess: () => void;
}

export function RoleForm({ role, onSuccess }: RoleFormProps) {
  const { data: featuresData, isLoading: isFeaturesLoading } = useGetFeaturesQuery()
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation()

  const features = featuresData?.data?.features || []
  
  // Debug logging
  console.log('Features Data:', featuresData)
  console.log('Extracted Features:', features)

  // Initialize form with default or existing values
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      status: role?.status === 'active' ? true : role?.status === true ? true : false,
      permissions: role?.permissions || [],
    },
  })

  // Track if we've initialized to prevent infinite loops
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Update permissions when features are loaded or role changes
  useEffect(() => {
    if (features.length > 0 && !isInitialized) {
      if (!role) {
        // Initialize permissions for all features when creating a new role
        // Categories and products read are public APIs, so they default to true
        const initialPermissions = features
          .filter((feat) => feat.key) // Only include features with valid keys
          .map((feat) => {
            const featureKey = feat.key || ''
            // Categories and products read are public APIs - default to true
            const isPublicRead = featureKey === 'categories' || featureKey === 'products'
            return {
              feature: featureKey,
              create: false,
              read: isPublicRead ? true : false,  // Public APIs default to read: true
              update: false,
              delete: false,
            }
          })
        console.log('Creating new role - Initial permissions:', initialPermissions)
        form.reset({
          name: "",
          description: "",
          status: true,
          permissions: initialPermissions,
        })
        setIsInitialized(true)
      } else {
        // Merge existing permissions with available features
        // Categories and products read are public APIs - ensure they're always true
        const mergedPermissions = features
          .filter((feat) => feat.key) // Only include features with valid keys
          .map((feat) => {
            const featureKey = feat.key || ''
            const existing = role.permissions.find((p) => p.feature === featureKey)
            const isPublicRead = featureKey === 'categories' || featureKey === 'products'
            
            if (existing) {
              // Ensure public APIs always have read: true
              if (isPublicRead && !existing.read) {
                return { ...existing, read: true }
              }
              return existing
            }
            
            return {
              feature: featureKey,
              create: false,
              read: isPublicRead ? true : false,  // Public APIs default to read: true
              update: false,
              delete: false,
            }
          })
        console.log('Editing role:', role.name)
        console.log('Existing permissions:', role.permissions)
        console.log('Merged permissions:', mergedPermissions)
        
        // Reset form with all values including merged permissions
        form.reset({
          name: role.name,
          description: role.description || "",
          status: role.status === true || role.status === 'active',
          permissions: mergedPermissions,
        })
        setIsInitialized(true)
      }
    }
  }, [features.length, role?._id, isInitialized])
  
  // Reset initialization flag when role changes
  useEffect(() => {
    setIsInitialized(false)
  }, [role?._id])

  const handlePermissionChange = (featureKey: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
    console.log(`Changing ${featureKey} ${action} to ${value}`)
    const currentPermissions = form.getValues('permissions') || []
    
    // Find the index of the permission for this feature
    const permissionIndex = currentPermissions.findIndex((perm) => perm.feature === featureKey)
    
    let updatedPermissions: Permission[]
    
    if (permissionIndex >= 0) {
      // Permission exists, get current permission state
      const currentPermission = currentPermissions[permissionIndex]
      
      // If trying to uncheck read, but update or delete is checked, prevent it
      // Also prevent unchecking read for public APIs (categories and products)
      if (action === 'read' && value === false) {
        // Categories and products read are public APIs - cannot be unchecked
        if (featureKey === 'categories' || featureKey === 'products') {
          toast.error("Cannot uncheck Read permission. Categories and Products read are public APIs.")
          return
        }
        
        // If trying to uncheck customers read, check if loginAsUser read is checked
        if (featureKey === 'customers') {
          const loginAsUserPermission = currentPermissions.find((p) => p.feature === 'loginAsUser')
          if (loginAsUserPermission?.read === true) {
            toast.error("Cannot uncheck Customers Read permission. Login as User requires Customers Read permission.")
            return
          }
        }
        
        if (currentPermission.update === true || currentPermission.delete === true) {
          toast.error("Cannot uncheck Read permission. Please uncheck Update and Delete permissions first.")
          return
        }
      }
      
      // If checking loginAsUser read, automatically check customers read
      if (featureKey === 'loginAsUser' && action === 'read' && value === true) {
        const customersPermissionIndex = currentPermissions.findIndex((p) => p.feature === 'customers')
        updatedPermissions = currentPermissions.map((perm, index) => {
          if (index === permissionIndex) {
            return { ...perm, [action]: value }
          }
          // Auto-check customers read if loginAsUser read is being checked
          if (index === customersPermissionIndex && customersPermissionIndex >= 0) {
            return { ...perm, read: true }
          }
          return perm
        })
        
        // If customers permission doesn't exist, create it with read: true
        if (customersPermissionIndex < 0) {
          const customersPermission: Permission = {
            feature: 'customers',
            create: false,
            read: true,
            update: false,
            delete: false,
          }
          updatedPermissions = [...updatedPermissions, customersPermission]
        }
      }
      // If checking update or delete, automatically check read if not already checked
      else if ((action === 'update' || action === 'delete') && value === true) {
        updatedPermissions = currentPermissions.map((perm, index) => {
          if (index === permissionIndex) {
            return { ...perm, [action]: value, read: true }
          }
          return perm
        })
      } else {
        // Normal update for other cases
        updatedPermissions = currentPermissions.map((perm, index) => {
          if (index === permissionIndex) {
            return { ...perm, [action]: value }
          }
          return perm
        })
      }
    } else {
      // Permission doesn't exist, create a new one for this feature
      const newPermission: Permission = {
        feature: featureKey,
        create: action === 'create' ? value : false,
        read: (action === 'read' ? value : false) || (action === 'update' || action === 'delete' ? true : false), // Auto-check read if update/delete is checked
        update: action === 'update' ? value : false,
        delete: action === 'delete' ? value : false,
      }
      updatedPermissions = [...currentPermissions, newPermission]
      
      // If checking loginAsUser read, also ensure customers read is checked
      if (featureKey === 'loginAsUser' && action === 'read' && value === true) {
        const customersPermissionIndex = updatedPermissions.findIndex((p) => p.feature === 'customers')
        if (customersPermissionIndex >= 0) {
          updatedPermissions = updatedPermissions.map((perm, index) => {
            if (index === customersPermissionIndex) {
              return { ...perm, read: true }
            }
            return perm
          })
        } else {
          const customersPermission: Permission = {
            feature: 'customers',
            create: false,
            read: true,
            update: false,
            delete: false,
          }
          updatedPermissions = [...updatedPermissions, customersPermission]
        }
      }
    }
    
    console.log('Updated permissions:', updatedPermissions)
    form.setValue('permissions', updatedPermissions, { shouldValidate: true, shouldDirty: true })
  }

  async function onSubmit(data: RoleFormValues) {
    try {
      // Check if trying to create/update SuperAdmin role
      const isSuperAdminRole = data.name.toLowerCase() === 'superadmin';
      
      if (isSuperAdminRole) {
        toast.error("Cannot create or update SuperAdmin role. SuperAdmin is a protected system role.")
        return;
      }

      // Check if role has all permissions (effectively a superadmin)
      const hasAllPermissions = data.permissions.every((perm) => {
        const featureKey = perm.feature;
        
        // For read-only features (dashboard, analytics, loginAsUser), only read should be true
        if (['dashboard', 'analytics', 'loginAsUser'].includes(featureKey)) {
          return perm.read === true && perm.create === false && perm.update === false && perm.delete === false;
        }
        
        // For CRUD features, all permissions should be true
        return perm.create === true && perm.read === true && perm.update === true && perm.delete === true;
      });

      if (hasAllPermissions && data.permissions.length > 0) {
        toast.error("Cannot create a role with all permissions. This would effectively create a SuperAdmin role.")
        return;
      }

      // Validate that if loginAsUser read is checked, customers read must also be checked
      const loginAsUserPermission = data.permissions.find((p) => p.feature === 'loginAsUser')
      const customersPermission = data.permissions.find((p) => p.feature === 'customers')
      
      if (loginAsUserPermission?.read === true) {
        if (!customersPermission || customersPermission.read !== true) {
          toast.error("Login as User requires Customers Read permission. Please enable Customers Read permission.")
          return
        }
      }

      // Ensure read-only features have correct permission structure
      // Ensure categories and products read are always true (public APIs)
      const sanitizedPermissions = data.permissions.map((perm) => {
        const featureKey = perm.feature;
        
        // For read-only features (dashboard, analytics, loginAsUser),
        // ensure create/update/delete are always false
        if (['dashboard', 'analytics', 'loginAsUser'].includes(featureKey)) {
          return {
            feature: featureKey,  // Use feature key as-is from API
            create: false,
            read: perm.read,
            update: false,
            delete: false,
          };
        }
        
        // For categories and products, ensure read is always true (public APIs)
        if (featureKey === 'categories' || featureKey === 'products') {
          return {
            ...perm,
            read: true,  // Always true for public APIs
          };
        }
        
        // For other CRUD features, use all values as-is
        return perm;
      });

      const payload = {
        name: data.name,
        description: data.description,
        status: data.status,  // Already boolean
        permissions: sanitizedPermissions,
      };

      console.log('Submitting role payload:', JSON.stringify(payload, null, 2));

      if (role) {
        // Check if updating existing SuperAdmin role
        if (role.name.toLowerCase() === 'superadmin') {
          toast.error("Cannot update SuperAdmin role. SuperAdmin is a protected system role.")
          return;
        }
        
        // Update existing role
        await updateRole({ id: role._id, data: payload }).unwrap()
        toast.success("Role updated successfully")
      } else {
        // Create new role
        await createRole(payload).unwrap()
        toast.success("Role created successfully")
      }
      onSuccess()
    } catch (error: any) {
      console.error('Role submission error:', error);
      toast.error(error?.data?.message || "Failed to save role")
    }
  }

  const isSubmitting = isCreating || isUpdating
  
  // Watch permissions outside the map to avoid re-render issues
  const watchedPermissions = form.watch('permissions') || []
  
  // Debug logging
  console.log('Watched Permissions:', watchedPermissions)
  console.log('Features:', features.map(f => ({ key: f.key, name: f.name })))
  console.log('Form values:', form.getValues())
  
  // Ensure permissions are initialized if they're empty (fallback safety check)
  // Only run if not already initialized by the main useEffect
  useEffect(() => {
    if (!isInitialized && features.length > 0) {
      const currentPermissions = form.getValues('permissions') || []
      if (currentPermissions.length === 0 && !role) {
        const initialPermissions = features
          .filter((feat) => feat.key)
          .map((feat) => ({
            feature: feat.key || '',
            create: false,
            read: false,
            update: false,
            delete: false,
          }))
        if (initialPermissions.length > 0) {
          console.log('Initializing empty permissions (fallback):', initialPermissions)
          form.setValue('permissions', initialPermissions, { shouldValidate: false })
          setIsInitialized(true)
        }
      }
    }
  }, [features.length, isInitialized, role?._id])

  if (isFeaturesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffb729]" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form id="role-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Customer Support" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>A unique name for this role.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the permissions and responsibilities of this role" 
                    {...field} 
                    disabled={isSubmitting}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>A clear description of what this role can do.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Inactive roles cannot be assigned to new users
                  </FormDescription>
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

        {/* Permissions Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Permissions</h3>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {features
                .filter((feat) => feat.key) // Filter out features without keys
                .map((feat) => {
                  // Ensure we have a valid feature key
                  const featureKey = feat.key || ''
                  
                  // Find permission for this specific feature only - use strict equality
                  const permission = watchedPermissions.find((p) => p.feature === featureKey)
                  
                  return (
                    <Card key={featureKey}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {feat.name}
                        {feat.isReadOnly && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(View Only Access)</span>
                        )}
                      </CardTitle>
                      {feat.description && (
                        <CardDescription className="text-sm">{feat.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        {feat.allowedActions.includes('create') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${featureKey}-create`}
                              checked={permission?.create || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(featureKey, 'create', checked as boolean)
                              }
                              disabled={isSubmitting}
                            />
                            <label 
                              htmlFor={`${featureKey}-create`} 
                              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Create
                            </label>
                          </div>
                        )}
                        {feat.allowedActions.includes('read') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${featureKey}-read`}
                              checked={permission?.read || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(featureKey, 'read', checked as boolean)
                              }
                              disabled={isSubmitting || (permission?.update === true || permission?.delete === true) || (featureKey === 'categories' || featureKey === 'products') || (featureKey === 'customers' && watchedPermissions.find((p) => p.feature === 'loginAsUser')?.read === true)}
                            />
                            <label 
                              htmlFor={`${featureKey}-read`} 
                              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Read {feat.isReadOnly && <span className="text-xs text-muted-foreground">(View Only)</span>}
                              {(featureKey === 'categories' || featureKey === 'products') && (
                                <span className="ml-1 text-xs text-muted-foreground">(Public)</span>
                              )}
                              {(permission?.update === true || permission?.delete === true) && (
                                <span className="ml-1 text-xs text-muted-foreground">(Required)</span>
                              )}
                              {(featureKey === 'customers' && watchedPermissions.find((p) => p.feature === 'loginAsUser')?.read === true) && (
                                <span className="ml-1 text-xs text-muted-foreground">(Required for Login as User)</span>
                              )}
                            </label>
                          </div>
                        )}
                        {feat.allowedActions.includes('update') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${featureKey}-update`}
                              checked={permission?.update || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(featureKey, 'update', checked as boolean)
                              }
                              disabled={isSubmitting}
                            />
                            <label 
                              htmlFor={`${featureKey}-update`} 
                              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Update
                            </label>
                          </div>
                        )}
                        {feat.allowedActions.includes('delete') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${featureKey}-delete`}
                              checked={permission?.delete || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(featureKey, 'delete', checked as boolean)
                              }
                              disabled={isSubmitting}
                            />
                            <label 
                              htmlFor={`${featureKey}-delete`} 
                              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Delete
                            </label>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </form>
    </Form>
  )
}
