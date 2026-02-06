import { baseApi } from './baseApi';

// -------------------- Interfaces --------------------

// Product interface
export interface Product {
    _id: string;
    product_id: number;
    model: string;
    sku: string;
    price: number;
    quantity: number;
    status: boolean;
    categories: number[];
    weight?: number;
    dimensions?: {
        width: number;
        height: number;
        length: number;
    };
    descriptions: Array<{
        language_id: number;
        name: string;
        description: string;
        meta_title?: string;
        meta_description?: string;
        meta_keyword?: string;
    }>;
    date_added: string;
    date_modified?: string;
    __v?: number;
    additional_images?: Array<{
        product_image_id: number;
        image: string;
        sort_order: number;
        _id: string;
    }>;
    attributes?: any[];
    discounts?: any[];
    downloads?: any[];
    file_verification_status?: {
        missing_files: any[];
        total_files: number;
        verified_files: number;
    };
    migration_notes?: any[];
    minimum?: number;
    options?: any[];
    points?: number;
    related_products?: any[];
    shipping?: boolean;
    sort_order?: number;
    special_prices?: any[];
    stores?: any[];
    subtract?: boolean;
    tags?: any[];
    viewed?: number;
}

// Pagination interface
export interface PaginationResponse {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface ProductListResponse {
    products: Product[];
    pagination: PaginationResponse;
}

// Pagination & filter
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface ProductFilters {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: boolean;
    manufacturer_id?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
}

// Product creation
export type ProductCreateRequest = FormData;

// Image upload
export interface ProductImageUploadRequest {
    image: File;
    sort_order?: number;
}

// Category interface
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
}

// -------------------- API Endpoints --------------------

export const productApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // --------- Products ---------
        getProducts: builder.query<ProductListResponse, Partial<PaginationParams & ProductFilters>>({
            query: (params) => ({
                url: '/api/products',
                method: 'GET',
                params: {
                    ...params,
                    page: params.page || 1,
                    limit: params.limit || 10,
                },
                credentials: 'include',
            }),
            providesTags: (result) =>
                result?.products
                    ? [
                        ...result.products.map(({ product_id }) => ({ type: 'Products' as const, id: product_id })),
                        { type: 'Products', id: 'LIST' },
                    ]
                    : [{ type: 'Products', id: 'LIST' }],
        }),

        getProductById: builder.query<Product, { id: string; token?: string }>({
            query: ({ id, token }) => ({
                url: `/api/products/${id}`,
                method: 'GET',
                credentials: 'include',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    accept: 'application/json',
                },
            }),
            providesTags: (_, __, { id }) => [{ type: 'Products', id }],
        }),

        createProduct: builder.mutation<Product, ProductCreateRequest>({
            query: (formData) => ({
                url: '/api/products',
                method: 'POST',
                body: formData,
                credentials: 'include',
            }),
            invalidatesTags: [{ type: 'Products', id: 'LIST' }],
        }),

        updateProduct: builder.mutation<Product, { id: string; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/api/products/${id}`,
                method: 'PUT',
                body: formData,
                credentials: 'include',
                headers: {},
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: 'Products', id },
                { type: 'Products', id: 'LIST' },
            ],
        }),

        deleteProduct: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/api/products/${id}`,
                method: 'DELETE',
                credentials: 'include',
            }),
            invalidatesTags: (_, __, id) => [
                { type: 'Products', id },
                { type: 'Products', id: 'LIST' },
            ],
        }),

        updateProductStatus: builder.mutation<Product, { id: string; status: boolean }>({
            query: ({ id, status }) => ({
                url: `/api/products/${id}/status`,
                method: 'PATCH',
                body: { status },
                credentials: 'include',
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: 'Products', id },
                { type: 'Products', id: 'LIST' },
            ],
        }),

        // --------- Images ---------
        uploadProductImages: builder.mutation<
            { success: boolean; message: string; image: { image_id: number; image: string; sort_order: number } },
            { id: string; formData: FormData }
        >({
            query: ({ id, formData }) => ({
                url: `/api/products/${id}/images`,
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {},
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: 'Products', id },
                { type: 'Products', id: `images-${id}` },
            ],
        }),

        getProductImages: builder.query<
            { images: Array<{ image_id: number; image: string; sort_order: number }> },
            string
        >({
            query: (id) => ({
                url: `/api/products/${id}/images`,
                method: 'GET',
                credentials: 'include',
            }),
            providesTags: (_, __, id) => [{ type: 'Products', id: `images-${id}` }],
        }),

        deleteProductImage: builder.mutation<{ success: boolean }, { productId: string; imageId: number }>({
            query: ({ productId, imageId }) => ({
                url: `/api/products/${productId}/images/${imageId}`,
                method: 'DELETE',
                credentials: 'include',
            }),
            invalidatesTags: (_, __, { productId }) => [
                { type: 'Products', id: `images-${productId}` },
                { type: 'Products', id: productId },
            ],
        }),

        // --------- Analytics ---------
        getProductAnalytics: builder.query<
            {
                totalViews: number;
                totalSales: number;
                conversionRate: number;
                popularityRank: number;
                recentSales: { date: string; count: number }[];
            },
            string
        >({
            query: (id) => `/api/products/${id}/analytics`,
            providesTags: (_, __, id) => [
                { type: 'Products', id },
                { type: 'Analytics', id: `product-${id}` },
            ],
        }),

        // --------- Related Products ---------
        getRelatedProducts: builder.query<ProductListResponse, string>({
            query: (id) => `/api/products/${id}/related`,
            providesTags: (_, __, id) => [{ type: 'Products', id: `related-${id}` }],
        }),
    }),
});

// -------------------- Export Hooks --------------------
export const {
    useGetProductsQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useUpdateProductStatusMutation,
    useUploadProductImagesMutation,
    useGetProductImagesQuery,
    useDeleteProductImageMutation,
    useGetProductAnalyticsQuery,
    useGetRelatedProductsQuery,
} = productApi;
