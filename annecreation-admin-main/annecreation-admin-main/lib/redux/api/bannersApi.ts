import { baseApi } from './baseApi'

// Banner structure
export interface Banner {
  _id: string
  title: string
  description?: string
  sortOrder?: number
  mobileImages?: string[]
  websiteImages?: string[]
  createdAt: string
  deviceType: 'mobile' | 'web' 
  updatedAt?: string
}

// Map backend -> frontend
const mapFromApi = (item: any): Banner => ({
  _id: item._id,
  title: item.title,
  description: item.description,
  sortOrder: item.sortOrder,
  mobileImages: item.mobileImages || [],
  websiteImages: item.websiteImages || [],
  createdAt: item.createdAt,
  deviceType: item.deviceType, 
  updatedAt: item.updatedAt,
})

// --- API Endpoints ---
export const bannersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Fetch all banners
    getBanners: builder.query<Banner[], void>({
      query: () => 'api/banners',
      transformResponse: (response: { data: { data: any[] } }) =>
        response.data.data.map(mapFromApi),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Banners' as const, id: _id })),
              { type: 'Banners', id: 'LIST' },
            ]
          : [{ type: 'Banners', id: 'LIST' }],
    }),

    // Create a new banner
    createBanner: builder.mutation<Banner, Partial<Banner>>({
      query: (body) => ({
        url: '/api/banners',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => mapFromApi(response.data),
      invalidatesTags: [{ type: 'Banners', id: 'LIST' }],
    }),

    // Update an existing banner
    updateBanner: builder.mutation<Banner, { id: string; body: Partial<Banner> }>({
      query: ({ id, body }) => ({
        url: `api/banners/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: any }) => mapFromApi(response.data),
      invalidatesTags: (result, error, { id }) => [{ type: 'Banners', id }],
    }),

    // Delete a banner
    deleteBanner: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `api/banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Banners', id }, { type: 'Banners', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannersApi
