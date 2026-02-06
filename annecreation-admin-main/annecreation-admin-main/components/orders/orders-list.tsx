"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { XIcon, Eye, MoreHorizontal, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderDialog } from "./order-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from "lucide-react";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useGetOrdersQuery, Order } from "@/lib/redux/api/ordersApi";
import { formatDateIST } from "@/lib/date-utils";
import { OrderStatusDialog } from "./order-status-dialog";


export function OrdersList() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get('id');
  const autoOpenTriggered = useRef(false);

  // State declarations - must be before the query
  const [sortField, setSortField] = useState<"id" | "customer" | "total" | "dateModified">("dateModified");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"all" | "id" | "customer" | "email" | "phone" | "razorpayOrderId">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [allAvailableStatuses, setAllAvailableStatuses] = useState<string[]>(['pending', 'paid', 'cancelled']);
  const [selectedOrderForDialog, setSelectedOrderForDialog] = useState<Order | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>("razorpay");

  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");

  const formatDateForApi = (date: string) => {
    if (!date) return undefined;
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) return undefined;
    return formattedDate.toISOString().split('T')[0];
  };

  // Handle URL parameter on mount - auto-search by order ID
  useEffect(() => {
    if (orderIdFromUrl && !autoOpenTriggered.current) {
      setSearchField("id");
      setSearchQuery(orderIdFromUrl);
    }
  }, [orderIdFromUrl]);

  // Calculate status parameter
  // Send undefined if all statuses are selected (show all) or none selected (show all)
  // Otherwise send the array of selected statuses (API will handle single or multiple)
  const statusParam = 
    selectedStatuses.length === 0 || selectedStatuses.length === allAvailableStatuses.length
      ? undefined
      : selectedStatuses;

  // Query with all params including status filter
  const { data: ordersResponse, isLoading, isFetching, isError, refetch } = useGetOrdersQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
    searchField: searchField === "all" ? undefined : searchField,
    sortBy: sortField,
    sortOrder: sortDirection,
    status: statusParam as any,
    dateFrom: formatDateForApi(appliedDateFrom),
    dateTo: formatDateForApi(appliedDateTo),
    paymentCode: selectedPaymentCode || undefined
  }, {
    refetchOnMountOrArgChange: true
  });

  // Make sure data is always an array
  const ordersData: Order[] = ordersResponse?.data || [];

  // Get pagination info from response
  const totalItems = ordersResponse?.pagination?.total || 0;
  const totalPages = ordersResponse?.pagination?.pages || 1;

  // Extract unique statuses from current API response
  const currentStatuses = useMemo(
    () => {
      if (!ordersResponse?.data?.length) return [];
      return Array.from(new Set(ordersResponse.data.map((o) => String(o.orderStatus ?? "unknown"))))
        .sort((a, b) => a.localeCompare(b));
    },
    [ordersResponse?.data]
  );

  // Maintain a list of ALL statuses we've ever seen (don't let it shrink when filtering)
  useEffect(() => {
    if (currentStatuses.length > 0) {
      setAllAvailableStatuses(prev => {
        // Merge with existing statuses
        const combined = Array.from(new Set([...prev, ...currentStatuses])).sort((a, b) => a.localeCompare(b));
        return combined;
      });
    }
  }, [currentStatuses]);

  // Initialize selectedStatuses once when all statuses are known
  useEffect(() => {
    if (allAvailableStatuses.length > 0 && selectedStatuses.length === 0) {
      setSelectedStatuses(allAvailableStatuses);
    }
  }, [allAvailableStatuses, selectedStatuses.length]);

  // Update query with full params after statuses are initialized
  // useEffect(() => {
  //   refetch();
  // }, [searchQuery, searchField, selectedStatuses, sortField, sortDirection, currentPage, itemsPerPage, refetch]);

  // Auto-open order details when searching from dashboard
  useEffect(() => {
    if (orderIdFromUrl && !autoOpenTriggered.current && ordersData.length > 0 && !isLoading) {
      // Find the order matching the URL parameter
      const matchingOrder = ordersData.find(order => String(order.orderNumber) === orderIdFromUrl);

      if (matchingOrder) {
        // Open the dialog automatically
        setSelectedOrderForDialog(matchingOrder);
        autoOpenTriggered.current = true;
      }
    }
  }, [orderIdFromUrl, ordersData, isLoading]);


  const handleSort = (field: "id" | "customer" | "total" | "dateModified") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Update the query params when filters/sort change
  // useEffect(() => {
  //   // The API will handle filtering and sorting
  //   refetch();
  // }, [searchQuery, searchField, selectedStatuses, sortField, sortDirection, refetch]);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = Number(value);
    if (newValue !== itemsPerPage) {
      setItemsPerPage(newValue);
      setCurrentPage(1); // Reset to first page when changing items per page
    }
  };
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const updatedStatuses = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status].sort((a, b) => a.localeCompare(b));
      return updatedStatuses;
    });
    // Reset to first page when changing filters
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setSearchQuery("");
    setSearchField("all");
    setSelectedStatuses(allAvailableStatuses);
    setSortField("dateModified");
    setSortDirection("desc");
    setCurrentPage(1);
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setSelectedPaymentCode("razorpay");
  };

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
      <div className="flex items-center gap-2 rounded-md bg-white p-4 shadow-lg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (isError)
    return (
      <p className="py-10 text-center text-red-500">
        Failed to load orders
      </p>
    );




  if (isLoading) {
    return (
      <Card className="border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-600">Loading orders...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative border border-gray-200 bg-white shadow-md">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md bg-white p-4 shadow-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-gray-300"
                max={dateTo || undefined}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-gray-300"
                min={dateFrom || undefined}
              />
            </div>

            <Button
              variant="outline"
              className="border-gray-300"
              onClick={() => {
                setAppliedDateFrom(dateFrom);
                setAppliedDateTo(dateTo);
                setCurrentPage(1);
                refetch();
              }}
              disabled={!dateFrom && !dateTo}
            >
              Apply Filter
            </Button>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                className="text-gray-600"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setAppliedDateFrom("");
                  setAppliedDateTo("");
                  setCurrentPage(1);
                  refetch();
                }}
              >
                Clear Dates
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">All Orders</CardTitle>
            <CardDescription className="text-gray-500">{totalItems} total orders</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Select
                value={searchField}
                onValueChange={(value: "all" | "id" | "customer" | "email" | "phone" | "razorpayOrderId") => setSearchField(value)}
              >
                <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="id">Order ID</SelectItem>
                  <SelectItem value="customer">Customer Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="razorpayOrderId">RazorPay OrderId</SelectItem>

                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-auto">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={`Search by ${searchField === "all" ? "any field" : searchField === "razorpayOrderId" ? "RazorPay OrderId" : searchField}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 border-gray-300 w-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 border-gray-300">
                  <FilterIcon className="h-4 w-4" />
                  Status
                  {selectedStatuses.length < allAvailableStatuses.length && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allAvailableStatuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 border-gray-300">
                  <FilterIcon className="h-4 w-4" />
                  Payment
                  {selectedPaymentCode && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Payment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedPaymentCode === "razorpay"}
                  onCheckedChange={() => {
                    setSelectedPaymentCode(selectedPaymentCode === "razorpay" ? "" : "razorpay");
                    setCurrentPage(1);
                  }}
                >
                  Razorpay
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPaymentCode === "free"}
                  onCheckedChange={() => {
                    setSelectedPaymentCode(selectedPaymentCode === "free" ? "" : "free");
                    setCurrentPage(1);
                  }}
                >
                  Free
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Remove this dropdown menu */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 border-gray-300">
                  <FilterIcon className="h-4 w-4" />
                  Device
                  {selectedDevices.length < devices.length && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      {selectedDevices.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Device</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {devices.map((device) => (
                  <DropdownMenuCheckboxItem
                    key={device}
                    checked={selectedDevices.includes(device)}
                    onCheckedChange={() => toggleDevice(device)}
                  >
                    {device}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu> */}

            <Button variant="outline" className="border-gray-300" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("id")}
                  >
                    Order ID
                    {sortField === "id" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Product</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("customer")}
                  >
                    Customer
                    {sortField === "customer" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("total")}
                  >
                    Total
                    {sortField === "total" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Device</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("dateModified")}
                  >
                    Date Modified
                    {sortField === "dateModified" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersData.length > 0 ? (
                ordersData.map((order) => (
                  <TableRow key={order._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{order.orderNumber}</TableCell>
                    <TableCell>
                      {order.products.map((p) => (
                        <div key={`${order._id}-${p?.product?._id}`}>
                          {p?.product?.description}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{order.customer?.firstName}</TableCell>
                    <TableCell className="text-gray-700">{order.customer?.email}</TableCell>
                    <TableCell className="text-gray-700">{order.customer?.mobile}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.orderStatus === "paid"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : order.orderStatus === "Processing"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : order.orderStatus === "Shipped"
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                : order.orderStatus === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">₹{order.total}</TableCell>
                    <TableCell className="font-medium text-gray-900">{order.source}</TableCell>
                    <TableCell className="text-gray-700">{formatDateIST(order.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <OrderDialog order={order}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </OrderDialog>
                          <OrderStatusDialog
                            orderId={order._id}
                            currentStatus={order.orderStatus}
                            onStatusUpdated={() => refetch()}
                          >
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Truck className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                          </OrderStatusDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-gray-300">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Items per page</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="mx-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Controlled dialog for auto-opening from URL parameter */}
      {selectedOrderForDialog && (
        <OrderDialog
          order={selectedOrderForDialog}
          open={!!selectedOrderForDialog}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedOrderForDialog(null);
            }
          }}
        />
      )}
    </Card>
  )
}