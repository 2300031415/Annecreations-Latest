'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { FiDownload } from 'react-icons/fi';
import { API_URL } from '@/Store/authStore';
import axiosClient from '@/lib/axiosClient';
import { useDownloadStore } from '@/Store/DownloadStore';
import { useSnackbar } from 'notistack';
import { useShallow } from 'zustand/react/shallow';

const Downloads = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [filterQuery, setFilterQuery] = useState('');

  // ✅ Access Zustand store directly (no custom hook)
  const {
    downloads,
    totalDownloads,
    totalPages,
    currentPage,
    isLoading,
    error,
    fetchDownloads,
    searchDownloads,
    setCurrentPage,
  } = useDownloadStore(
    useShallow((s) => ({
      downloads: s.downloads,
      totalDownloads: s.totalDownloads,
      totalPages: s.totalPages,
      currentPage: s.currentPage,
      isLoading: s.isLoading,
      error: s.error,
      fetchDownloads: s.fetchDownloads,
      searchDownloads: s.searchDownloads,
      setCurrentPage: s.setCurrentPage,
    }))
  );

  // ✅ Debounced search or reset
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = filterQuery.trim();
      if (query) {
        searchDownloads(query);
      } else {
        setCurrentPage(1);
        fetchDownloads(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filterQuery]);

  // ✅ Fetch when page changes (no search active)
  useEffect(() => {
    if (!filterQuery.trim()) {
      fetchDownloads(currentPage);
    }
  }, [currentPage]);

  const handlePageChange = (_, value) => setCurrentPage(value);

  const handleDownload = async (productId, optionId, productName, optionMachine) => {
    try {
      const response = await axiosClient.get(
        `/api/downloads/${productId}/${optionId}`,
        { responseType: 'blob' }
      );

      const fileName = `${productName}_${optionMachine.replace(/\s+/g, '_')}.zip`;
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/zip' })
      );
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

  // ✅ Flatten downloads data for display
  const flattenedItems = (() => {
    const result = [];
    for (const order of downloads) {
      for (const product of order.products || []) {
        const productData = product.product;
        const productId = productData?._id;
        const productImage = productData?.image;
        const productModel = productData?.productModel || 'N/A';

        for (const opt of product.options || []) {
          const option = opt.option;
          const optionId = option?._id;
          const optionMachine = option?.name || 'N/A';

          result.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            productId,
            productName: productModel,
            productImage,
            optionId,
            optionMachine,
          });
        }
      }
    }
    return result;
  })();

  return (
    <div className="rounded-xl border-2 border-[var(--primary)] my-4 md:my-0 mx-0 md:mx-8">
      <h6 className="border-b-2 border-[var(--primary)] text-2xl font-semibold p-4 text-[var(--secondary)]">
        Downloads
      </h6>

      {/* 🔍 Search Input */}
      <div className="px-4 flex justify-center my-5 pb-2">
        <input
          type="text"
          placeholder="Search by Order Number, Product Model, or Machine..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-1/2 px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4 p-4">
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <CircularProgress />
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!isLoading && flattenedItems.length === 0 && (
          <p>No matching downloads found.</p>
        )}

        {!isLoading &&
          flattenedItems.map((item, idx) => (
            <div
              key={`${item.orderId}-${item.productId}-${item.optionId}-${idx}`}
              className="flex items-center md:items-center flex-col md:flex-row justify-between bg-white shadow-lg rounded-xl p-4 gap-4 flex-nowrap"
            >
              {/* Image */}
              <div className="w-[60px] h-[60px] relative border rounded overflow-hidden flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={`${API_URL}/${item.productImage}`}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-100">
                    No Image
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div className="flex-1 max-w-[120px] truncate">
                <span className="font-semibold text-[var(--secondary)]">Name: </span>
                {item.productName}
              </div>

              {/* Machine Name */}
              <div className="flex-1 min-w-[150px] max-w-[250px]">
                <span className="font-semibold text-[var(--secondary)]">Machine: </span>
                {item.optionMachine}
              </div>

              {/* Order Number */}
              <div className="flex-1 min-w-[80px] max-w-[150px] truncate">
                <span className="font-semibold text-[var(--secondary)]">Order ID: </span>
                {item.orderNumber}
              </div>

              {/* Order Date */}
              <div className="flex-1 min-w-[90px] max-w-full md:max-w-[120px] truncate">
                <span className="font-semibold text-[var(--secondary)]">Date: </span>
                {item.orderDate
                  ? new Date(item.orderDate).toLocaleDateString()
                  : 'N/A'}
              </div>

              {/* Download Button */}
              {item.productId && item.optionId && (
                <button
                  onClick={() =>
                    handleDownload(
                      item.productId,
                      item.optionId,
                      item.productName,
                      item.optionMachine
                    )
                  }
                  className="text-white cursor-pointer bg-[var(--primary)] p-2 rounded-md hover:bg-opacity-90 flex items-center justify-center flex-shrink-0"
                  title="Download"
                >
                  <FiDownload size={18} />
                </button>
              )}
            </div>
          ))}

        {/* Pagination only when not searching */}
        {totalPages > 1 && !filterQuery && (
          <Stack spacing={2} alignItems="center" className="mt-6">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              variant="outlined"
              color="primary"
              shape="rounded"
              size="large"
            />
          </Stack>
        )}
      </div>
    </div>
  );
};

export default Downloads;
