'use client';

import React, { useMemo } from 'react';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';

const DesignList = ({ products, isLoading, error, cardSize = 'large', hasMore, loaderRef, showQuickView = false }) => {
  if (error) return <p className="text-red-500">Failed to load products.</p>;
  if (!products || products.length === 0) return <p className="text-gray-500">No products found.</p>;



  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3  gap-x-4 md:gap-y-4 place-items-center'>
        {products.map((item,) => (
          <ArrivalCard key={item._id} item={item} cardSize={cardSize} showQuickView={showQuickView} />
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef}>
          {isLoading && <ArrivalCardSkeleton count={6} columns="grid-cols-1 md:grid-cols-3" />}
        </div>
      )}
    </>
  );
};

export default React.memo(DesignList);
