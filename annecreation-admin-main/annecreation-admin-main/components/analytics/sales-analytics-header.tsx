"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon, Loader2 } from "lucide-react";
import { useGetCustomersByProductQuery } from "@/lib/redux/api/customerByProductApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateIST } from "@/lib/date-utils";

interface CustomerData {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  orderCreatedAt: string;
}

interface ApiResponse {
  data: {
    productModel: string;
    totalCustomers: number;
    customers: CustomerData[];
  };
}

export function SalesAnalyticsHeader() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isFetching, error } = useGetCustomersByProductQuery(
    query,
    {
      skip: !query,
      refetchOnMountOrArgChange: true,
    }
  );

  const handleSearch = () => {
    if (!search.trim()) return;
    setQuery(search.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearch("");
    setQuery("");
  };

  const isLoadingResults = isLoading || isFetching;

  return (
    <div className="flex flex-col gap-4 w-full">
      <h5>Search Product by Product Name/Model </h5>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search product model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9 pr-10"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              <XIcon size={18} />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={isLoadingResults}>
          {isLoadingResults ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
            </>
          ) : (
            <>
              <SearchIcon className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      <div className="mt-2">
        {isLoadingResults && (
          <div className="flex justify-center items-center py-6 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading results...
          </div>
        )}

        {error && !isLoadingResults && (
          <div className="text-center py-4 text-red-500 bg-red-50 rounded-md">
            Failed to fetch data. Please try again.
          </div>
        )}

        {data && !isLoadingResults && (
          <div className="rounded-md border">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">
                Product Model: {data.data.productModel}
              </h3>
              <p className="text-sm text-gray-500">
                Total Customers: {data.data.totalCustomers}
              </p>
            </div>
            {data.data.customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Order Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.customers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>{customer.orderNumber}</TableCell>
                      <TableCell>
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.mobile}</TableCell>
                      <TableCell>
                        {formatDateIST(customer.orderCreatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No customers found for this product model
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}