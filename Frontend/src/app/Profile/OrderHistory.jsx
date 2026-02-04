'use client';

import React, { useState, useEffect } from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';

import Orderdetails from './Orderdetails';
import { useOrders } from '@/hook/useOrder';

const OrderHistory = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { orders, isLoading, error, totalPages, currentPage, setCurrentPage } = useOrders();


  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  if (showDetails && selectedOrder) {
    return <Orderdetails order={selectedOrder} onClose={() => setShowDetails(false)} />;
  }

  return (
    <div className="rounded-xl border-2 border-[var(--primary)] my-2 lg:my-0 lg:mx-8 w-full">
      <h6 className="border-b-2 border-[var(--primary)] text-2xl font-semibold p-4 text-[var(--secondary)]">
        Order History
      </h6>

      <div className="flex flex-col gap-4 p-4">
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <CircularProgress />
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!isLoading && orders.length === 0 && <p>No orders found.</p>}

        {!isLoading &&
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-lg rounded-xl p-4 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 w-full"
            >
              {/* Single Row Data */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="flex-1 min-w-[80px]">
                  <span className="font-semibold text-[var(--secondary)]">Order Number: </span>
                  {order.orderNumber}
                </span>

                <span className="flex-1 min-w-[80px]">
                  <span className="font-semibold text-[var(--secondary)]">Order Date: </span>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </span>

                <span className="flex-1 min-w-[80px]">
                  <span className="font-semibold text-[var(--secondary)]">No of Products: </span>
                  {order.products.length}
                </span>

                <span className="flex-1 min-w-[100px]">
                  <span className="font-semibold text-[var(--secondary)]">Status: </span>
                  {order.orderStatus}
                </span>

                <span className="flex-1 min-w-[100px] font-bold text-[var(--primary)]">
                  <span className="font-semibold text-[var(--secondary)]">Total: </span>
                  ₹{order.totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="w-full sm:w-auto flex justify-start sm:justify-end mt-2 sm:mt-0">
                <button
                  aria-label="View Order Details"
                  className="bg-[var(--primary)] border-2 border-[var(--primary)] hover:bg-white text-white hover:text-[var(--primary)] font-semibold px-6 py-2 rounded-lg transition cursor-pointer"
                  onClick={() => handleViewClick(order)}
                >
                  View
                </button>
              </div>
            </div>
          ))}

        {totalPages > 1 && (
          <Stack spacing={2} alignItems="center" className="mt-6">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, value) => setCurrentPage(value)}
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

export default OrderHistory;
