"use client";
import { useState } from "react";
import { IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetSalesQuery } from "@/lib/redux/api/salesApi";

export function StatisticsOverview() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Trigger fetch only when both dates are selected
  const shouldFetch = fromDate && toDate;
  const { data, error, isLoading } = useGetSalesQuery(
    shouldFetch ? { dateFrom: fromDate, dateTo: toDate } : undefined
  );

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      {/* Show Period Info */}
      {data?.period && (
        <div className="text-sm text-gray-600 font-medium">
           {data.period}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-500">Error loading revenue</div>
            ) : (
              <div className="text-2xl font-bold">
                ₹{data?.totalRevenue?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-500">Error loading sales</div>
            ) : (
              <div className="text-2xl font-bold">
                {data?.totalSales?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
