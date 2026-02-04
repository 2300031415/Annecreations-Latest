// lib/redux/api/ordersApi.ts
import { baseApi } from "./baseApi";

// Nested customer info
export interface OrderCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: boolean;
  createdAt: string;
  fullName?: string;
}

// Nested product info
export interface OrderProductOption {
  option: {
    _id: string;
    name: string;
  };
  price: number;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
}

export interface OrderProduct {
  product: {
    _id: string;
    productModel: string;
    sku: string;
    description: string;
    image: string;
  };
  options: OrderProductOption[];
}

// Actual Order structure
export interface Order {
  _id: string;
  customer: OrderCustomer;
  orderStatus: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  products: OrderProduct[];
  product_count: number;
  orderNumber: number;
  source?: string;
  totals: {
    code: string;
    value: number;
    sortOrder: number;
  }[];
  history: {
    orderStatus: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Pagination response interface
export interface OrdersResponse {
  data: Order[];
  pagination: {
    total: number;    // total items
    pages: number;    // total pages
    page: number;     // current page
    limit: number;    // items per page
  };
}


// Query parameters interface
export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: 'all' | 'id' | 'customer' | 'email' | 'phone' | 'razorpayOrderId';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  paymentCode?: string;
}

// Update order status request interface
export interface UpdateOrderStatusRequest {
  orderStatus: string;
  comment?: string;
  notify?: boolean;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<OrdersResponse, OrdersQueryParams>({
      query: (params) => ({
        url: "api/orders/admin/all",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search,
          searchField: params.searchField,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          status: params.status
            ? Array.isArray(params.status)
              ? params.status.join(",")
              : params.status
            : undefined,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          paymentCode: params.paymentCode,
        },
      }),
      transformResponse: (response: any): OrdersResponse => ({
        data: response.data,
        pagination: {
          total: response.pagination.total,
          pages: response.pagination.pages,
          page: response.pagination.page,
          limit: response.pagination.limit,
        },
      }),

      providesTags: ["Orders"],
    }),

    updateOrderStatus: builder.mutation<{ message: string }, { id: string; data: UpdateOrderStatusRequest }>({
      query: ({ id, data }) => ({
        url: `api/orders/${id}/status`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const { useGetOrdersQuery, useUpdateOrderStatusMutation } = ordersApi;
