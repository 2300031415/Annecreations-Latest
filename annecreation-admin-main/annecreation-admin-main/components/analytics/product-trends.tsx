"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data
const data = [
  { month: "Jan", embroidery: 65, applique: 28, quilting: 15 },
  { month: "Feb", embroidery: 59, applique: 30, quilting: 18 },
  { month: "Mar", embroidery: 80, applique: 32, quilting: 22 },
  { month: "Apr", embroidery: 81, applique: 35, quilting: 25 },
  { month: "May", embroidery: 56, applique: 37, quilting: 28 },
  { month: "Jun", embroidery: 55, applique: 40, quilting: 30 },
  { month: "Jul", embroidery: 40, applique: 43, quilting: 32 },
  { month: "Aug", embroidery: 60, applique: 45, quilting: 35 },
  { month: "Sep", embroidery: 63, applique: 48, quilting: 38 },
  { month: "Oct", embroidery: 58, applique: 50, quilting: 40 },
  { month: "Nov", embroidery: 48, applique: 53, quilting: 42 },
  { month: "Dec", embroidery: 68, applique: 55, quilting: 45 },
]

export function ProductTrends() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Trends</CardTitle>
          <CardDescription>Sales trends by product category over time</CardDescription>
        </div>
        <Select defaultValue="sales">
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="profit">Profit</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer
          config={{
            embroidery: {
              label: "Embroidery",
              color: "hsl(var(--chart-1))",
            },
            applique: {
              label: "Applique",
              color: "hsl(var(--chart-2))",
            },
            quilting: {
              label: "Quilting",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="embroidery" stroke="var(--color-embroidery)" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="applique" stroke="var(--color-applique)" />
              <Line type="monotone" dataKey="quilting" stroke="var(--color-quilting)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
