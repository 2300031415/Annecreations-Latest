'use client';
import { MdClose } from 'react-icons/md';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { FaRegHeart, FaShareAlt } from 'react-icons/fa';
import { MdOutlineShoppingCart } from 'react-icons/md';
import FullImageView from './FullImageView';
import { useProductCardStore } from './ProductCardStore';
import { IconButton } from '@mui/material';
import LoginForm from '@/app/Auth/Login/LoginForm';

// ✅ MUI imports
import { Modal, Box, Typography, Rating } from '@mui/material';

const ProductCard = ({ item }) => {
  const store = useProductCardStore(item);
  const fallbackImage = '/no-image.png';

  const allImages = useMemo(() => {
    const mainImg = { _id: 'main', image: item.image || fallbackImage };
    const extras = item.additionalImages || [];
    return [mainImg, ...extras];
  }, [item, fallbackImage]);

  const [currentImage, setCurrentImage] = useState(allImages[0].image);

  return (
    <>
      <div className="bg-[var(--card-bg)] rounded-lg py-2 md:py-6 px-4 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Image section */}
          <div className="w-full lg:w-1/3 flex flex-col justify-center rounded-md cursor-pointer">
            <div onClick={() => store.setOpen(true)} className="overflow-hidden rounded-md">
              <Image
                src={`${store.API_URL}/${currentImage || fallbackImage}`}
                alt={item.design ?? 'Design Image'}
                width={400}
                height={300}
                className="object-cover w-full h-auto transition-transform duration-200 ease-out"
                style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
              />
            </div>

            {allImages.length > 1 && (
              <div className="mt-4 overflow-x-auto flex gap-3 pb-2">
                {allImages.map((img, index) => (
                  <div
                    key={img._id || index}
                    className={`flex-shrink-0 cursor-pointer border-2 rounded-md ${currentImage === img.image ? 'border-[var(--primary)]' : 'border-transparent'
                      }`}
                    onClick={() => setCurrentImage(img.image || fallbackImage)}
                  >
                    <Image
                      src={`${store.API_URL}/${img.image || fallbackImage}`}
                      alt={`Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="w-full lg:w-2/3 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row gap-2 md:gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-lg mb-3 flex items-center gap-3 flex-wrap">
                  <span className="text-[#ffa500] font-bold">{item.sku ?? 'SKU N/A'}</span>
                  <button
                    onClick={() => store.handleShare(item?.sku ?? 'Design')}
                    className="text-[var(--primary)] cursor-pointer hover:text-[#996E19] transition"
                    title="Share"
                  >
                    <FaShareAlt />
                  </button>
                </p>
                <ul className="space-y-2 text-sm md:text-md text-[var(--secondary)]">
                  <li><strong>Design Code:</strong> {item.productModel}</li>
                  <li><strong>Stitches:</strong> {item.stitches}</li>
                  <li><strong>Area / Width / Height:</strong> {item?.dimensions ?? 'N/A'}</li>
                  <li><strong>Color / Needles:</strong> {item.colourNeedles}</li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <Rating
                    value={item.averageRating || 0}
                    readOnly
                    precision={0.5}
                    size="small"
                    sx={{
                      '& .MuiRating-iconFilled': { color: 'var(--secondary)' },
                      '& .MuiRating-iconEmpty': { color: 'transparent', stroke: 'var(--secondary)', strokeWidth: '1px' },
                    }}
                  />
                  <span className="text-sm text-[var(--secondary)] opacity-70">
                    ({item.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Addons */}
              <div className="flex-1 min-w-0">
                {item.options?.length > 0 ? (
                  <ul className="space-y-2">
                    {item.options.map((option) => {
                      const isChecked = store.selectedAddons.includes(option._id);
                      const isPurchased = option.purchased;

                      return (
                        <li key={option._id} className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              id={`addon-${option._id}`}
                              name="addons"
                              checked={isPurchased || isChecked}
                              className="cursor-pointer"
                              onChange={(e) => store.handleAddonChange(option._id, e.target.checked)}
                              disabled={isPurchased}
                            />
                            <label
                              htmlFor={`addon-${option._id}`}
                              className={`flex-1 min-w-0 ${isPurchased ? 'cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            >
                              {option.option.name}
                            </label>
                            <span className="text-nowrap ml-2">₹{option.price ?? 'Included'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--muted-text)] italic">No add-ons available</p>
                )}
              </div>
            </div>

            {/* Wishlist & Cart buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col-reverse mt-2 md:flex-row justify-around gap-1 md:gap-4">
                <div className="w-full md:w-1/2">
                  <button
                    onClick={() => store.addItemToWishlist()}
                    className="cursor-pointer font-semibold hover:bg-[var(--primary)] flex items-center justify-center gap-2 border-2 border-[var(--primary)] text-[var(--secondary)] px-4 py-2 rounded-md transition"
                  >
                    <FaRegHeart />
                    {store.alreadyInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                <div className="w-full md:w-1/2">
                  <button
                    onClick={() => store.addItemToCart()}
                    className="cursor-pointer font-semibold flex items-center justify-center gap-2 px-4 py-2 rounded-md transition border-2 border-[var(--primary)] bg-[var(--primary)] text-[var(--secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--secondary)]"
                  >
                    <MdOutlineShoppingCart />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full image modal */}
      {store.open && (
        <FullImageView
          open={store.open}
          onClose={() => store.setOpen(false)}
          src={`${store.API_URL}/${currentImage || fallbackImage}`}
          alt={item.design ?? 'Design Image'}
        />
      )}

      {/* ✅ MUI Login Modal */}
      <Modal
        open={store.modalOpen}
        onClose={() => store.setModalOpen(false)}
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            position: 'relative', // important for positioning close button
          }}
        >
          {/* Close button */}
          <IconButton
            aria-label="close"
            onClick={() => store.setModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <MdClose size={24} />
          </IconButton>

          <Typography id="login-modal-title" variant="h6" component="h2" mb={2}>
            Login to continue
          </Typography>
          <LoginForm />
        </Box>
      </Modal>
    </>
  );
};

ProductCard.propTypes = {
  item: PropTypes.object.isRequired,
};

export default ProductCard;
