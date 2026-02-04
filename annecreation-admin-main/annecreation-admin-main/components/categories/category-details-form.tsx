"use client"

import { ImagePlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CategoryFormData } from "./category-dialog"
import { CategoryImageUpload } from "./category-image-upload"
import { useGetCategoriesQuery } from "@/lib/redux/api/categoryApi"
interface CategoryDetailsFormProps {
  formData: CategoryFormData;
  onFormChange: (id: keyof CategoryFormData, value: any) => void;
  categoryImages: File[];
  categoryPreviews: string[];
  onCategoryImageSelect: (files: File[]) => void;
  onRemoveCategoryImage: (index: number) => void;
  bannerImages: File[];
  bannerPreviews: string[];
  onBannerImageSelect: (files: File[]) => void;
  onRemoveBannerImage: (index: number) => void;
  thumbnailImages: File[];
  thumbnailPreviews: string[];
  onThumbnailImageSelect: (files: File[]) => void;
  onRemoveThumbnailImage: (index: number) => void;
  category?: any;
}

export function CategoryDetailsForm({
  formData,
  onFormChange,
  categoryImages,
  categoryPreviews,
  onCategoryImageSelect,
  onRemoveCategoryImage,
  bannerImages,
  bannerPreviews,
  onBannerImageSelect,
  onRemoveBannerImage,
  thumbnailImages,
  thumbnailPreviews,
  onThumbnailImageSelect,
  onRemoveThumbnailImage,
}: CategoryDetailsFormProps) {
  const { data: categoriesApiData, isLoading } = useGetCategoriesQuery({})
  const categories = Array.isArray(categoriesApiData?.data) ? categoriesApiData.data : []
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;

    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      onFormChange(id as keyof CategoryFormData, (e.target as HTMLInputElement).checked);
    } else {
      onFormChange(id as keyof CategoryFormData, value);
    }
  };

  const handleSelectChange = (id: keyof CategoryFormData, value: string) => {
    onFormChange(id, value);
  };



  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-1">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-gray-700">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter category name"
              value={formData.name}
              onChange={handleInputChange}
              className="border-gray-300"
              required
            />
          </div>
          <div className="grid gap-2">
          {/* <Label htmlFor="parent" className="text-gray-700">
            Parent Category
          </Label>
          <Select
            value={formData.parent}
            onValueChange={(val) => handleSelectChange("parent", val)}
            disabled={isLoading}
          >
            <SelectTrigger id="parent" className="border-gray-300">
              <SelectValue placeholder="Select parent category (optional)" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              <SelectItem value="none">None (Top Level)</SelectItem>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No categories found</SelectItem>
              )}
            </SelectContent>

          </Select> */}
        </div>
          {/* <div className="grid gap-2">
            <Label htmlFor="slug" className="text-gray-700">
              Slug
            </Label>
            <Input
              id="slug"
              placeholder="url-friendly-name"
              value={formData.slug}
              onChange={handleInputChange}
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">Auto-generated from name if left blank. Used in URLs.</p>
          </div> */}
        </div>

        
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="short-description" className="text-gray-700">
            Short Description
          </Label>
          <Textarea
            id="description"
            placeholder="Enter a brief summary of the category"
            className="min-h-[80px] resize-y border-gray-300"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div className="grid gap-3">
          <CategoryImageUpload
            label="Category Image"
            onImageSelect={onCategoryImageSelect}
            selectedImages={categoryImages}
            previewImages={categoryPreviews}
            onRemoveImage={onRemoveCategoryImage}
            maxFiles={1}
            className=""
            inputId="category-image-upload"
          />
        </div>
        {/* <div className="grid gap-3">
          <CategoryImageUpload
            label="Thumbnail Image (Optional)"
            onImageSelect={onThumbnailImageSelect}
            selectedImages={thumbnailImages}
            previewImages={thumbnailPreviews}
            onRemoveImage={onRemoveThumbnailImage}
            maxFiles={1}
            className=""
            inputId="thumbnail-image-upload"
          />
        </div> */}
      </div>

      <div className="grid gap-3">
        {/* <h3 className="text-lg font-medium text-gray-900">Descriptions</h3> */}
        

        {/* <div className="grid gap-2">
          <Label htmlFor="full-description" className="text-gray-700">
            Full Description
          </Label>
          <Textarea
            id="fullDescription"
            placeholder="Enter detailed description of the category"
            className="min-h-[120px] resize-y border-gray-300"
            value={formData.fullDescription}
            onChange={handleInputChange}
          />
        </div> */}
      </div>

      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Status & Sorting</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 ">
            <Label htmlFor="visibility" className="text-gray-700">
              Visibility
            </Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleSelectChange("status", val)}
            >
              <SelectTrigger id="visibility" className="border-gray-300">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Visible">Visible</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sort-order" className="text-gray-700">
              Sort Order
            </Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              placeholder="0"
              value={formData.sortOrder}
              onChange={handleInputChange}
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">Lower numbers appear first</p>
          </div>

          {/* <div className="flex items-center gap-2 pt-8">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => onFormChange("featured", checked)}
            />
            <Label htmlFor="featured" className="text-gray-700">
              Featured Category
            </Label>
          </div> */}
        </div>
      </div>

      {/* <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="display-type" className="text-gray-700">
              Display Type
            </Label>
            <Select
              value={formData.displayType}
              onValueChange={(val) => handleSelectChange("displayType", val)}
            >
              <SelectTrigger id="display-type" className="border-gray-300">
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Products Only</SelectItem>
                <SelectItem value="subcategories">Subcategories Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <CategoryImageUpload
              label="Banner Image (Optional)"
              onImageSelect={onBannerImageSelect}
              selectedImages={bannerImages}
              previewImages={bannerPreviews}
              onRemoveImage={onRemoveBannerImage}
              maxFiles={1}
              className=""
              inputId="banner-image-upload"
            />
          </div>
        </div>
      </div> */}
    </div>
  )
}