'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { FaShareAlt } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import FullImageView from './FullImageView';

const ProductImage = ({ item, apiUrl }) => {
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.sku, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      enqueueSnackbar('Link copied to clipboard!', { variant: 'success' });
    }
  };

  return (
    <div className="w-full lg:w-1/3 flex justify-center overflow-hidden rounded-md relative cursor-pointer">
      <Image
        src={`${apiUrl}/${item.image}`}
        alt={item.design || 'Design Image'}
        width={300}
        height={200}
        className="object-cover transition-transform duration-200 ease-out"
        onClick={() => setOpen(true)}
      />
      <button
        onClick={handleShare}
        className="absolute top-2 right-2 text-[var(--primary)] hover:text-[#996E19]"
      >
        <FaShareAlt />
      </button>
      {open && <FullImageView open={open} onClose={() => setOpen(false)} src={`${apiUrl}/${item.image}`} alt={item.design || 'Design'} />}
    </div>
  );
};

export default ProductImage;
