import { baseApi } from './baseApi';

// Types for Admin User Management
export interface AdminUser {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isSuperAdmin: boolean;
    role?: {
        _id: string;
        name: string;
        permissions: Array<{
            feature: string;
            create: boolean;
            read: boolean;
            update: boolean;
            delete: boolean;
        }>;
    };
    status: boolean | 'active' | 'inactive';  // Backend uses boolean, but support string for backward compatibility
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAdminRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleId: string;
    status?: boolean;  // Backend expects boolean
}

export interface UpdateAdminRequest {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    status?: boolean;  // Backend expects boolean
    newPassword?: string;
    confirmPassword?: string;
}

export interface AssignRoleRequest {
    roleId: string;
}

export interface AdminsListResponse {
    success: boolean;
    data: {
        admins: AdminUser[];
        pagination?: {
            currentPage: number;
            totalPages: number;
            totalAdmins: number;
            limit: number;
        };
    };
}

export interface AdminResponse {
    success: boolean;
    data: AdminUser;
}

export interface AdminPermissionsResponse {
    success: boolean;
    data: {
        isSuperAdmin: boolean;
        permissions: Array<{
            feature: string;
            create: boolean;
            read: boolean;
            update: boolean;
            delete: boolean;
        }>;
    };
}

export interface LoginAsUserRequest {
    customerId: string;
}

export interface LoginAsUserResponse {
    success: boolean;
    data: {
        customer: any;
        accessToken: string;
        refreshToken: string;
    };
}

// Create admin users API endpoints
export const adminUsersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all admin users
        getAllAdmins: builder.query<AdminsListResponse, { page?: number; limit?: number; search?: string }>({
            query: ({ page = 1, limit = 20, search = '' }) => ({
                url: '/api/admin/all',
                params: { page, limit, search },
            }),
            providesTags: ['Admins'],
            transformResponse: (response: any) => {
                console.log('All Admins API Response:', response);
                // Handle both response structures:
                // Backend returns: { data: [...], pagination: {...} } or { success: true, data: { admins: [...] } }
                if (Array.isArray(response?.data)) {
                    // Backend now returns properly formatted data with role, isSuperAdmin, etc.
                    // Just ensure the structure matches expected format
                    const admins = response.data.map((admin: any) => {
                        return {
                            _id: admin._id || admin.id,
                            username: admin.username,
                            firstName: admin.firstName || '',
                            lastName: admin.lastName || '',
                            email: admin.email,
                            status: admin.status,
                            role: admin.role ? {
                                _id: admin.role._id || admin.role.toString(),
                                name: admin.role.name,
                            } : undefined,
                            isSuperAdmin: admin.isSuperAdmin || false,
                            lastLogin: admin.lastLogin || undefined,
                            createdAt: admin.createdAt,
                            updatedAt: admin.updatedAt,
                        };
                    });
                    return {
                        success: true,
                        data: {
                            admins: admins,
                            pagination: response.pagination,
                        },
                    };
                }
                // Already in expected format - ensure admins array exists
                if (response?.data?.admins) {
                    return response;
                }
                // Fallback: wrap in expected structure
                return {
                    success: response?.success ?? true,
                    data: {
                        admins: response?.data || [],
                        pagination: response?.pagination,
                    },
                };
            },
        }),

        // Get admin by ID
        getAdminById: builder.query<AdminResponse, string>({
            query: (id) => `/api/admin/${id}/profile`,
            providesTags: ['Admins'],
            transformResponse: (response: any) => {
                console.log('Get Admin By ID Response:', response);
                // Transform response to ensure consistent structure
                if (response?.data) {
                    const admin = response.data;
                    return {
                        success: response.success,
                        data: {
                            _id: admin._id || admin.id,
                            username: admin.username,
                            firstName: admin.firstName || '',
                            lastName: admin.lastName || '',
                            email: admin.email,
                            status: admin.status,
                            role: admin.role ? {
                                _id: admin.role._id || admin.role.id,
                                name: admin.role.name,
                                permissions: admin.role.permissions,
                            } : undefined,
                            isSuperAdmin: admin.isSuperAdmin || false,
                            lastLogin: admin.lastLogin || undefined,
                            createdAt: admin.createdAt,
                            updatedAt: admin.updatedAt,
                        },
                    };
                }
                return response;
            },
        }),

        // Create new admin user
        createAdmin: builder.mutation<AdminResponse, CreateAdminRequest>({
            query: (data) => ({
                url: '/api/admin',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Admins'],
        }),

        // Update admin user
        updateAdmin: builder.mutation<AdminResponse, { id: string; data: UpdateAdminRequest }>({
            query: ({ id, data }) => ({
                url: `/api/admin/${id}/update`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Admins', 'AdminProfile'],
        }),

        // Delete admin user
        deleteAdmin: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/api/admin/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Admins'],
        }),

        // Assign/Change role for admin
        assignRole: builder.mutation<AdminResponse, { adminId: string; roleId: string }>({
            query: ({ adminId, roleId }) => ({
                url: `/api/admin/${adminId}/role`,
                method: 'PUT',
                body: { roleId },
            }),
            invalidatesTags: ['Admins'],
        }),

        // Get admin's permissions
        getAdminPermissions: builder.query<AdminPermissionsResponse, string>({
            query: (adminId) => `/api/admin/${adminId}/permissions`,
        }),

        // Login as customer (requires permission)
        loginAsUser: builder.mutation<LoginAsUserResponse, LoginAsUserRequest>({
            query: (data) => ({
                url: '/api/admin/login-as-user',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

// Export hooks
export const {
    useGetAllAdminsQuery,
    useGetAdminByIdQuery,
    useCreateAdminMutation,
    useUpdateAdminMutation,
    useDeleteAdminMutation,
    useAssignRoleMutation,
    useGetAdminPermissionsQuery,
    useLoginAsUserMutation,
} = adminUsersApi;

