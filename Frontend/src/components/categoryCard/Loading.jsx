'use client';
import React from 'react';

const CategoryCardSkeleton = ({ shape = 'square', count = 4 }) => {
  const isCircle = shape === 'circle';

  const wrapperSize = isCircle ? 150 : 203;
  const containerSize = isCircle ? 120 : 203;

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="text-center mx-3" style={{ width: wrapperSize }}>
          {/* Image Placeholder */}
          <div
            className={`mx-auto bg-gray-200 animate-pulse flex items-center justify-center ${
              isCircle ? 'rounded-full' : 'rounded-md'
            }`}
            style={{
              width: containerSize,
              height: containerSize,
            }}
          >
            <div
              className={`bg-gray-300 ${isCircle ? 'rounded-full' : 'rounded-md'}`}
              style={{
                width: isCircle ? 80 : 150,
                height: isCircle ? 80 : 150,
              }}
            />
          </div>

          {/* Text Placeholder */}
          <div className="mt-2 h-5 w-24 bg-gray-200 mx-auto rounded animate-pulse" />
          <div className="mt-1 h-4 w-32 bg-gray-200 mx-auto rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default CategoryCardSkeleton;
