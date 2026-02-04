'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@mui/material';
import { API_URL } from '@/Store/authStore';
import useWishlist from '@/hook/useWishlist';

const WishListCard = ({ item, isSelected, onSelect }) => {
  const router = useRouter();
  const { removeFromWishlist } = useWishlist();

  const displayedPrice = item.options && item.options.length > 0
    ? item.options[0].price
    : item.price || 0;

  const handleViewDetails = () => {
    router.push(`/product/${item.productModel}`);
  };

  const handleRemove = async () => {
    await removeFromWishlist(item._id);
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 3 },
        p: { xs: 2, sm: 3 },
        mb: { xs: 3, sm: 4 },
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 sm:static sm:mr-2">
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={(e) => onSelect(item._id, e.target.checked)}
          className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
        />
      </div>

      <div className="relative w-full sm:w-[150px] h-[200px] sm:h-[150px] flex-shrink-0">
        {item.image ? (
          <Image
            src={`${API_URL}/${item.image}`}
            alt={item.productModel || 'Product image'}
            fill
            style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      <CardContent sx={{ p: 0, flex: 1, width: '100%' }}>
        <ul className="flex flex-col gap-2 sm:gap-3 w-full">
          <li className="text-md font-semibold text-[var(--secondary)] break-words">{item.productModel || 'Unknown Model'}</li>
          <li className="text-md text-[color:var(--secondary)B2] break-words">{item.sku || 'No SKU'}</li>
          <li className="text-md">
            Price:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#996E19] via-[var(--primary)] to-[#996E19] font-bold">
              ₹{Number(displayedPrice)?.toFixed(2)}
            </span>
          </li>
          <li className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full mt-2">
            <button
              onClick={handleViewDetails}
              className="rounded-lg px-4 sm:px-5 py-2 cursor-pointer font-semibold hover:bg-[var(--primary)] border-[var(--primary)] border-2 text-[var(--secondary)] text-md w-full sm:w-auto"
            >
              View Details
            </button>
            <button
              onClick={handleRemove}
              className="bg-[var(--primary)] hover:bg-white rounded-lg border-2 border-[var(--primary)] px-4 sm:px-5 py-2 text-[var(--secondary)] text-md font-semibold cursor-pointer w-full sm:w-auto"
            >
              Remove
            </button>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

WishListCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    productModel: PropTypes.string,
    sku: PropTypes.string,
    image: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    options: PropTypes.arrayOf(
      PropTypes.shape({
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
      })
    ),
  }).isRequired,
};

export default WishListCard;
