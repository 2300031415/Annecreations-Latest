import { baseApi } from './baseApi';

// Types for Role Management
export interface Permission {
    feature: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export interface Role {
    _id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    status: boolean | 'active' | 'inactive';  // Backend uses boolean, but support string for backward compatibility
    createdBy?: {
        _id: string;
        username: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Feature {
    key: string;       // API returns "key" as the feature identifier
    name: string;
    description?: string;
    allowedActions: string[];
    isReadOnly: boolean;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
    permissions: Permission[];
    status?: boolean;
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string;
    permissions?: Permission[];
    status?: boolean;
}

export interface RolesListResponse {
    success: boolean;
    data: Role[];  // API returns roles array directly in data
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface RoleResponse {
    success: boolean;
    data: Role;
}

export interface FeaturesResponse {
    success: boolean;
    data: {
        features: Feature[];  // Features are nested in data.features
    };
    message?: string;
}

export interface RoleAdminsResponse {
    success: boolean;
    data: {
        admins: Array<{
            _id: string;
            username: string;
            email: string;
            firstName?: string;
            lastName?: string;
            status: string;
        }>;
    };
}

// Create roles API endpoints
export const rolesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all roles with pagination
        getRoles: builder.query<RolesListResponse, { page?: number; limit?: number; search?: string }>({
            query: ({ page = 1, limit = 20, search = '' }) => ({
                url: '/api/roles',
                params: { page, limit, search },
            }),
            providesTags: ['Roles'],
            transformResponse: (response: any) => {
                console.log('Roles API Response:', response);
                return response;
            },
        }),

        // Get available features for role creation
        getFeatures: builder.query<FeaturesResponse, void>({
            query: () => '/api/roles/features',
            transformResponse: (response: any) => {
                console.log('Features API Response:', response);
                // Transform features to match expected structure
                if (response?.data?.features) {
                    return {
                        success: response.success,
                        data: {
                            features: response.data.features.map((feat: any) => ({
                                key: feat.feature,  // Map 'feature' field to 'key'
                                name: feat.name,
                                description: feat.description,
                                allowedActions: feat.allowedActions || [],
                                isReadOnly: feat.allowedActions?.length === 1 && feat.allowedActions[0] === 'read',
                            })),
                        },
                        message: response.message,
                    };
                }
                return response;
            },
        }),

        // Get single role by ID
        getRoleById: builder.query<RoleResponse, string>({
            query: (id) => `/api/roles/${id}`,
            providesTags: ['Roles'],
        }),

        // Create new role
        createRole: builder.mutation<RoleResponse, CreateRoleRequest>({
            query: (data) => ({
                url: '/api/roles',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Roles'],
        }),

        // Update existing role
        updateRole: builder.mutation<RoleResponse, { id: string; data: UpdateRoleRequest }>({
            query: ({ id, data }) => ({
                url: `/api/roles/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Roles'],
        }),

        // Delete role
        deleteRole: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/api/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Roles'],
        }),

        // Get admins assigned to a role
        getRoleAdmins: builder.query<RoleAdminsResponse, string>({
            query: (roleId) => `/api/roles/${roleId}/admins`,
            providesTags: ['Roles', 'Admins'],
        }),
    }),
});

// Export hooks
export const {
    useGetRolesQuery,
    useGetFeaturesQuery,
    useGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetRoleAdminsQuery,
} = rolesApi;

