import { baseApi } from "./baseApi";

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: boolean;
  newsletter: boolean;
  emailVerified: boolean;
  mobileVerified: boolean;
  createdAt: string;
  totalOrderAmount?: number;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: boolean;
  newsletter: boolean;
}

export interface CustomerQueryParams extends PaginationParams {
  search?: string;
  searchField?: "all" | "firstName" | "email" | "mobile";
  sortBy?: "firstName" | "createdAt" | "totalOrderAmount";
  sortOrder?: "asc" | "desc";
  status?: string[];
}

export interface PaginatedResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse, CustomerQueryParams>({
      query: (params = { page: 1, limit: 20 }) => {
        let searchQuery = params.search;

        if (params.searchField === "mobile" && searchQuery) {
          // Remove all non-digit characters
          searchQuery = searchQuery.replace(/\D/g, "");

          let queries: string[] = [searchQuery];

          // If starts with 63 → try without it
          if (searchQuery.startsWith("63")) {
            queries.push(searchQuery.substring(2));
          }

          // If starts with 0 → also try without leading zero
          if (searchQuery.startsWith("0")) {
            queries.push(searchQuery.substring(1));
          }

          // Remove duplicates
          queries = [...new Set(queries)];

          // Send both versions to backend (comma-separated string)
          searchQuery = queries.join(",");
        }

        const queryParams = {
          page: params.page,
          limit: params.limit,
          search: searchQuery,
          searchField: params.searchField,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          status: params.status?.join(","),
        };

        return {
          url: "/api/customers",
          params: queryParams,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Customers" as const,
                id: _id,
              })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    createCustomer: builder.mutation<Customer, CustomerFormData | FormData>({
      query: (body) => {
        const isFormData = body instanceof FormData;
        return {
          url: "/api/customers",
          method: "POST",
          body,
          headers: isFormData
            ? undefined
            : { "Content-Type": "application/json" },
        };
      },
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<Customer, { id: string; body: any }>({
      query: ({ id, body }) => {
        const isFormData = body instanceof FormData;
        return {
          url: `/api/customers/${id}`,
          method: "PUT",
          body,
          headers: isFormData
            ? {}
            : { "Content-Type": "application/json" },
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),

    loginAsCustomer: builder.mutation<
      {
        customer: Customer;
        accessToken: string;
        refreshToken: string;
        isAdminSession: boolean;
        adminContext: {
          adminId: string;
          adminUsername: string;
        };
      },
      string
    >({
      query: (customerId) => ({
        url: "/api/admin/login-as-user",
        method: "POST",
        body: { customerId },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useLoginAsCustomerMutation,
} = customersApi;
