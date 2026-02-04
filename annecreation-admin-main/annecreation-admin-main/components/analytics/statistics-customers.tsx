"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const data = [
  {
    name: "Jan",
    newCustomers: 400,
    returningCustomers: 240,
    churnRate: 2.4,
  },
  {
    name: "Feb",
    newCustomers: 300,
    returningCustomers: 280,
    churnRate: 2.0,
  },
  {
    name: "Mar",
    newCustomers: 500,
    returningCustomers: 320,
    churnRate: 1.8,
  },
  {
    name: "Apr",
    newCustomers: 450,
    returningCustomers: 340,
    churnRate: 1.9,
  },
  {
    name: "May",
    newCustomers: 470,
    returningCustomers: 380,
    churnRate: 1.7,
  },
  {
    name: "Jun",
    newCustomers: 580,
    returningCustomers: 390,
    churnRate: 1.5,
  },
  {
    name: "Jul",
    newCustomers: 600,
    returningCustomers: 420,
    churnRate: 1.6,
  },
  {
    name: "Aug",
    newCustomers: 700,
    returningCustomers: 450,
    churnRate: 1.4,
  },
  {
    name: "Sep",
    newCustomers: 650,
    returningCustomers: 480,
    churnRate: 1.3,
  },
  {
    name: "Oct",
    newCustomers: 690,
    returningCustomers: 520,
    churnRate: 1.2,
  },
  {
    name: "Nov",
    newCustomers: 720,
    returningCustomers: 550,
    churnRate: 1.0,
  },
  {
    name: "Dec",
    newCustomers: 750,
    returningCustomers: 580,
    churnRate: 0.9,
  },
]

export function StatisticsCustomers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Analytics</CardTitle>
        <CardDescription>Track customer acquisition, retention, and churn rate</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="acquisition" className="h-[400px]">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
              <TabsTrigger value="churn">Churn Rate</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="acquisition" className="h-[350px]">
            <ChartContainer
              config={{
                newCustomers: {
                  label: "New Customers",
                  color: "hsl(var(--chart-1))",
                },
                returningCustomers: {
                  label: "Returning Customers",
                  color: "hsl(var(--chart-2))",
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    stroke="var(--color-newCustomers)"
                    activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="returningCustomers" stroke="var(--color-returningCustomers)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="retention" className="h-[350px]">
            <ChartContainer
              config={{
                returningCustomers: {
                  label: "Returning Customers",
                  color: "hsl(var(--chart-2))",
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="returningCustomers"
                    stroke="var(--color-returningCustomers)"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="churn" className="h-[350px]">
            <ChartContainer
              config={{
                churnRate: {
                  label: "Churn Rate (%)",
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="churnRate" stroke="var(--color-churnRate)" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
