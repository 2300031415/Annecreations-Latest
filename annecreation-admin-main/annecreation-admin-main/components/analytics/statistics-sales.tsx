"use client"

import { useGetSalesQuery } from "@/lib/redux/api/salesApi"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatisticsSales() {
  const { data, error, isLoading } = useGetSalesQuery()

  // Convert API result to chart-friendly format
  const chartData = data
    ? [
        {
          name: "Sales vs Revenue",
          Sales: data.totalSales,
          Revenue: data.totalRevenue,
        },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales & Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">Error loading chart</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="Sales" fill="#4ade80" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Revenue" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
