import { baseApi } from './baseApi';
import { updateSession } from '@/lib/auth';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface AuthResponse {
    message?: string;
    admin: {
        id: string;
        username: string;
        name: string;
        email: string;
        isAdmin: boolean;
        isSuperAdmin?: boolean;
        deviceType: string;
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
    };
    accessToken: string;
    refreshToken: string;
}

export interface AdminProfile {
    id: string;
    username: string;
    name: string;
    email: string;
    image: string;
    status: boolean;
    isSuperAdmin: boolean;
    role?: {
        _id?: string; // Optional since API response may not include it
        name: string;
        permissions: Array<{
            feature: string;
            create: boolean;
            read: boolean;
            update: boolean;
            delete: boolean;
        }>;
    };
    createdAt: string;
    updatedAt: string;
}

export interface UpdateAdminProfileRequest {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    status: boolean;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
}

export interface MessageResponse {
    message: string;
    success: boolean;
}

// Create auth API endpoints
export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Login endpoint
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/api/admin/login',
                method: 'POST',
                body: credentials,
                credentials: 'include',
            }),
            // Handle success by storing tokens
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    // Use updateSession to store tokens and user data
                    if (data.accessToken && data.admin) {
                        // Ensure isSuperAdmin flag is present
                        const adminData = {
                            ...data.admin,
                            isSuperAdmin: data.admin.isSuperAdmin || false,
                        };
                        updateSession(
                            data.accessToken, 
                            data.refreshToken, 
                            adminData
                        );
                    }
                } catch (error) {
                    console.error('Login failed:', error);
                }
            },
            invalidatesTags: ['Auth'],
        }),

        // Register endpoint
        // register: builder.mutation<AuthResponse, RegisterRequest>({
        //     query: (userData) => ({
        //         url: '/api/register',
        //         method: 'POST',
        //         body: userData,
        //         credentials: 'include',
        //     }),
        //     invalidatesTags: ['Auth'],
        // }),

        // Forgot password endpoint
        forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),

        // Reset password endpoint
        resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
        }),

        // Refresh token endpoint
        refreshToken: builder.mutation<TokenResponse, void>({
            query: () => {
                // Get the refresh token from localStorage
                const refreshToken = localStorage.getItem('refreshToken');

                return {
                    url: '/api/admin/refresh-token',
                    method: 'POST',
                    body: { refreshToken },
                    credentials: 'include',
                };
            },
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (data.accessToken) {
                        updateSession(data.accessToken, data.refreshToken);
                    }
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/admin';
                    }
                }
            },
        }),

        // Logout endpoint
        logout: builder.mutation<MessageResponse, void>({
            query: () => {
                const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                
                return {
                    url: '/api/admin/logout',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    credentials: 'include',
                };
            },
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Clear all stored tokens and user data after successful logout
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                    }
                } catch (error) {
                    console.error('Logout failed:', error);
                    // Even if API fails, clear local storage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                    }
                }
            },
            invalidatesTags: ['Auth'],
        }),

        // Get current user profile
        getCurrentUser: builder.query<AuthResponse['admin'], void>({
            query: () => ({
                url: '/auth/me',
                method: 'GET',
                credentials: 'include',
            }),
            providesTags: ['Auth'],
        }),

        // Get admin profile
        getAdminProfile: builder.query<AdminProfile, void>({
            query: () => ({
                url: '/api/admin/profile',
                method: 'GET',
                credentials: 'include',
            }),
            providesTags: ['Auth', 'AdminProfile'],
            // Transform response to match AdminProfile interface
            transformResponse: (response: any) => {
                // Handle both wrapped and direct response formats
                const profileData = response.data || response;
                
                return {
                    id: profileData.id || profileData._id || '',
                    username: profileData.username || '',
                    name: profileData.name || '',
                    email: profileData.email || '',
                    image: profileData.image || '',
                    status: profileData.status ?? true,
                    isSuperAdmin: profileData.isSuperAdmin || false,
                    role: profileData.role ? {
                        _id: profileData.role._id || profileData.role.id || '', // Role may not have _id in response
                        name: profileData.role.name || '',
                        permissions: profileData.role.permissions || [],
                    } : undefined,
                    createdAt: profileData.createdAt || '',
                    updatedAt: profileData.updatedAt || '',
                };
            },
        }),

        // Update admin profile
        updateAdminProfile: builder.mutation<
            { message: string; admin: AdminProfile },
            { id: string; data: UpdateAdminProfileRequest }
        >({
            query: ({ id, data }) => ({
                url: `/api/admin/${id}/update`,
                method: 'PUT',
                body: data,
                credentials: 'include',
            }),
            invalidatesTags: ['Auth', 'AdminProfile'],
        }),

        // Change admin password
        changeAdminPassword: builder.mutation<
            { message: string },
            ChangePasswordRequest
        >({
            query: (data) => ({
                url: '/api/admin/change-password',
                method: 'POST',
                body: data,
                credentials: 'include',
            }),
        }),
    }),
});

// Export the generated hooks
export const {
    useLoginMutation,
    // useRegisterMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useGetAdminProfileQuery,
    useUpdateAdminProfileMutation,
    useChangeAdminPasswordMutation,
} = authApi;
