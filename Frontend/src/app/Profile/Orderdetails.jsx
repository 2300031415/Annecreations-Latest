'use client';

import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import axiosClient from '@/lib/axiosClient';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

const OrderDetails = ({ order, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const itemsPerPage = 20; // Change this to show more/fewer product options per page

  if (!order) return null;

  const paymentAddress = order.payment
    ? `${order.payment.firstName || ''} ${order.payment.lastName || ''}, ${order.payment.address1 || ''}, ${order.payment.address2 || ''}, ${order.payment.city || ''}, ${order.payment.zone || ''}, ${order.payment.country || ''}, ${order.payment.postcode || ''}`
    : 'N/A';

  // Flatten all options for easy pagination
  const allOptions = order.products.flatMap(product =>
    product.options.map(option => ({
      productId: product.product._id,
      productName: product.product?.productModel || 'N/A',
      optionId: option.option?._id,
      optionName: option.option?.name || 'N/A',
      price: option.price || 0,
      quantity: option.quantity || 1
    }))
  );

  const pageCount = Math.ceil(allOptions.length / itemsPerPage);
  const displayedOptions = allOptions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDownload = async (productId, optionId, productName, optionName) => {
    try {
      const response = await axiosClient.get(
        `/api/downloads/${productId}/${optionId}`,
        { responseType: 'blob' }
      );

      const fileName = `${productName}_${optionName.replace(/\s+/g, '_')}.zip`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar(`Download started: ${fileName}`, { variant: 'success' });
    } catch (err) {
      console.error('Download failed:', err);
      enqueueSnackbar('Failed to download file.', { variant: 'error' });
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div className="rounded-xl my-2 lg:my-0 lg:ml-5 border-2 border-[var(--primary)] text-sm max-w-full">
      {/* Header */}
      <div className="border-b-2 border-[var(--primary)] text-xl sm:text-2xl font-semibold p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        Order Details
        <button
          onClick={onClose}
          className="text-[var(--primary)] cursor-pointer text-sm border border-[var(--primary)] px-3 py-1 rounded-lg hover:bg-[var(--primary)] hover:text-white transition"
        >
          Close
        </button>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 text-[var(--secondary)B2]">
        <ul className="space-y-2">
          <li className="flex justify-between flex-wrap">
            <span className="text-[var(--secondary)]">Order Number</span>
            <span>{order.orderNumber}</span>
          </li>
          <li className="flex justify-between flex-wrap">
            <span className="text-[var(--secondary)]">Order Date</span>
            <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</span>
          </li>
          <li className="flex justify-between flex-wrap">
            <span className="text-[var(--secondary)]">Status</span>
            <span>{order.orderStatus}</span>
          </li>
          <li className="flex justify-between flex-wrap">
            <span className="text-[var(--secondary)]">Total Products</span>
            <span>{order.products.length}</span>
          </li>
        </ul>

        {/* <ul className="space-y-2">
          <li className="font-medium text-[var(--secondary)]">Payment Address</li>
          <li>{paymentAddress}</li>
        </ul> */}

        <ul className="space-y-2 flex justify-between ">
          <li className="font-medium text-[var(--secondary)]">Payment Method</li>
          <li>{order.payment?.method || 'N/A'}</li>
        </ul>
      </div>

      <hr color="var(--secondary)" className="my-4" />

      {/* Products Info */}
      <h4 className="text-[var(--secondary)] font-bold text-center text-xl sm:text-2xl mb-4">Product Details</h4>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <table className="min-w-full border border-gray-200 text-sm table-auto">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Option</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Download</th>
            </tr>
          </thead>
          <tbody>
            {displayedOptions.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="px-4 py-2">{item.productName}</td>
                <td className="px-4 py-2">{item.optionName}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.price.toFixed(2)}</td>
                <td className="px-4 py-2">{(item.price * item.quantity).toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDownload(item.productId, item.optionId, item.productName, item.optionName)}
                    className="flex items-center cursor-pointer justify-center rounded-full gap-1 bg-[var(--primary)] p-2"
                  >
                    <FaDownload color="var(--secondary)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Flex Layout */}
      <div className="sm:hidden flex flex-col gap-4">
        {displayedOptions.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Product:</span>
              <span>{item.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Option:</span>
              <span>{item.optionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Quantity:</span>
              <span>{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Price:</span>
              <span>{item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span>{(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleDownload(item.productId, item.optionId, item.productName, item.optionName)}
                className="flex items-center justify-center rounded-full gap-1 bg-[var(--primary)] p-2"
              >
                <FaDownload color="var(--secondary)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center my-4">
          <Stack spacing={2}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
