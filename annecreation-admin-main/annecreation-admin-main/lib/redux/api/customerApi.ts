import { baseApi } from './baseApi';

// Customer interfaces
export interface Customer {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    telephone: string;
    status: boolean;
    newsletter: boolean;
    customer_group_id: number;
    date_added: string;
    addresses?: CustomerAddress[];
}

export interface CustomerAddress {
    address_id: number;
    customer_id?: number;
    firstname: string;
    lastname: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country_id: number;
    zone_id: number;
    default?: boolean;
}

// Customer login request/response
export interface CustomerLoginRequest {
    email: string;
    password: string;
}

export interface CustomerLoginResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    customer: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        telephone: string;
        newsletter: boolean;
    };
}

// Customer registration request
export interface CustomerRegisterRequest {
    firstname: string;
    lastname: string;
    email: string;
    telephone: string;
    password: string;
    newsletter: boolean;
    agree: boolean;
}

// Password reset requests
export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    new_password: string;
}

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

// Address requests
export interface AddAddressRequest {
    firstname: string;
    lastname: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country_id: number;
    zone_id: number;
    default?: boolean;
}

export interface UpdateAddressRequest extends AddAddressRequest {
    address_id: number;
}

// Customer filter/pagination params
export interface CustomerFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: boolean;
    group?: number;
    date_from?: string;
    date_to?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface CustomerListResponse {
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Create the customer API
export const customerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public customer endpoints

        // 1. Customer login
        customerLogin: builder.mutation<CustomerLoginResponse, CustomerLoginRequest>({
            query: (credentials) => ({
                url: '/api/customers/login',
                method: 'POST',
                body: credentials,
                credentials: 'include',
            }),
            // Handle success by storing tokens
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;

                    // Store tokens in localStorage
                    if (data.accessToken) {
                        localStorage.setItem('customerAccessToken', data.accessToken);
                    }
                    if (data.refreshToken) {
                        localStorage.setItem('customerRefreshToken', data.refreshToken);
                    }

                    // Store customer data
                    if (data.customer) {
                        localStorage.setItem('customer', JSON.stringify(data.customer));
                    }
                } catch (error) {
                    console.error('Customer login failed:', error);
                }
            },
            invalidatesTags: ['Auth'],
        }),

        // 2. Customer registration
        registerCustomer: builder.mutation<{ message: string, customer: Customer }, CustomerRegisterRequest>({
            query: (userData) => ({
                url: '/api/customers/register',
                method: 'POST',
                body: userData,
            }),
        }),

        // 3. Forgot password
        forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
            query: (data) => ({
                url: '/api/customers/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),

        // 4. Reset password
        resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
            query: (data) => ({
                url: '/api/customers/reset-password',
                method: 'POST',
                body: data,
            }),
        }),

        // Customer authenticated endpoints

        // 5. Get customer profile
        getCustomerProfile: builder.query<Customer, void>({
            query: () => ({
                url: '/api/customers/profile',
                method: 'GET',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            providesTags: ['Auth'],
        }),

        // 6. Update customer profile
        updateCustomerProfile: builder.mutation<
            { message: string, customer: Customer },
            Partial<Omit<Customer, 'id' | 'email'>>
        >({
            query: (data) => ({
                url: '/api/customers/profile',
                method: 'PUT',
                body: data,
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            invalidatesTags: ['Auth'],
        }),

        // 7. Change customer password
        changeCustomerPassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
            query: (data) => ({
                url: '/api/customers/change-password',
                method: 'POST',
                body: data,
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
        }),

        // Address endpoints

        // Add customer address
        addCustomerAddress: builder.mutation<{ message: string, address: CustomerAddress }, AddAddressRequest>({
            query: (data) => ({
                url: '/api/customers/address',
                method: 'POST',
                body: data,
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            invalidatesTags: ['Auth'],
        }),

        // Update customer address
        updateCustomerAddress: builder.mutation<{ message: string, address: CustomerAddress }, UpdateAddressRequest>({
            query: (data) => ({
                url: `/api/customers/address/${data.address_id}`,
                method: 'PUT',
                body: data,
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            invalidatesTags: ['Auth'],
        }),

        // Delete customer address
        deleteCustomerAddress: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/api/customers/address/${id}`,
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            invalidatesTags: ['Auth'],
        }),

        // Set default address
        setDefaultAddress: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/api/customers/address/${id}/default`,
                method: 'POST',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('customerAccessToken')}`,
                },
            }),
            invalidatesTags: ['Auth'],
        }),

        // Admin customer management endpoints

        // 8. Get all customers (admin)
        getCustomers: builder.query<CustomerListResponse, CustomerFilters>({
            query: (params) => ({
                url: '/api/customers',
                method: 'GET',
                params,
                credentials: 'include',
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.customers.map(({ id }) => ({
                            type: 'Customers' as const,
                            id,
                        })),
                        { type: 'Customers', id: 'LIST' },
                    ]
                    : [{ type: 'Customers', id: 'LIST' }],
        }),

        // 9. Get customer by ID (admin)
        getCustomerById: builder.query<Customer, number>({
            query: (id) => ({
                url: `/api/customers/${id}`,
                method: 'GET',
                credentials: 'include',
            }),
            providesTags: (_, __, id) => [{ type: 'Customers', id }],
        }),

        // 10. Create customer (admin)
        createCustomer: builder.mutation<
            { message: string, customer: Customer },
            Omit<Customer, 'id' | 'date_added'> & { password: string; confirmPassword?: string }
        >({
            query: (data) => ({
                url: '/api/customers',
                method: 'POST',
                body: data,
                credentials: 'include',
            }),
            invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
        }),

        // 11. Update customer (admin)
        updateCustomer: builder.mutation<
            { message: string, customer: Customer },
            { id: number; data: Partial<Customer> & { password?: string; confirmPassword?: string } }
        >({
            query: ({ id, data }) => ({
                url: `/api/customers/${id}`,
                method: 'PUT',
                body: data,
                credentials: 'include',
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: 'Customers', id },
                { type: 'Customers', id: 'LIST' },
            ],
        }),

        // 12. Delete customer (admin)
        deleteCustomer: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/api/customers/${id}`,
                method: 'DELETE',
                credentials: 'include',
            }),
            invalidatesTags: (_, __, id) => [
                { type: 'Customers', id },
                { type: 'Customers', id: 'LIST' },
            ],
        }),
    }),
    overrideExisting: true,
});

// Export hooks for usage in components
export const {
    // Public customer hooks
    useCustomerLoginMutation,
    useRegisterCustomerMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,

    // Customer authenticated hooks
    useGetCustomerProfileQuery,
    useUpdateCustomerProfileMutation,
    useChangeCustomerPasswordMutation,

    // Address hooks
    useAddCustomerAddressMutation,
    useUpdateCustomerAddressMutation,
    useDeleteCustomerAddressMutation,
    useSetDefaultAddressMutation,

    // Admin customer management hooks
    useGetCustomersQuery,
    useGetCustomerByIdQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = customerApi; 