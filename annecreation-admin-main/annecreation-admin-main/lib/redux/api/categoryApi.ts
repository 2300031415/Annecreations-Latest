import { baseApi } from './baseApi';

// Define category interfaces
export interface Category {
  _id: string;
  name: string;
  description: string;
  image?: string;
  sortOrder: number;
  status: boolean;
  productCount?: number;
  languageId?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeyword?: string;
  };
}

// Create category API endpoints
export const categoryApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<Category[], { include_inactive?: boolean }>({
      query: (params) => ({
        url: '/api/categories',
        method: 'GET',
        params,
        credentials: 'include',
      }),
      providesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    // Search categories
    searchCategories: builder.query<Category[], { q: string; limit?: number }>({
      query: (params) => ({
        url: '/api/categories/search',
        method: 'GET',
        params,
        credentials: 'include',
      }),
      providesTags: [{ type: 'Categories', id: 'SEARCH' }],
    }),

    // Create category
    createCategory: builder.mutation<Category, FormData>({
      query: (formData) => {
        console.log('Creating category with formData:', formData);

        const categoryImageNames: string[] = [];
        const bannerImageNames: string[] = [];
        const thumbnailImageNames: string[] = [];

        formData.forEach((value, key) => {
          if (key === 'categoryImages' && value instanceof File)
            categoryImageNames.push(value.name);
          if (key === 'bannerImages' && value instanceof File)
            bannerImageNames.push(value.name);
          if (key === 'thumbnailImages' && value instanceof File)
            thumbnailImageNames.push(value.name);
          if (key === 'image' && value instanceof File)
            categoryImageNames.push(value.name);
        });

        formData.append(
          'imageNames',
          JSON.stringify({
            categoryImages: categoryImageNames,
            bannerImages: bannerImageNames,
            thumbnailImages: thumbnailImageNames,
          }),
        );

        return {
          url: '/api/categories',
          method: 'POST',
          body: formData,
          credentials: 'include',
        };
      },
      invalidatesTags: [
        { type: 'Categories', id: 'LIST' },
        { type: 'Categories', id: 'TREE' },
        { type: 'Categories', id: 'TOP' },
      ],
    }),

   updateCategory: builder.mutation<Category, { id: string; formData: FormData; seo?: object }>({
  query: ({ id, formData, seo }) => {
    // Ensure SEO is a JSON string
    if (seo) formData.set('seo', JSON.stringify(seo));

    // Optional: log all FormData entries
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    return {
      url: `/api/categories/${id}`,
      method: 'PUT',
      body: formData,
      credentials: 'include',
    };
  },
  invalidatesTags: (result, error, { id }) => [
    { type: 'Categories', id: 'LIST' },
    { type: 'Categories', id: 'TREE' },
    { type: 'Categories', id: 'TOP' },
    { type: 'Categories', id },
  ],
}),

  // Delete category
deleteCategory: builder.mutation<{ success: boolean; id: string }, string>({
  query: (id) => ({
    url: `/api/categories/${id}`,
    method: 'DELETE',
    credentials: 'include',
  }),
  invalidatesTags: (result, error, id) => [
    { type: 'Categories', id: 'LIST' },
    { type: 'Categories', id: 'TREE' },
    { type: 'Categories', id: 'TOP' },
    { type: 'Categories', id },
  ],
}),
  }),

});

// Export hooks for usage in components
export const {
  useGetCategoriesQuery,
  useSearchCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;

