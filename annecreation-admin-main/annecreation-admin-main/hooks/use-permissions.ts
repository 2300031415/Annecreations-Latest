import { useMemo } from 'react';
import { useProfile } from '@/contexts/profile-context';

export interface Permission {
    feature: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export interface UserWithPermissions {
    id: string;
    username: string;
    email: string;
    isSuperAdmin?: boolean;
    role?: {
        _id: string;
        name: string;
        permissions: Permission[];
    };
}

/**
 * Hook to check user permissions for RBAC
 * Uses profile from context (fetched from /api/admin/profile) instead of localStorage
 * @returns Object with permission checking functions
 */
export const usePermissions = () => {
    const { profile, isLoading } = useProfile();

    // Transform profile to UserWithPermissions format
    const user: UserWithPermissions | null = useMemo(() => {
        if (!profile) return null;
        
        return {
            id: profile.id,
            username: profile.username,
            email: profile.email,
            isSuperAdmin: profile.isSuperAdmin,
            role: profile.role ? {
                _id: profile.role._id,
                name: profile.role.name,
                permissions: profile.role.permissions || [],
            } : undefined,
        };
    }, [profile]);

    // Debug logging
    // if (typeof window !== 'undefined') {
    //     console.log('usePermissions - Profile data:', profile);
    //     console.log('usePermissions - User data:', user);
    //     console.log('usePermissions - isSuperAdmin:', user?.isSuperAdmin);
    //     console.log('usePermissions - Role:', user?.role);
    //     console.log('usePermissions - Permissions:', user?.role?.permissions);
    // }

    const isSuperAdmin = useMemo(() => {
        return user?.isSuperAdmin === true;
    }, [user]);

    const permissions = useMemo(() => {
        return user?.role?.permissions || [];
    }, [user]);

    /**
     * Check if user has a specific permission for a feature
     * @param feature - The feature key (e.g., 'products', 'orders')
     * @param action - The action to check ('create', 'read', 'update', 'delete')
     * @returns boolean
     */
    const hasPermission = (feature: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
        // SuperAdmin has all permissions
        if (isSuperAdmin) return true;

        // Find the permission for the feature
        const permission = permissions.find((p) => p.feature === feature);

        // Check if the action is allowed
        return permission?.[action] === true;
    };

    /**
     * Check if user can create resources for a feature
     */
    const canCreate = (feature: string): boolean => {
        return hasPermission(feature, 'create');
    };

    /**
     * Check if user can read/view resources for a feature
     */
    const canRead = (feature: string): boolean => {
        return hasPermission(feature, 'read');
    };

    /**
     * Check if user can update resources for a feature
     */
    const canUpdate = (feature: string): boolean => {
        return hasPermission(feature, 'update');
    };

    /**
     * Check if user can delete resources for a feature
     */
    const canDelete = (feature: string): boolean => {
        return hasPermission(feature, 'delete');
    };

    /**
     * Check if user has any permission for a feature
     */
    const hasAnyPermission = (feature: string): boolean => {
        if (isSuperAdmin) return true;
        
        const permission = permissions.find((p) => p.feature === feature);
        return !!(permission?.create || permission?.read || permission?.update || permission?.delete);
    };

    /**
     * Get all features the user has access to
     */
    const getAccessibleFeatures = (): string[] => {
        if (isSuperAdmin) {
            return ['dashboard', 'products', 'categories', 'orders', 'customers', 'coupons', 'analytics', 'loginAsUser'];
        }

        return permissions
            .filter((p) => p.read || p.create || p.update || p.delete)
            .map((p) => p.feature);
    };

    return {
        isSuperAdmin,
        permissions,
        hasPermission,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        hasAnyPermission,
        getAccessibleFeatures,
        isLoading,
    };
};

