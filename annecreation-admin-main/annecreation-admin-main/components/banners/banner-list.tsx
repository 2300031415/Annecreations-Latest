"use client"

import { BannerDialog } from "./BannerDialog"
import { useState, useMemo } from "react"
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    MoreHorizontal,
    Edit,
    Trash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetBannersQuery, useDeleteBannerMutation } from "@/lib/redux/api/bannersApi"
import { useToast } from "@/components/ui/use-toast"
import {
    DropdownMenu,
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
} from "@/components/ui/alert-dialog"
import { formatDateOnlyIST } from "@/lib/date-utils"

export function BannersList() {
    const { data: banners = [], isLoading } = useGetBannersQuery()
    const [deleteBanner] = useDeleteBannerMutation()
    const { toast } = useToast()

    const [sortField, setSortField] = useState<"title" | "createdAt">("createdAt")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [searchQuery, setSearchQuery] = useState("")

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Controlled delete dialog state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState<any>(null)

    const openDeleteDialog = (banner: any) => {
        setSelectedBanner(banner)
        setIsDeleteOpen(true)
    }

    const closeDeleteDialog = () => {
        setSelectedBanner(null)
        setIsDeleteOpen(false)
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteBanner(id).unwrap()
            toast({
                title: "Deleted",
                description: "The banner was deleted successfully.",
            })
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete banner. Please try again.",
            })
        } finally {
            closeDeleteDialog()
        }
    }

    const filteredAndSortedBanners = useMemo(() => {
        return banners
            .filter((banner) =>
                searchQuery ? banner.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
            )
            .sort((a, b) => {
                if (sortField === "title") {
                    return sortDirection === "asc"
                        ? a.title.localeCompare(b.title)
                        : b.title.localeCompare(a.title)
                } else {
                    return sortDirection === "asc"
                        ? a.createdAt.localeCompare(b.createdAt)
                        : b.createdAt.localeCompare(a.createdAt)
                }
            })
    }, [banners, sortField, sortDirection, searchQuery])

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedBanners.length / itemsPerPage))

    const paginatedBanners = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredAndSortedBanners.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredAndSortedBanners, currentPage, itemsPerPage])

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page)
    }

    return (
        <div>
            {isLoading ? (
                <p className="p-4 text-gray-500">Loading banners...</p>
            ) : (
                <Card className="border border-gray-200 bg-white shadow-md">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">All Banners</CardTitle>
                                <CardDescription className="text-gray-500">
                                    {filteredAndSortedBanners.length} banners found
                                </CardDescription>
                            </div>

                            {/* Add Banner button */}
                            <BannerDialog>
                                <Button>Add Banner</Button>
                            </BannerDialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-gray-200">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead
                                            className="font-semibold text-gray-700 cursor-pointer"
                                            onClick={() => {
                                                setSortField("title")
                                                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                                            }}
                                        >
                                            Title
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Sort Order</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Device Type</TableHead> 
                                        <TableHead className="font-semibold text-gray-700">Created At</TableHead>

                                        <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedBanners.length > 0 ? (
                                        paginatedBanners.map((banner) => (
                                            <TableRow key={banner._id} className="hover:bg-gray-50">
                                                <TableCell>{banner.title}</TableCell>
                                                <TableCell>{banner.description || "-"}</TableCell>
                                                <TableCell>{banner.sortOrder || "-"}</TableCell>
                                                <TableCell className="capitalize">{banner.deviceType}</TableCell> 
                                                <TableCell>{formatDateOnlyIST(banner.createdAt)}</TableCell>
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
                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => openDeleteDialog(banner)}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No banners found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                                        <ChevronsLeftIcon className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                        <ChevronLeftIcon className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                                        <ChevronsRightIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {/* Single Delete Dialog */}
                    {selectedBanner && (
                        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. The banner <strong>{selectedBanner.title}</strong> will be permanently deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => handleDelete(selectedBanner._id)}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </Card>
            )}
        </div>
    )
}
