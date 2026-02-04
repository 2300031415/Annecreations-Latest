"use client"

import { ArrowDownIcon, ArrowUpIcon, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function OnlineUsersStats() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Visitor Statistics</CardTitle>
        <CardDescription>Real-time visitor metrics</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="now">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="now">Now</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="now" className="p-4 pt-3">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        12%
                      </span>
                      vs. 5 minutes ago
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">42</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        8%
                      </span>
                      vs. 5 minutes ago
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">3m 24s</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-red-500 flex items-center mr-1">
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                        5%
                      </span>
                      vs. 5 minutes ago
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">28.5%</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        2%
                      </span>
                      vs. 5 minutes ago
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="today" className="p-4 pt-3">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">342</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        18%
                      </span>
                      vs. yesterday
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">1,245</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        12%
                      </span>
                      vs. yesterday
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="week" className="p-4 pt-3">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">2,156</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        23%
                      </span>
                      vs. last week
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">8,432</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="text-green-500 flex items-center mr-1">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        15%
                      </span>
                      vs. last week
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
