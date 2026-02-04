"use client"
import { useState } from "react"
import { Clock, Laptop, Smartphone, Tablet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateIST } from "@/lib/date-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetOnlineUsersQuery } from "@/lib/redux/api/onlineUsersApi"
export function OnlineUsersList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const { data, isLoading, isError, refetch } = useGetOnlineUsersQuery({
    page: currentPage,
    limit: itemsPerPage,
  })
  const users = data?.users || []
  const analytics = data?.analytics
  const pagination = data?.pagination
  const totalPages = pagination?.pages || 1
  const totalOnlineUsers = analytics?.totalOnline || users.length
  if (isLoading) return <div>Loading online users...</div>
  if (isError) return <div>Failed to load online users</div>
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Active Visitors</CardTitle>
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>{totalOnlineUsers} online</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Current Page</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.ipAddress}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(() => {
                      let device: "desktop" | "mobile" | "tablet" = "desktop"
                      let browser = "Unknown"
                      let os = "Unknown"
                      const ua = user.userAgent || ""
                      if (/okhttp/i.test(ua)) {
                        device = "mobile"
                        browser = "App"
                        os = "Android"
                      }
                      else {
                        if (/Mobi|Android/i.test(ua)) device = "mobile"
                        else if (/Tablet|iPad/i.test(ua)) device = "tablet"
                        if (/Chrome/i.test(ua)) browser = "Chrome"
                        else if (/Firefox/i.test(ua)) browser = "Firefox"
                        else if (/Safari/i.test(ua)) browser = "Safari"
                        else if (/Edg/i.test(ua)) browser = "Edge"
                        if (/Windows/i.test(ua)) os = "Windows"
                        else if (/Macintosh/i.test(ua)) os = "macOS"
                        else if (/iPhone|iPad/i.test(ua)) os = "iOS"
                        else if (/Android/i.test(ua)) os = "Android"
                      }
                      return (
                        <>
                          {device === "desktop" && <Laptop className="h-4 w-4" />}
                          {device === "mobile" && <Smartphone className="h-4 w-4" />}
                          {device === "tablet" && <Tablet className="h-4 w-4" />}
                          <span className="text-xs">{browser} / {os}</span>
                        </>
                      )
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium">
                    {(() => {
                      const p = user.pageUrl
                      const link = <a href={p} className="text-blue-500 underline" target="_blank">{p}</a>

                      if (p === "HomeMain") return "Home Screen"
                      if (p === "DownloadsMain") return "Download Screen"
                      if (p === "CartMain") return "Cart Screen"
                      if (p === "WishlistMain") return "Wishlist Screen"
                      if (p === "ProfileMain") return "Profile Screen"
                      if (p === "MyProfile") return "My Profile Screen"
                      if (p === "MyOrders") return "My Orders Screen"
                      if (p === "ContactUs") return "Contact Us Screen"
                      if (p === "Category") return "Category Screen"
                      if (p === "CheckoutScreen") return "Checkout Screen"

                      if (p.startsWith("Designs-")) {
                        try {
                          const jsonPart = p.split("Designs-")[1]
                          const parsed = JSON.parse(jsonPart)
                          return `Categories - ${parsed.category_name || "Unknown"}`
                        } catch {
                          return "Designs - Unknown"
                        }
                      }

                      if (p.startsWith("ProductScreen-")) {
                        try {
                          const jsonPart = p.split("ProductScreen-")[1]
                          const parsed = JSON.parse(jsonPart)
                          return `Product - ${parsed.product_id || "Unknown"}`
                        } catch {
                          return "Product - Unknown"
                        }
                      }

                      return link || "N/A"
                    })()}

                    {/* {user.pageUrl === "HomeMain" ? "Home Screen" : user.pageUrl || "N/A"} */}
                  </span>
                </TableCell>
                <TableCell>
                  {user.displayName}
                </TableCell>
                <TableCell>
                  <span className="text-xs">{formatDateIST(user.lastActivity)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
