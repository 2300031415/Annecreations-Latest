"use client"

import { Edit, MoreHorizontal, Trash } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CategoryDialog } from "./category-dialog"

const categories = [
  {
    id: 1,
    name: "Women's Fashion",
    slug: "womens-fashion",
    parent: null,
    image: "/abstract-geometric-shapes.png",
    status: "Visible",
    featured: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Men's Fashion",
    slug: "mens-fashion",
    parent: null,
    image: "/abstract-geometric-shapes.png",
    status: "Visible",
    featured: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Accessories",
    slug: "accessories",
    parent: null,
    image: "/abstract-geometric-shapes.png",
    status: "Visible",
    featured: false,
    sortOrder: 3,
  },
  {
    id: 4,
    name: "Dresses",
    slug: "dresses",
    parent: "Women's Fashion",
    image: "/abstract-geometric-shapes.png",
    status: "Visible",
    featured: false,
    sortOrder: 1,
  },
  {
    id: 5,
    name: "Shirts",
    slug: "shirts",
    parent: "Men's Fashion",
    image: "/abstract-geometric-shapes.png",
    status: "Visible",
    featured: false,
    sortOrder: 1,
  },
]

export function CategoriesTable() {
  return (
    <Card className="border border-gray-200 bg-white shadow-md">
      <CardHeader>
        <CardTitle>All Categories</CardTitle>
        <CardDescription>
          A list of all the categories in your store including their name, status, and other details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[80px] font-semibold text-gray-700">Image</TableHead>
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Slug</TableHead>
              <TableHead className="font-semibold text-gray-700">Parent</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Featured</TableHead>
              <TableHead className="font-semibold text-gray-700">Sort Order</TableHead>
              <TableHead className="w-[100px] text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                <TableCell className="text-gray-700">{category.slug}</TableCell>
                <TableCell className="text-gray-700">{category.parent || "-"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      category.status === "Visible" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      category.featured ? "bg-[#ffb729]/20 text-[#311807]" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.featured ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell className="text-gray-700">{category.sortOrder}</TableCell>
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
                      <CategoryDialog mode="edit" category={category}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </CategoryDialog>
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
