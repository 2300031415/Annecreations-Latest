"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for Indian states
const data = [
  { state: "Maharashtra", sales: 4000, revenue: 240000 },
  { state: "Delhi", sales: 3000, revenue: 180000 },
  { state: "Karnataka", sales: 2800, revenue: 168000 },
  { state: "Tamil Nadu", sales: 2780, revenue: 166800 },
  { state: "Gujarat", sales: 2500, revenue: 150000 },
  { state: "Telangana", sales: 2300, revenue: 138000 },
  { state: "West Bengal", sales: 2000, revenue: 120000 },
  { state: "Uttar Pradesh", sales: 1890, revenue: 113400 },
]

export function SalesRegions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Performance</CardTitle>
        <CardDescription>Sales distribution across Indian states</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer
          config={{
            sales: {
              label: "Sales",
              color: "hsl(var(--chart-1))",
            },
            revenue: {
              label: "Revenue (₹)",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 20,
                right: 30,
                left: 70,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="state" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sales" fill="var(--color-sales)" />
              <Bar dataKey="revenue" fill="var(--color-revenue)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
