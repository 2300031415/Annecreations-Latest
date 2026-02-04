"use client"

import type React from "react"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// Primary machine categories
const primaryCategories = [
  "Usha-JEF-450-11x8",
  "Usha-JEF-550-14x8",
  "Brother-DST-v3se-12x8",
  "Brother-Pes-bp3600-14x9.5",
  "Bernina-dst-14x8",
  "DST for both multi + v3",
]

interface MachineFormProps {
  initialData?: any
  onClose: () => void
  mode?: "add" | "edit"
}

export function MachineForm({ initialData, onClose, mode = "add" }: MachineFormProps) {
  const [category, setCategory] = useState(initialData?.name || "")
  const [subcategory, setSubcategory] = useState(initialData?.subcategories?.[0] || "")
  const [dimensions, setDimensions] = useState(initialData?.dimensions || "")
  const [format, setFormat] = useState(initialData?.format || "")
  const [isActive, setIsActive] = useState(initialData?.isActive !== false)
  const [description, setDescription] = useState(initialData?.description || "")

  // Extract dimensions and format from the selected category
  const handleCategoryChange = (value: string) => {
    setCategory(value)

    // Extract dimensions (e.g., "11x8" from "Usha-JEF-450-11x8")
    const dimensionsMatch = value.match(/(\d+x\d+(\.\d+)?)/i)
    if (dimensionsMatch) {
      setDimensions(dimensionsMatch[0])
    } else if (value.includes("multi")) {
      setDimensions("Various")
    }

    // Extract format (e.g., "JEF" from "Usha-JEF-450-11x8")
    if (value.includes("JEF")) {
      setFormat("JEF")
    } else if (value.includes("DST")) {
      setFormat("DST")
    } else if (value.includes("Pes")) {
      setFormat("PES")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({
      category,
      subcategory,
      dimensions,
      format,
      isActive,
      description,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Primary Category</Label>
          <Select value={category} onValueChange={handleCategoryChange} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {primaryCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Select from the predefined machine categories.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="Enter subcategory (e.g., Standard, Professional)"
          />
          <p className="text-xs text-gray-500">Specify a subcategory for further classification.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="e.g., 11x8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Input
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="e.g., DST, PES, JEF"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this machine category"
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{mode === "add" ? "Add Machine" : "Save Changes"}</Button>
      </div>
    </form>
  )
}
