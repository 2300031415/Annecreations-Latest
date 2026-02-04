"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
  Edit,
  Trash,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductDialog } from "./product-dialog";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from "@/lib/redux/api/productApi";
import { ProductImage } from "@/components/ui/product-image";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { usePermissions } from "@/hooks/use-permissions"

export function ProductsList() {
  const searchParams = useSearchParams()
  
  // State for sorting
  const [sortField, setSortField] = useState<"name" | "price" | "category" | "createdAt" | "salesCount">(
    "salesCount"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<boolean[]>([
    true,
    false,
  ]);

  // State for date range
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Read URL params and pre-populate date range
  useEffect(() => {
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    
    if (urlDateFrom && urlDateTo) {
      setDateFrom(urlDateFrom);
      setDateTo(urlDateTo);
      setAppliedDateFrom(urlDateFrom);
      setAppliedDateTo(urlDateTo);
    }
  }, [searchParams]);

  const formatDateForApi = (date: string) => {
    if (!date) return undefined;
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) return undefined;
    return formattedDate.toISOString().split('T')[0];
  };

  // Fetch products
  const { data: productData, isLoading } = useGetProductsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
    sortBy: sortField,
    sortOrder: sortDirection,
    dateFrom: formatDateForApi(appliedDateFrom),
    dateTo: formatDateForApi(appliedDateTo),
  });

  // Toast notifications
  const { toast } = useToast();

  // Delete product mutation
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()
  const { canUpdate, canDelete } = usePermissions()


  // Toggle status selection
  const toggleStatus = (status: boolean) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter((s) => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus([true, false]);
    setSortField("salesCount");
    setSortDirection("desc");
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  // Function to handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    try {
      const result = await deleteProduct(productId.toString()).unwrap();
      toast({
        title: "Product deleted",
        description: result.message || "Product was deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };
  function buildImageUrl(imagePath?: string) {
    if (!imagePath) return "/placeholder.png";

    const base = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "").replace(/\/+$/, "");
    const path = imagePath.replace(/^\/+/, ""); // remove leading slashes
    return base ? `${base}/${path}` : `/${path}`; // if no base, use relative path
  }

  return (
    <Card className="border border-gray-200 bg-white shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Date range filter applies only to sales count</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-gray-300"
                  max={dateTo || undefined}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-gray-300"
                  min={dateFrom || undefined}
                />
              </div>

              <Button
                variant="outline"
                className="border-gray-300"
                onClick={() => {
                  setAppliedDateFrom(dateFrom);
                  setAppliedDateTo(dateTo);
                  setCurrentPage(1);
                }}
                disabled={!dateFrom && !dateTo}
              >
                Apply Filter
              </Button>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  className="text-gray-600"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setAppliedDateFrom("");
                    setAppliedDateTo("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                All Products
              </CardTitle>
              <CardDescription className="text-gray-500">
                {productData?.pagination.total || 0} products found
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-auto">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
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
                  Status
                  {selectedStatus.length < 2 && (
                    <Badge className="ml-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/80">
                      {selectedStatus.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedStatus.includes(true)}
                  onCheckedChange={() => toggleStatus(true)}
                >
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus.includes(false)}
                  onCheckedChange={() => toggleStatus(false)}
                >
                  Inactive
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split("-") as ["name" | "price" | "category" | "createdAt" | "salesCount", "asc" | "desc"]
                setSortField(field)
                setSortDirection(direction)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] border-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salesCount-desc">Sales (High to Low)</SelectItem>
                <SelectItem value="salesCount-asc">Sales (Low to High)</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-gray-300"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[80px] font-semibold text-gray-700">
                  Image
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Product Model
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Category
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Sales
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading products...
                  </TableCell>
                </TableRow>

              ) : (productData?.data?.length ?? 0) > 0 ? (
                productData.data.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200">
                        <ProductImage
                          src={product.image}
                          alt={product.productModel}
                          width={50}
                          height={80}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-gray-900">
                      { product.productModel}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {product.categories?.map((c) => c.name).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {product.salesCount !== undefined ? product.salesCount.toLocaleString() : "0"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {product.status ? "Active" : "Inactive"}
                      </Badge>
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
                          {canUpdate('products') && (
                            <ProductDialog mode="edit" product={product}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </ProductDialog>
                          )}
                          {canDelete('products') && (
                            <ConfirmDialog
                              title="Delete Product"
                              description={`Are you sure you want to delete  "${product.seo?.metaTitle ?? product.productModel}"?`}
                              confirmText="Delete"
                              cancelText="Cancel"
                              variant="destructive"
                              isLoading={isDeleting}
                              onConfirm={() => handleDeleteProduct(product._id)}
                              trigger={
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              }
                            />
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))

              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No products found.
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
                setItemsPerPage(Number(value));
                setCurrentPage(1);
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
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="mx-2 text-sm">
              Page {currentPage} of {productData?.pagination.pages || 1}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === (productData?.pagination.pages || 1)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300"
              onClick={() => setCurrentPage(productData?.pagination.pages || 1)}
              disabled={currentPage === (productData?.pagination.pages || 1)}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
