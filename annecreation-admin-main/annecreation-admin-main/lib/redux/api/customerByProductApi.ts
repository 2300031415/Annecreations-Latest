import { baseApi } from "./baseApi";

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: boolean;
  newsletter: boolean;
  createdAt: string;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Pass search text (productModel) dynamically
    getCustomersByProduct: builder.query<Customer[], string>({
      query: (productModel) =>
        `/api/orders/admin/customers-by-product?productModel=${productModel}`,
    }),
  }),
});

export const { useGetCustomersByProductQuery } = customerApi;
