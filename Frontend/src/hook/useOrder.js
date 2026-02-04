import { useEffect } from "react";
import { useOrderStore } from "@/Store/orders";
import { useShallow } from "zustand/react/shallow";

export const useOrders = () => {
  const {
    orders,
    totalOrders,
    currentPage,
    totalPages,
    isLoading,
    error,
    isSearchMode,
    fetchOrders,
    searchOrders,
    setCurrentPage,
  } = useOrderStore(
    useShallow((s) => ({
      orders: s.orders,
      totalOrders: s.totalOrders,
      currentPage: s.currentPage,
      totalPages: s.totalPages,
      isLoading: s.isLoading,
      error: s.error,
      isSearchMode: s.isSearchMode,
      fetchOrders: s.fetchOrders,
      searchOrders: s.searchOrders,
      setCurrentPage: s.setCurrentPage,
    }))
  );

  // ✅ Automatically fetch orders when page changes
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);
  return {
    orders,
    totalOrders,
    currentPage,
    totalPages,
    isLoading,
    error,
    isSearchMode,
    setCurrentPage,
    searchOrders,
    fetchOrders, 
  };
};
