'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/Store/authStore';
import { MdPictureAsPdf } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

const CategoryCard = ({ item, shape = 'square' }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isCircle = shape === 'circle';

  // Sizes scale based on shape
  const containerSize = isCircle ? 120 : 150;
  const imageSize = isCircle ? 80 : 164;

  const handleClick = () => {
    router.push(`/design?category=${encodeURIComponent(item.name)}`);
  };

  const imageSrc = item?.image ? `${API_URL}/${item.image}` : '/assets/butterflyimg.png';

  return (
    <div
      className={`flex flex-col items-center text-center cursor-pointer mx-auto transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) hover:-translate-y-3 hover:scale-105
        ${!isCircle ? 'w-full max-w-[220px] sm:max-w-[200px] md:max-w-[220px]' : ''}`}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div
        className={`flex justify-center bg-[var(--secondary)]
          ${isCircle ? 'rounded-2xl border-2 border-[var(--primary)]' : 'rounded-md'}`}
        style={{
          width: imageSize,
          height: imageSize,
        }}
      >
        <Image
          src={imageSrc}
          alt={item?.description || 'Category image'}
          width={imageSize}
          height={imageSize}
          className="px-2"
        />
      </div>

      {/* Category Name */}
      <p className="mt-2 font-semibold text-md text-[var(--secondary)] break-words">
        {item?.name}
      </p>

      {/* Product Count */}
      <p className="mb-3 text-md font-bold">
        <span className="gradient-text">{item?.product_count} {t('home.designs', 'designs')}</span>
      </p>


    </div>
  );
};

export default CategoryCard;
