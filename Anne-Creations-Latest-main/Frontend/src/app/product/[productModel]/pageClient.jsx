'use client';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProductStore } from '@/Store/productStore';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import ProductCard from '@/components/ProductCard/ProductCard';
import { Container } from '@mui/material';
import ArrivalCard from '@/components/Cards/Card';
import ProductSkeleton from '@/components/ProductCard/ProductSkeleton';
import ReviewSection from '@/components/ReviewSection/ReviewSection';
import RecentlyViewed from '@/components/RecentlyViewed';


const ProductPage = () => {

  const { productModel } = useParams();


  const {
    productDetail,
    relatedProducts,
    isProductDetailLoading,
    isRelatedProductsLoading,
    error,
    fetchProductById,
    fetchProductIdRelatedProducts,
  } = useProductStore();

  // Fetch product & related products on mount/change
  useEffect(() => {
    if (productModel) {
      fetchProductById(productModel);
      fetchProductIdRelatedProducts(productModel);

      // Add to recently viewed
      try {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        // Remove if already exists to move to top
        const newViewed = viewed.filter(id => id !== productModel);
        newViewed.unshift(productModel);
        // Keep max 20
        if (newViewed.length > 20) newViewed.pop();
        localStorage.setItem('recentlyViewed', JSON.stringify(newViewed));
      } catch (e) {
        console.error("Error updating recently viewed:", e);
      }
    }
  }, [productModel, fetchProductById, fetchProductIdRelatedProducts]);

  // Scroll to top only after all content is loaded
  useEffect(() => {
    if (!isProductDetailLoading && !isRelatedProductsLoading) {
      // Use 'auto' to avoid jump issues
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [isProductDetailLoading, isRelatedProductsLoading]);

  if (isProductDetailLoading) {
    return (
      <Container className="my-20">
        <ProductSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-20 text-center text-red-500">
        {error}
      </Container>
    );
  }

  if (!productDetail) {
    return (
      <Container className="my-20 text-center text-gray-500">
        Product not found.
      </Container>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">


      <Container className="my-10">
        <ProductCard item={productDetail} />
      </Container>

      <Container className="my-5">
        <h3 className="text-center pb-2 text-2xl font-semibold text-[var(--secondary)] my-0">
          Related Products
        </h3>

        {isRelatedProductsLoading ? (
          <p className="text-center text-gray-500 italic">Loading related products...</p>
        ) : relatedProducts && relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4 place-items-center">
            {relatedProducts.map((item) => (
              <ArrivalCard item={item} key={item._id} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic">
            No related products available.
          </p>
        )}
      </Container>

      <RecentlyViewed />

      {/* Reviews Section */}
      <Container className="my-10">
        <ReviewSection productId={productDetail._id} />
      </Container>
    </div>
  );
};

export default ProductPage;
