import { baseApi } from './baseApi'

// Coupon structure used in the frontend
export interface Coupon {
  _id: string
  name: string
  code: string
  discount: number
  discountType: 'Percentage' | 'Fixed Amount'
  dateStart: string
  dateEnd: string
  status: boolean 
  usageLimit?: number
  usageCount?: number
  minimumSpend?: number
  maxDiscount?: number
   autoApply?: boolean 
  createdAt?: string
  updatedAt?: string
}

// --- Utility Mappers ---
// Backend -> Frontend
const mapFromApi = (item: any): Coupon => ({
  _id: item._id,
  name: item.name,
  code: item.code,
  discount: item.discount,
  discountType: item.type === 'F' ? 'Fixed Amount' : 'Percentage',
  dateStart: item.dateStart,
  dateEnd: item.dateEnd,
  status: !!item.status, // ✅ backend true/false → boolean
  maxDiscount: item.maxDiscount,
   autoApply: !!item.autoApply,
  usageLimit: item.totalUses,
  usageCount: item.customerUses,
  minimumSpend: item.minAmount,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

// Frontend -> Backend
export const mapToApi = (item: Partial<Coupon>) => {
  console.log("mapToApi item.status:", item.status) // <-- log status
  return {
    ...(item._id && { _id: item._id }),
    name: item.name,
    code: item.code,
    discount: item.discount,
    type: item.discountType === 'Fixed Amount' ? 'F' : 'P',
    dateStart: item.dateStart,
    dateEnd: item.dateEnd,
    status: !!item.status, // ✅ always boolean
    totalUses: item.usageLimit,
    autoApply: !!item.autoApply, 
    customerUses: item.usageCount,
    minAmount: item.minimumSpend,
    maxDiscount: item.maxDiscount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

// --- API Endpoints ---
export const couponsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCoupons: builder.query<Coupon[], void>({
      query: () => 'api/coupons',
      transformResponse: (response: { data: any[] }) =>
        response.data.map(mapFromApi),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'Coupons' as const, id: _id })),
            { type: 'Coupons', id: 'LIST' }, // 👈 special tag for the whole list
          ]
          : [{ type: 'Coupons', id: 'LIST' }],
    }),

    getCouponById: builder.query<Coupon, string>({
      query: (id) => `api/coupons/${id}`,
      transformResponse: (response: { data: any }) => mapFromApi(response.data),
      providesTags: (result, error, id) => [{ type: 'Coupons', id }],
    }),

    createCoupon: builder.mutation<Coupon, Partial<Coupon>>({
      query: (body) => ({
        url: 'api/coupons',
        method: 'POST',
        body: mapToApi(body),
      }),
      transformResponse: (response: { data: any }) => mapFromApi(response.data),
      invalidatesTags: [{ type: 'Coupons', id: 'LIST' }],
    }),

    updateCoupon: builder.mutation<Coupon, { id: string; body: Partial<Coupon> }>(
      {
        query: ({ id, body }) => ({
          url: `api/coupons/${id}`,
          method: 'PUT',
          body: mapToApi(body),
        }),
        transformResponse: (response: { data: any }) =>
          mapFromApi(response.data),
        invalidatesTags: (result, error, { id }) => [{ type: 'Coupons', id }],
      }
    ),

    deleteCoupon: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `api/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Coupons', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApi
