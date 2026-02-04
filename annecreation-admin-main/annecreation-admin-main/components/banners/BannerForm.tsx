"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface BannerFormProps {
  banner?: any
  onChange?: (data: any) => void
}

export function BannerForm({ banner, onChange }: BannerFormProps) {
  const [title, setTitle] = useState(banner?.title || "")
  const [description, setDescription] = useState(banner?.description || "")
  const [sortOrder, setSortOrder] = useState<number | "">(banner?.sortOrder ?? "")
  const [status, setStatus] = useState<boolean>(banner?.status ?? true)
  const [deviceType, setDeviceType] = useState<'mobile' | 'web'>(banner?.deviceType || 'web')


  // Files
  const [mobileFiles, setMobileFiles] = useState<File[]>([])
  const [websiteFiles, setWebsiteFiles] = useState<File[]>([])

  // Existing image URLs (for edit mode)
  const [mobileImages, setMobileImages] = useState<string[]>(banner?.mobileImages || [])
  const [websiteImages, setWebsiteImages] = useState<string[]>(banner?.websiteImages || [])

  useEffect(() => {
    onChange?.({
      title,
      description,
      sortOrder,
      status,
      mobileFiles,
      deviceType,
      websiteFiles,
      mobileImages,
      websiteImages,
    })
  }, [title, description, sortOrder, status, mobileFiles, deviceType, websiteFiles, mobileImages, websiteImages])

  const handleFileChange = (files: FileList | null, setFiles: any) => {
    if (!files) return
    const validFiles = Array.from(files).filter((file) => {
      const isValidType = ["image/png", "image/jpeg"].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024
      if (!isValidType) alert(`${file.name} is not PNG/JPG`)
      if (!isValidSize) alert(`${file.name} exceeds 5MB`)
      return isValidType && isValidSize
    })
    setFiles(validFiles)
  }

  const removeExistingImage = (index: number, type: "mobile" | "website") => {
    if (type === "mobile") setMobileImages(prev => prev.filter((_, i) => i !== index))
    if (type === "website") setWebsiteImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-6">

      {/* Banner Info */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Banner Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter banner title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              placeholder="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter banner description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Status */}
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status ? "Active" : "Inactive"} onValueChange={(val) => setStatus(val === "Active")}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid gap-2">
          <Label htmlFor="deviceType">Device Type *</Label>
          <Select value={deviceType} onValueChange={(val) => setDeviceType(val as 'mobile' | 'web')}>
            <SelectTrigger id="deviceType">
              <SelectValue placeholder="Select device type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Mobile Images */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Mobile Images</h3>
        <Input
          type="file"
          multiple
          accept="image/png, image/jpeg"
          onChange={(e) => handleFileChange(e.target.files, setMobileFiles)}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {mobileImages.map((url, i) => (
            <div key={i} className="relative border rounded-lg overflow-hidden">
              <img src={url} alt={`Mobile ${i}`} className="object-cover w-full h-24" />
              <Button
                size="sm"
                className="absolute top-1 right-1 bg-red-500 text-white"
                onClick={() => removeExistingImage(i, "mobile")}
              >
                X
              </Button>
            </div>
          ))}
          {mobileFiles.map((file, i) => (
            <div key={i} className="relative border rounded-lg overflow-hidden">
              <img src={URL.createObjectURL(file)} alt={`Mobile ${i}`} className="object-cover w-full h-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Website Images */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Website Images</h3>
        <Input
          type="file"
          multiple
          accept="image/png, image/jpeg"
          onChange={(e) => handleFileChange(e.target.files, setWebsiteFiles)}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {websiteImages.map((url, i) => (
            <div key={i} className="relative border rounded-lg overflow-hidden">
              <img src={url} alt={`Website ${i}`} className="object-cover w-full h-24" />
              <Button
                size="sm"
                className="absolute top-1 right-1 bg-red-500 text-white"
                onClick={() => removeExistingImage(i, "website")}
              >
                X
              </Button>
            </div>
          ))}
          {websiteFiles.map((file, i) => (
            <div key={i} className="relative border rounded-lg overflow-hidden">
              <img src={URL.createObjectURL(file)} alt={`Website ${i}`} className="object-cover w-full h-24" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
