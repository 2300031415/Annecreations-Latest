"use client"

import { useState } from "react"
import { Edit, MoreHorizontal, Search, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MachineDialog } from "@/components/machines/machine-dialog"

// Sample machine categories
const machineCategories = [
  {
    id: "1",
    name: "Usha-JEF-450-11x8",
    subcategories: ["Standard", "Advanced"],
    dimensions: "11x8",
    format: "JEF",
  },
  {
    id: "2",
    name: "Usha-JEF-550-14x8",
    subcategories: ["Standard", "Professional"],
    dimensions: "14x8",
    format: "JEF",
  },
  {
    id: "3",
    name: "Brother-DST-v3se-12x8",
    subcategories: ["Basic", "Premium"],
    dimensions: "12x8",
    format: "DST",
  },
  {
    id: "4",
    name: "Brother-Pes-bp3600-14x9.5",
    subcategories: ["Standard", "Deluxe"],
    dimensions: "14x9.5",
    format: "PES",
  },
  {
    id: "5",
    name: "Bernina-dst-14x8",
    subcategories: ["Regular", "Professional"],
    dimensions: "14x8",
    format: "DST",
  },
  {
    id: "6",
    name: "DST for both multi + v3",
    subcategories: ["Multi", "V3"],
    dimensions: "Various",
    format: "DST",
  },
]

export function MachinesList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const filteredCategories = machineCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machine Categories</CardTitle>
        <CardDescription>Manage machine categories and subcategories for your embroidery machines.</CardDescription>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search categories..."
            className="h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Category Name</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.subcategories.join(", ")}</TableCell>
                <TableCell>{category.dimensions}</TableCell>
                <TableCell>{category.format}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCategory(category)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
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
      {editingCategory && (
        <MachineDialog open={showEditDialog} onOpenChange={setShowEditDialog} category={editingCategory} mode="edit" />
      )}
    </Card>
  )
}
