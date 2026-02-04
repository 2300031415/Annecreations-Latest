"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function OnlineUsersMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Locations</CardTitle>
        <CardDescription>Geographic distribution of active users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/9] overflow-hidden rounded-md border bg-muted">
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium">India Map Visualization</h3>
              <p className="text-sm text-muted-foreground mt-1">Active users across India</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">North India</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">South India</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">East India</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-xs text-muted-foreground">West India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center rounded-lg border p-2">
            <div className="text-xl font-bold">24</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-2">
            <div className="text-xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Cities</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-2">
            <div className="text-xl font-bold">1</div>
            <div className="text-xs text-muted-foreground">Country</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
