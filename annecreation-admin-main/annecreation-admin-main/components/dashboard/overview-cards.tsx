'use client'

import React from "react"
import { useRouter } from "next/navigation"
import {
  IndianRupee,
  ShoppingCart,
  Users,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  useGetSalesQuery,
  useGetNewOrdersQuery,
  useGetNewCustomersQuery,
  useGetOnlineCustomersQuery,
  useGetAllCustomersQuery
} from "@/lib/redux/api/dashboardApi"

// Base stats setup
const baseStats = [
  {
    title: "Total Customers",
    value: "0",
    icon: Users,
    color: "#ffb729",
    href: "/dashboard/customers",
  },
  {
    title: "New Orders",
    value: "0",
    description: "Last 7 days",
    icon: ShoppingCart,
    color: "#ffb729",
    href: "/dashboard/orders",
  },
  {
    title: "New Customers",
    value: "0",
    description: "Last 7 days",
    icon: Users,
    color: "#ffb729",
    href: "/dashboard/customers?sortBy=createdAt&sortOrder=desc",
  },
  {
    title: "Online Customers",
    value: "0",
    description: "Currently active",
    icon: Users,
    color: "#ffb729",
    realtime: true,
    href: "/dashboard/analytics/online-users",
  },
]

export const OverviewCards = React.memo(() => {
  const router = useRouter()
  
  // // API calls with controlled refetching
  // const { data: salesData, isLoading: isSalesLoading } = useGetSalesQuery(
  //   { days: 30 },
  //   { refetchOnFocus: false, refetchOnReconnect: false }
  // )

  const { data: ordersData, isLoading: isOrdersLoading } = useGetNewOrdersQuery(
    { days: 30 },
    { refetchOnFocus: false, refetchOnReconnect: false }
  )


  const { data: newCustomersData, isLoading: isNewCustomersLoading } = useGetNewCustomersQuery(
    undefined,
    { refetchOnFocus: false, refetchOnReconnect: false }
  )

  // Poll every 10 seconds for real-time online customers
  const { data: onlineCustomersData, isLoading: isOnlineCustomersLoading } = useGetOnlineCustomersQuery(
    undefined,
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      pollingInterval: 10000,
    }
  )

  const isLoading = isOrdersLoading || isNewCustomersLoading || isOnlineCustomersLoading

  // Build stats dynamically
  const stats = baseStats.map((stat, idx) => {
    if (idx === 0 && newCustomersData) {
      const total = newCustomersData.totalCustomers ?? 0
      return {
        ...stat,
        value: `${total.toLocaleString("en-IN")}`,
      
      }
    }


    if (idx === 1 && ordersData) {
      const period = Number.isFinite(ordersData.period) ? ordersData.period : 30
      return {
        ...stat,
        value: `${ordersData.totalOrders ?? 0}`,
        description: `New orders in last ${period} days`,
      }
    }
    if (idx === 2 && newCustomersData) {
      const period = newCustomersData.period ?? "30 days"
      return {
        ...stat,
        value: `${newCustomersData.totalNewCustomers ?? 0}`,
        description: `New customers in last ${period}`,
      }
    }
    if (idx === 3 && onlineCustomersData) {
      return {
        ...stat,
        value: `${onlineCustomersData.totalOnline ?? 0}`,
        description: `Currently online customers`,
      }
    }
    return stat
  })

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {baseStats.map((stat, index) => (
          <Card key={index} className="border border-gray-200 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: stat.color }}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400 animate-pulse">...</div>
              <p className="mt-1 text-sm text-gray-400">Loading data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Final render
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const handleClick = () => {
          if (stat.href) {
            router.push(stat.href)
          }
        }

        return (
          <Card 
            key={index} 
            className={cn(
              "border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-lg",
              stat.href && "cursor-pointer hover:border-gray-300"
            )}
            onClick={stat.href ? handleClick : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                {stat.title}
                {stat.realtime && (
                  <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </CardTitle>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: stat.color }}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})
