"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
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
  Eye,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CustomerDialog } from "./customer-dialog"
import { useGetCustomersQuery, useDeleteCustomerMutation, useLoginAsCustomerMutation, Customer } from "@/lib/redux/api/admincustomerApi"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner";
import { BASE_URL } from "@/lib/redux/api/baseApi"
import { formatDateIST } from "@/lib/date-utils"

export function CustomersList() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [deleteCustomer] = useDeleteCustomerMutation()
  const [loginAsCustomer] = useLoginAsCustomerMutation()
  const { canUpdate, canDelete, canRead, isSuperAdmin } = usePermissions()
  const hasCustomersReadAccess = isSuperAdmin || canRead('customers')
  const hasLoginAsUserAccess = isSuperAdmin || canRead('loginAsUser')
  const canLoginAsCustomer = hasCustomersReadAccess && hasLoginAsUserAccess

  // Initialize sort from URL params if present
  const urlSortBy = searchParams.get('sortBy') as "createdAt" | "totalOrderAmount" | null
  const urlSortOrder = searchParams.get('sortOrder') as "asc" | "desc" | null
  
  const [sortField, setSortField] = useState<"createdAt" | "totalOrderAmount">(
    urlSortBy && ["createdAt", "totalOrderAmount"].includes(urlSortBy) ? urlSortBy : "createdAt"
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    urlSortOrder && ["asc", "desc"].includes(urlSortOrder) ? urlSortOrder : "desc"
  )

  // Update sort when URL params change
  useEffect(() => {
    if (urlSortBy && ["createdAt", "totalOrderAmount"].includes(urlSortBy)) {
      setSortField(urlSortBy)
    }
    if (urlSortOrder && ["asc", "desc"].includes(urlSortOrder)) {
      setSortDirection(urlSortOrder)
    }
  }, [urlSortBy, urlSortOrder])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchField, setSearchField] = useState<"all" | "firstName" | "email" | "mobile">("all")
  
  // Hardcoded statuses for toggle
  const statuses = ["true", "false"]
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const { data: customersResponse, isLoading, isError } = useGetCustomersQuery({
    page,
    limit,
    search: searchQuery,
    searchField: searchField === "all" ? undefined : searchField,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    sortBy: sortField,
    sortOrder: sortDirection
  })

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)

  const customersData = customersResponse?.data || []
  const totalCustomers = customersResponse?.pagination.total || 0
  const totalPages = customersResponse?.pagination.pages || 1


  const handleDelete = (id: string) => {
    setCustomerToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1) 
  }

  const toggleStatus = (status: string) => {
  // If already selected, unselect (show all)
  if (selectedStatuses.includes(status)) {
    setSelectedStatuses([]);
  } else {
    // Replace with only the clicked one
    setSelectedStatuses([status]);
  }
};

  const clearFilters = () => {
    setSearchQuery("")
    setSearchField("all")
    setSelectedStatuses([])
    setSortField("createdAt")
    setSortDirection("desc")
    setPage(1)
  }

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }

  if (isLoading) return <p className="py-10 text-center">Loading customers...</p>
  if (isError) return <p className="py-10 text-center text-red-500">Failed to load customers</p>

  return (
    <Card className="border border-gray-200 bg-white shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">All Customers</CardTitle>
            <CardDescription className="text-gray-500">
              {totalCustomers} customers found
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Select
                value={searchField}
                onValueChange={(value: "all" | "firstName" | "email" | "mobile") => {
                  setSearchField(value)
                  setPage(1)
                  if (searchQuery) handleSearch(searchQuery)
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="firstName">Customer Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-auto">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={`Search by ${searchField === "all" ? "any field" : searchField}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 border-gray-300 w-full"
                  disabled={isLoading}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => {
                      setSearchQuery("")
                      setPage(1)
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split("-") as ["createdAt" | "totalOrderAmount", "asc" | "desc"]
                setSortField(field)
                setSortDirection(direction)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] border-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="totalOrderAmount-desc">Highest Purchased</SelectItem>
                <SelectItem value="totalOrderAmount-asc">Lowest Purchased</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 border-gray-300">
                  <FilterIcon className="h-4 w-4" />
                  Status
                  {selectedStatuses.length < statuses.length && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  >
                    {status === "true" ? "Active" : "Inactive"}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="border-gray-300" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Customer Name</TableHead>
                <TableHead className="font-semibold text-gray-700">E-Mail</TableHead>
                <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
                <TableHead className="font-semibold text-gray-700">Email Verified</TableHead>
                <TableHead className="font-semibold text-gray-700">Mobile Verified</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Date Added</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-normal">
                  <span className="block">Total</span>
                  <span className="block">Purchased</span>
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : customersData.length > 0 ? (
                customersData.map((customer) => (
                  <TableRow key={customer._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{customer.firstName}</TableCell>
                    <TableCell className="text-gray-700">{customer.email}</TableCell>
                    <TableCell className="text-gray-700">{customer.mobile}</TableCell>
                    <TableCell>
                      <Badge
                        className={customer.emailVerified ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}
                      >
                        {customer.emailVerified ? "Verified" : "Not Verified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={customer.mobileVerified ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}
                      >
                        {customer.mobileVerified ? "Verified" : "Not Verified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={customer.status ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}
                      >
                        {customer.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{formatDateIST(customer.createdAt)}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      ₹{(customer.totalOrderAmount || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {canUpdate('customers') && (
                            <CustomerDialog mode="edit" customer={customer}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </CustomerDialog>
                          )}
                          {/* <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem> */}
                          {canLoginAsCustomer && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const response = await loginAsCustomer(customer._id).unwrap();
                                    localStorage.setItem('customerAccessToken', response.accessToken);
                                    localStorage.setItem('customerRefreshToken', response.refreshToken);

                                    const customerSiteUrl = `${BASE_URL}/Auth/Login` || 'https://annecreation.reesanit.com/Auth/Login';
                                    window.open(`${customerSiteUrl}?token=${response.accessToken}&origin=admin`, '_blank');

                                    toast.success(`Logged in as ${response.customer.firstName} ${response.customer.lastName}`);
                                  } catch (error: any) {
                                    console.error('Failed to login as customer:', error);
                                    toast.error(error.data?.message || 'Failed to login as customer');
                                  }
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Login as Customer
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete('customers') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(customer._id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-gray-300">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Items per page</p>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300" onClick={() => goToPage(1)} disabled={page === 1}>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300" onClick={() => goToPage(page - 1)} disabled={page === 1}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="mx-2 text-sm">
              Page {page} of {totalPages}
            </span>

            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300" onClick={() => goToPage(totalPages)} disabled={page === totalPages}>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer "{customersData.find(c => c._id === customerToDelete)?.firstName}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (customerToDelete) {
                    try {
                      await deleteCustomer(customerToDelete).unwrap()
                      setIsDeleteDialogOpen(false)
                      setCustomerToDelete(null)
                    } catch (err) {
                      console.error("Failed to delete customer:", err)
                    }
                  }
                }}
              >
                Yes, Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
