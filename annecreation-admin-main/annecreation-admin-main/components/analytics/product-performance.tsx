"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const data = [
  { name: "Floral Embroidery", sales: 245, revenue: 36750 },
  { name: "Peacock Applique", sales: 186, revenue: 27900 },
  { name: "Kutch Work", sales: 152, revenue: 22800 },
  { name: "Geometric Quilting", sales: 132, revenue: 19800 },
  { name: "Mandala Design", sales: 125, revenue: 18750 },
  { name: "Phulkari Pattern", sales: 118, revenue: 17700 },
  { name: "Zardozi Design", sales: 105, revenue: 15750 },
]

export function ProductPerformance({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Product Performance</CardTitle>
        <CardDescription>Sales and revenue by product</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
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
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar yAxisId="left" dataKey="sales" fill="var(--color-sales)" />
              <Bar yAxisId="right" dataKey="revenue" fill="var(--color-revenue)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
