"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetYearlyRevenueQuery } from "@/lib/redux/api/dashboardApi"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface RevenueChartProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RevenueChart({ className, ...props }: RevenueChartProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useGetYearlyRevenueQuery({ year });

  // Prepare chart data from API
  const chartData = MONTHS.map((month, idx) => {
    const monthData = data?.monthlyData?.find((m) => m.month === idx + 1);
    return {
      name: month.slice(0, 3),
      total: monthData?.revenue ?? 0,
    };
  });

  return (
    <Card className={`border border-gray-200 bg-white shadow-md ${className}`} {...props}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900">Revenue Overview</CardTitle>
          <CardDescription className="text-gray-500">Monthly revenue for the selected year</CardDescription>
        </div>
        <div className="w-[120px]">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="border border-gray-300">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-md bg-muted"></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "#6b7280" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => `₹${value}`}
                tick={{ fill: "#6b7280" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(243, 244, 246, 0.8)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-gray-500">Month</span>
                            <span className="font-bold text-gray-900">{payload[0].payload.name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-gray-500">Revenue</span>
                            <span className="font-bold text-gray-900">₹{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#ffb729" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
