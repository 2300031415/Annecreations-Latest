"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const data = [
  { name: "Website", value: 65 },
  { name: "Mobile App", value: 25 },
  { name: "Marketplace", value: 10 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"]

export function SalesChannels({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sales Channels</CardTitle>
        <CardDescription>Distribution of sales by channel</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ChartContainer
          config={{
            value: {
              label: "Percentage",
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
