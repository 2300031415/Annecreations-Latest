'use client';

import React from 'react';

const SkeletonCard = () => {
  return (
    <div
      className="bg-white rounded-lg my-10 px-4 sm:px-6 md:px-8 lg:px-12 py-8 animate-pulse"
      style={{
        boxShadow:
          'rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px',
      }}
    >
      {/* Title */}
      <div className="h-8 w-1/2 bg-gray-300 mx-auto mb-10 rounded"></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Image Placeholder */}
        <div className="w-full h-[300px] bg-gray-300 rounded-md"></div>

        {/* Info Placeholder */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
            <ul className="space-y-3">
              <li className="h-4 w-full bg-gray-300 rounded"></li>
              <li className="h-4 w-5/6 bg-gray-300 rounded"></li>
              <li className="h-4 w-2/3 bg-gray-300 rounded"></li>
              <li className="h-4 w-1/2 bg-gray-300 rounded"></li>
            </ul>
          </div>

          <div className="mt-5 h-10 w-1/2 bg-gray-300 rounded"></div>
        </div>

        {/* Addons Placeholder */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div className="flex items-center gap-3" key={i}>
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
              <div className="h-4 w-1/6 bg-gray-300 rounded"></div>
            </div>
          ))}

          <div className="mt-12 h-10 w-2/3 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
