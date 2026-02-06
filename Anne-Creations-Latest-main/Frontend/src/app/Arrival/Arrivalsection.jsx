'use client';

import React, { useEffect, useState } from 'react';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import { useProductStore } from '@/Store/productStore';

const Arrivalsection = () => {
  const {
    products,
    fetchProducts,
 
    isProductsLoading,
    error,
  } = useProductStore();

 
  // Fetch base product list
  useEffect(() => {
    fetchProducts();
  }, [])


  return (
    <>
      {/* <p className="w-full text-center gradient-text text-md mb-2 font-bold">
        <span className="gradient-text">New Arrivals</span>
      </p> */}

      <h2 className="text-center font-poppins text-2xl mb-4 md:mb-10 text-[var(--secondary)] font-bold">
        New Arrivals
      </h2>
    
      {isProductsLoading ? <ArrivalCardSkeleton count={10} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-cols-5" />
 : null}
   
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5  gap-x-4 md:gap-y-8 place-items-center">
        {products.map((item) => (
          <ArrivalCard item={item} key={item._id} />
        ))}
      </div>
    </>
  );
};

export default Arrivalsection;
