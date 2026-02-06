'use client';

import React from 'react';
import PropTypes from 'prop-types';
const PriceDetails = ({ subtotal, itemsCount }) => {
  return (
    <div className="w-full md:w-1/2 lg:w-[28%]">
  <div className="border-2 rounded-xl border-[var(--primary)] p-4 bg-white shadow-md">
    <h2 className="text-lg text-center font-semibold mb-3 text-[var(--primary)]">
      Price Details
    </h2>
    <ul className="space-y-2">
      <li className="flex text-md justify-between">
        <span>
          total ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
        </span>
        <span className="font-medium">₹{subtotal}</span>
      </li>

      <li className="flex text-xl justify-between border-t-2 pt-2 border-[var(--primary)] mt-6 font-bold">
        <span className="gradient-text">Total</span>
        <span className="gradient-text">₹{subtotal}</span>
      </li>
    </ul>
  </div>
</div>

  );
};

PriceDetails.propTypes = {
  subtotal: PropTypes.number.isRequired,
  itemsCount: PropTypes.number.isRequired,
};

export default PriceDetails;
