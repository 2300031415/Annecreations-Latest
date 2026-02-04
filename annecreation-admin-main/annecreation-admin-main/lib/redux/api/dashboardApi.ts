import { baseApi } from './baseApi'

/* ------------------ Existing Interfaces ------------------ */
export interface RecentOrdersResponse {
  count: number
  recentOrders: Array<{
    orderId: number
    orderNumber: number
    customer: {
      name: string
      email: string
      telephone: string
    }
    total: number
    createdAt: string
    status: string
    payment_method: string
    shipping_method: string
    products: Array<{
      product_id: number
      name: string
      model: string
      quantity: number
      price: number
      total: number
    }>
  }>
}

export interface SalesResponse {
  totalSales: number
  period: string
  start_date: string
  end_date: string
}

export interface NewOrdersResponse {
  totalOrders: number
  period: string
  start_date: string
  end_date: string
}

export interface NewCustomersResponse {
  period: string
  startDate: string
  endDate: string
  totalNewCustomers: number
  totalCustomers: number
  customers?: Array<{
    customer_id: number
    name: string
    email: string
    date_added: string
  }>
}

export interface OnlineCustomersResponse {
  totalOnline: number
  customers: Array<{
    customer_id: number
    name: string
    email: string
    last_active: string
  }>
}

export interface YearlyRevenueResponse {
  year: number
  totalRevenue: number
  totalOrders: number
  monthlyData: Array<{
    month: number
    month_name: string
    revenue: number
    orders: number
  }>
}

export interface TopProductsResponse {
  period: string
  start_date: string
  end_date: string
  topProducts: Array<{
    productId: number
    name: string
    sku: string
    image: string
    totalSold: number
    totalRevenue: number
  }>
}

/* ------------------ New Customers API Interface ------------------ */
export interface CustomersResponse {
  data: Array<{
    _id: string
    firstName: string
    lastName: string
    email: string
    mobile: string
    status: boolean
    newsletter: boolean
    emailVerified: boolean
    mobileVerified: boolean
    createdAt: string
    updatedAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/* ------------------ Dashboard API ------------------ */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<SalesResponse, { days: number }>({
      query: ({ days }) => ({
        url: `/api/dashboard/sales?days=${days}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getNewOrders: builder.query<NewOrdersResponse, { days: number }>({
      query: ({ days }) => ({
        url: `/api/dashboard/orders/new?days=${days}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getNewCustomers: builder.query<NewCustomersResponse, void>({
      query: () => ({
        url: `/api/dashboard/customers/new`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getOnlineCustomers: builder.query<OnlineCustomersResponse, void>({
      query: () => ({
        url: `/api/dashboard/customers/online`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getYearlyRevenue: builder.query<YearlyRevenueResponse, { year: number }>({
      query: ({ year }) => ({
        url: `/api/dashboard/revenue/yearly?year=${year}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getTopProducts: builder.query<TopProductsResponse, { days: number; limit: number }>({
      query: ({ days, limit }) => ({
        url: `/api/dashboard/products/top?days=${days}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    getRecentOrders: builder.query<RecentOrdersResponse, { limit: number }>({
      query: ({ limit }) => ({
        url: `/api/dashboard/orders/recent?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    /* ------------------ New API: /api/customers ------------------ */
    getAllCustomers: builder.query<CustomersResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/api/customers?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),
  }),
})

/* ------------------ Export Hooks ------------------ */
export const {
  useGetSalesQuery,
  useGetNewOrdersQuery,
  useGetNewCustomersQuery,
  useGetOnlineCustomersQuery,
  useGetYearlyRevenueQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,
  useGetAllCustomersQuery,
} = dashboardApi
