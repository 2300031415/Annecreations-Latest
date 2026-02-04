"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const dailyData = [
  { date: "2023-05-01", revenue: 4000, orders: 24 },
  { date: "2023-05-02", revenue: 3000, orders: 18 },
  { date: "2023-05-03", revenue: 2000, orders: 12 },
  { date: "2023-05-04", revenue: 2780, orders: 19 },
  { date: "2023-05-05", revenue: 1890, orders: 14 },
  { date: "2023-05-06", revenue: 2390, orders: 18 },
  { date: "2023-05-07", revenue: 3490, orders: 22 },
  { date: "2023-05-08", revenue: 3200, orders: 20 },
  { date: "2023-05-09", revenue: 2800, orders: 18 },
  { date: "2023-05-10", revenue: 2950, orders: 19 },
  { date: "2023-05-11", revenue: 3300, orders: 21 },
  { date: "2023-05-12", revenue: 3580, orders: 23 },
  { date: "2023-05-13", revenue: 3700, orders: 25 },
  { date: "2023-05-14", revenue: 3600, orders: 24 },
]

const weeklyData = [
  { date: "Week 1", revenue: 24000, orders: 145 },
  { date: "Week 2", revenue: 18000, orders: 110 },
  { date: "Week 3", revenue: 22000, orders: 132 },
  { date: "Week 4", revenue: 25000, orders: 152 },
  { date: "Week 5", revenue: 27000, orders: 165 },
  { date: "Week 6", revenue: 23000, orders: 140 },
  { date: "Week 7", revenue: 29000, orders: 175 },
  { date: "Week 8", revenue: 31000, orders: 188 },
]

const monthlyData = [
  { date: "Jan", revenue: 65000, orders: 420 },
  { date: "Feb", revenue: 59000, orders: 380 },
  { date: "Mar", revenue: 80000, orders: 510 },
  { date: "Apr", revenue: 81000, orders: 520 },
  { date: "May", revenue: 56000, orders: 360 },
  { date: "Jun", revenue: 55000, orders: 350 },
  { date: "Jul", revenue: 40000, orders: 260 },
  { date: "Aug", revenue: 60000, orders: 390 },
  { date: "Sep", revenue: 63000, orders: 410 },
  { date: "Oct", revenue: 58000, orders: 370 },
  { date: "Nov", revenue: 48000, orders: 310 },
  { date: "Dec", revenue: 68000, orders: 440 },
]

export function SalesTrends({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState("daily")

  const getActiveData = () => {
    switch (activeTab) {
      case "daily":
        return dailyData
      case "weekly":
        return weeklyData
      case "monthly":
        return monthlyData
      default:
        return dailyData
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sales Trends</CardTitle>
        <CardDescription>Track revenue and order trends over time</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="daily" onValueChange={setActiveTab} className="h-[400px]">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="h-[350px]">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue (₹)",
                  color: "hsl(var(--chart-1))",
                },
                orders: {
                  label: "Orders",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getActiveData()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    activeDot={{ r: 8 }}
                  />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="var(--color-orders)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
