'use client'
import { ArrowRightIcon, CheckCircle2, Clock, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetRecentOrdersQuery } from "@/lib/redux/api/dashboardApi"
import { useRouter } from "next/navigation"
import { formatDateIST } from "@/lib/date-utils"
export function RecentOrders() {

  const router = useRouter();
  const { data, isLoading } = useGetRecentOrdersQuery({ limit: 10 });
  const orders = data?.recentOrders || [];
function getStatusLabel(status: string) {
  const key = status.toLowerCase();
  if (key === "processing") return { label: "Processing", color: "yellow" };
  if (key === "paid" || key === "completed") return { label: "Completed", color: "green" };
  if (key === "cancelled") return { label: "Cancelled", color: "red" };
  return { label: status, color: "gray" }; // fallback for unknown statuses
}

  return (
    <Card className="border border-gray-200 bg-white shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900">Recent Orders</CardTitle>
          <CardDescription className="text-gray-500">You have {orders.length} recent orders</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border border-gray-300"
          onClick={() => router.push("/dashboard/orders")}
        >
          View All
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Order ID</TableHead>
                <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">Loading...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">No data available</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const status = getStatusLabel(order.status); 

                  return (
                    <TableRow key={order.orderId} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{order.orderNumber}</TableCell>
                      <TableCell className="text-gray-700">{order?.customer?.name}</TableCell>
                      <TableCell className="text-gray-700">{formatDateIST(order.createdAt)}</TableCell>
                      <TableCell className="font-medium text-gray-900">₹{order.total}</TableCell>
                      <TableCell>
                        {status.color === "green" ? (
                          <div className="flex w-24 items-center justify-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{status.label}</span>
                          </div>
                        ) : status.color === "yellow" ? (
                          <div className="flex w-24 items-center justify-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{status.label}</span>
                          </div>
                        ) : (
                          <div className="flex w-24 items-center justify-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{status.label}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          onClick={() => router.push(`/dashboard/orders?id=${order.orderNumber}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
