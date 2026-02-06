"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDateOnlyIST } from "@/lib/date-utils"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CategoryDialog } from "./category-dialog"
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/lib/redux/api/categoryApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const sortPositionRanges = ["1-10", "11-20", "21-30", "31-40"]

interface ApiCategory {
  _id: string
  name: string
  description?: string
  image?: string
  sortOrder: number
  status?: boolean
  createdAt?: string
  updatedAt?: string
  productCount?: number
}

export function CategoriesList() {
  // Fetch categories
  const { data: categoriesApiData, isLoading, isError } = useGetCategoriesQuery({})
  const [deleteCategory] = useDeleteCategoryMutation()

  // Sorting state
  const [sortField, setSortField] = useState<"name" | "count" | "sortPosition" | "updatedAt">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRanges, setSelectedRanges] = useState<string[]>(sortPositionRanges)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  const { canUpdate, canDelete } = usePermissions()


  // Defensive: extract categories safely
  let apiCategories: ApiCategory[] = []
  if (
    categoriesApiData &&
    typeof categoriesApiData === "object" &&
    "data" in categoriesApiData &&
    Array.isArray((categoriesApiData as any).data)
  ) {
    apiCategories = (categoriesApiData as any).data
  }

  // Normalize categories
  const categoriesData = apiCategories.map((cat) => ({
    id: cat._id,
    name: cat.name,
    count: cat.productCount ?? 0,
    sortPosition: cat.sortOrder ?? 0,
    status: cat.status ?? true,
    sortOrder: cat.sortOrder ?? 0,
    productCount: cat.productCount ?? 0,
    description: cat.description || "",
    image: cat.image || "",
    createdAt: cat.createdAt || "",
    updatedAt: cat.updatedAt || "",
  }))

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap()
      console.log("Category deleted:", id)
    } catch (err) {
      console.error("Failed to delete category:", err)
    }
  }

  // Sorting logic
  const handleSort = (field: "name" | "count" | "sortPosition" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter + sort
  const filteredAndSortedCategories = useMemo(() => {
    return categoriesData
      .filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        switch (sortField) {
          case "name":
            return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          case "sortPosition":
            return sortDirection === "asc" ? a.sortPosition - b.sortPosition : b.sortPosition - a.sortPosition;
          case "count":
            return sortDirection === "asc" ? a.count - b.count : b.count - a.count;
          case "updatedAt":
            return sortDirection === "asc"
              ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
              : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          default:
            return 0;
        }
      })
  }, [categoriesData, sortField, sortDirection, searchQuery, selectedRanges])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCategories.length / itemsPerPage)
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCategories.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCategories, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const toggleSortPositionRange = (range: string) => {
    if (selectedRanges.includes(range)) {
      setSelectedRanges(selectedRanges.filter((r) => r !== range))
    } else {
      setSelectedRanges([...selectedRanges, range])
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedRanges(sortPositionRanges)
  }

  if (isLoading) return <div>Loading categories...</div>
  if (isError) return <div>Error loading categories.</div>

  return (
    <Card className="border border-gray-200 bg-white shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Categories</CardTitle>
            <CardDescription className="text-gray-500">
              {filteredAndSortedCategories.length} categories found
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 border-gray-300"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 border-gray-300">
                  <FilterIcon className="h-4 w-4" />
                  Filter
                  {selectedRanges.length < sortPositionRanges.length && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      {selectedRanges.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Sort Position</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortPositionRanges.map((range) => (
                  <DropdownMenuCheckboxItem
                    key={range}
                    checked={selectedRanges.includes(range)}
                    onCheckedChange={() => toggleSortPositionRange(range)}
                  >
                    {range}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="outline" size="sm" className="w-full border-gray-300" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortField === "name" && (sortDirection === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("sortPosition")}
                  >
                    Sort Position
                    {sortField === "sortPosition" && (sortDirection === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("count")}
                  >
                    Products
                    {sortField === "count" && (sortDirection === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Last Updated
                    {sortField === "updatedAt" && (sortDirection === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                    <TableCell>{category.sortPosition}</TableCell>
                    <TableCell>{category.count}</TableCell>
                    <TableCell>{formatDateOnlyIST(category.updatedAt)}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {canUpdate('categories') && (
                        <CategoryDialog mode="edit" category={category}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </Button>
                        </CategoryDialog>
                      )}

                      {canDelete('categories') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCategoryToDelete(category.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No categories found.
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
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-gray-300">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Items per page</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="mx-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
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
                Are you sure you want to delete this category{" "}
                <strong>
                  {categoriesData.find((cat) => cat.id === categoryToDelete)?.name}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (categoryToDelete) {
                    await handleDelete(categoryToDelete)
                    setIsDeleteDialogOpen(false)
                    setCategoryToDelete(null)
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

