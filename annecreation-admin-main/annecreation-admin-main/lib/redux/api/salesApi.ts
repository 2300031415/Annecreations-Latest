import { baseApi } from "./baseApi";

export interface SalesResponse {
  period: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalRevenue: number;
}

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<SalesResponse, { dateFrom?: string; dateTo?: string } | void>({
      query: (params) => {
        if (!params?.dateFrom || !params?.dateTo) {
          // No date range selected
          return { url: `/api/dashboard/sales`, method: "GET" };
        }

        const { dateFrom, dateTo } = params;
        return {
          url: `/api/dashboard/sales?dateFrom=${dateFrom}&dateTo=${dateTo}`,
          method: "GET",
        };
      },
      providesTags: ["Sales"],
    }),
  }),
  overrideExisting: true,
});

export const { useGetSalesQuery } = salesApi;
