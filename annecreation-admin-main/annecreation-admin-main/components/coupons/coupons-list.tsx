"use client"

import { useState, useMemo, useEffect } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDeleteCouponMutation, useGetCouponsQuery } from "@/lib/redux/api/couponsApi"
import { usePermissions } from "@/hooks/use-permissions"
import { useToast } from "@/components/ui/use-toast"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CouponDialog } from "./coupon-dialog"
import { formatDateOnlyIST } from "@/lib/date-utils"

export function CouponsList() {
  const { data: coupons = [], isLoading } = useGetCouponsQuery()
  const [deleteCoupon] = useDeleteCouponMutation()
  const { toast } = useToast()
  const { canUpdate, canDelete } = usePermissions()

  const discountTypes = ["Percentage", "Fixed Amount"]

  const [sortField, setSortField] = useState<"name" | "dateStart" | "dateEnd">("dateStart")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [searchQuery, setSearchQuery] = useState("")
  // const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedDiscountTypes, setSelectedDiscountTypes] = useState<string[]>(discountTypes)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // const statuses = useMemo(() => {
  //   return Array.from(new Set(coupons.map((coupon) => coupon.status)))
  // }, [coupons])

  // useEffect(() => {
  //   if (statuses.length > 0) {
  //     setSelectedStatuses((prev) => (prev.length === 0 ? statuses : prev))
  //   }
  // }, [statuses])

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id).unwrap()
      toast({
        title: "Deleted ",
        description: "The coupon was deleted successfully.",
      })
    } catch (err) {
      console.error("Delete failed:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete coupon. Please try again.",
      })
    }
  }

  const filteredAndSortedCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => {
        if (searchQuery) {
          return (
            coupon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        return true
      })
      //     .filter(
      //   (coupon) =>
      //     (selectedStatuses.length === 0 || selectedStatuses.includes(coupon.status ? "Active" : "Inactive")) &&
      //     (selectedDiscountTypes.length === 0 || selectedDiscountTypes.includes(coupon.discountType))
      // )

      .sort((a, b) => {
        if (sortField === "name") {
          return sortDirection === "asc"
            ? (a.name || "").localeCompare(b.name || "")
            : (b.name || "").localeCompare(a.name || "")
        } else if (sortField === "dateStart") {
          return sortDirection === "asc"
            ? ((a.dateStart || "")).localeCompare(b.dateStart || "")
            : ((b.dateStart || "")).localeCompare(a.dateStart || "")
        } else {
          return sortDirection === "asc"
            ? ((a.dateEnd || "")).localeCompare(b.dateEnd || "")
            : ((b.dateEnd || "")).localeCompare(a.dateEnd || "")
        }
      })

  }, [coupons, sortField, sortDirection, searchQuery, selectedDiscountTypes])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCoupons.length / itemsPerPage))

  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCoupons.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCoupons, currentPage, itemsPerPage])

  const handleSort = (field: "name" | "dateStart" | "dateEnd") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // const toggleStatus = (status: string) => {
  //   setSelectedStatuses((prev) =>
  //     prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
  //   )
  //   setCurrentPage(1)
  // }

  const toggleDiscountType = (type: string) => {
    setSelectedDiscountTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div>
      {isLoading ? (
        <p className="p-4 text-gray-500">Loading coupons...</p>
      ) : (
        <>
          <Card className="border border-gray-200 bg-white shadow-md">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">All Coupons</CardTitle>
                  <CardDescription className="text-gray-500">{filteredAndSortedCoupons.length} coupons found</CardDescription>
                </div>
                {/* search + filters */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Coupon Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Code</TableHead>
                      <TableHead className="font-semibold text-gray-700">Discount</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date Start</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date End</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.length > 0 ? (
                      paginatedCoupons.map((coupon) => (
                        <TableRow key={coupon._id} className="hover:bg-gray-50">
                          <TableCell>{coupon.name}</TableCell>
                          <TableCell>{coupon.code}</TableCell>
                          <TableCell>{coupon.discount}</TableCell>
                          <TableCell>{formatDateOnlyIST(coupon.dateStart)}</TableCell>
                          <TableCell>{formatDateOnlyIST(coupon.dateEnd)}</TableCell>
                          <TableCell>

                            <Badge
                              className={`px-2 py-1 text-sm font-medium ${coupon.status === true
                                ? "bg-green-100 text-green-800"
                                : coupon.status === false
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {typeof coupon.status === "boolean"
                                ? coupon.status ? "Active" : "Inactive"
                                : coupon.status || "N/A"}
                            </Badge>



                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {canUpdate('coupons') && (
                                  <CouponDialog mode="edit" coupon={coupon}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </CouponDialog>
                                )}
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Code
                                </DropdownMenuItem>
                                {canDelete('coupons') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {/* ✅ Delete Confirmation Dialog */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. The coupon <strong>{coupon.name}</strong> will be permanently deleted.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-600 text-white hover:bg-red-700"
                                            onClick={() => handleDelete(coupon._id)}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No coupons found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardContent>
              <div className="rounded-lg border border-gray-200">
                <Table>
                  {/* ... table header/body as before ... */}
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

          </Card>
        </>
      )}
    </div>
  )
}
