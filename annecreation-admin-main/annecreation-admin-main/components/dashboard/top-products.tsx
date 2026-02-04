'use client'
import type React from "react"
import { ArrowRightIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGetTopProductsQuery } from "@/lib/redux/api/dashboardApi"
import { BASE_URL } from "@/lib/redux/api/baseApi"


interface TopProductsProps extends React.HTMLAttributes<HTMLDivElement> {}


export function TopProducts({ className, ...props }: TopProductsProps) {
  const router = useRouter();
  const { data, isLoading } = useGetTopProductsQuery({ days: 90, limit: 5 });
  const products = data?.topProducts || [];
  const maxSales = Math.max(...products.map((p) => p.totalSold), 1);

  return (
    <Card className={`border border-gray-200 bg-white shadow-md ${className}`} {...props}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900">Top Products</CardTitle>
          <CardDescription className="text-gray-500">Your best selling products in the last 90 days</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border border-gray-300"
          onClick={() => {
            // Calculate date range for last 90 days
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 89);
            startDate.setHours(0, 0, 0, 0); // Start of day
            
            const formatDate = (date: Date) => {
              // Format as YYYY-MM-DD in local timezone
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            
            router.push(`/dashboard/products?dateFrom=${formatDate(startDate)}&dateTo=${formatDate(today)}`);
          }}
        >
          View All
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading ? (
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500">No data available</div>
          ) : (
            products.map((product) => {
              const percent = Math.round((product.totalSold / maxSales) * 100);
              return (
                <div key={product.productId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                        <Image
                          src={product.image ? `${BASE_URL}/${product.image}` : "/placeholder.svg"}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.totalSold} sales</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{percent}%</div>
                  </div>
                  <Progress value={percent} className="h-2 bg-gray-100" indicatorClassName="bg-[#ffb729]" />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
