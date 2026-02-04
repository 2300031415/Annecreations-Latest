import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, IndianRupeeIcon, UsersIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SalesPerformance() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹1,28,456</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUpIcon className="h-3 w-3 mr-1" />
              +12.5%
            </span>{" "}
            from last month
          </p>
          <div className="mt-4 h-1 w-full bg-muted">
            <div className="h-1 w-[75%] bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">75% of monthly target</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹1,245</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUpIcon className="h-3 w-3 mr-1" />
              +3.2%
            </span>{" "}
            from last month
          </p>
          <div className="mt-4 h-1 w-full bg-muted">
            <div className="h-1 w-[60%] bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">60% of target AOV</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3.8%</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500 flex items-center">
              <ArrowDownIcon className="h-3 w-3 mr-1" />
              -0.5%
            </span>{" "}
            from last month
          </p>
          <div className="mt-4 h-1 w-full bg-muted">
            <div className="h-1 w-[38%] bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">38% of industry average</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repeat Purchase Rate</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">28.4%</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUpIcon className="h-3 w-3 mr-1" />
              +2.1%
            </span>{" "}
            from last month
          </p>
          <div className="mt-4 h-1 w-full bg-muted">
            <div className="h-1 w-[65%] bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">65% of target</p>
        </CardContent>
      </Card>
    </div>
  )
}
