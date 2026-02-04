"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const data = [
  { name: "Embroidery", value: 400 },
  { name: "Applique", value: 300 },
  { name: "Quilting", value: 200 },
  { name: "Redwork", value: 150 },
  { name: "Cross Stitch", value: 100 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function StatisticsProducts({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Product Categories</CardTitle>
        <CardDescription>Distribution of sales by product category</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ChartContainer
          config={{
            value: {
              label: "Sales",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
