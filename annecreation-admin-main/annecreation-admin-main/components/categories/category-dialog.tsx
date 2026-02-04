"use client"

import { useState } from "react"
import type React from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CategoryDetailsForm } from "./category-details-form"
import { CategorySeoForm } from "./category-seo-form"
import { useCreateCategoryMutation, useUpdateCategoryMutation } from "@/lib/redux/api/categoryApi"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"

interface CategoryDialogProps {
  children: React.ReactNode
  mode?: "create" | "edit"
  category?: any
}

export interface CategoryFormData {
  name: string
  slug: string
  parent: string
  shortDescription: string
  description: string
  status: string
  sortOrder: string
  featured: boolean
  displayType: string
  categoryImages: File[]
  categoryPreviews: string[]
  bannerImages: File[]
  bannerPreviews: string[]
  thumbnailImages: File[]
  thumbnailPreviews: string[]
}

export function CategoryDialog({ children, mode = "create", category }: CategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "", slug: "", parent: "", shortDescription: "", description: "",
    status: "Visible", sortOrder: "0", featured: false, displayType: "both",
    categoryImages: [], categoryPreviews: [], bannerImages: [], bannerPreviews: [],
    thumbnailImages: [], thumbnailPreviews: [],
  })

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const { canCreate, canUpdate } = usePermissions()

 
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)

    if (isOpen && mode === "edit" && category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        parent: category.parent_id?.toString() || "",
        shortDescription: category.short_description || "",
        description: category.description || "",
        status: category.status ? "Visible" : "Hidden",
        sortOrder: category.sortOrder?.toString() || "0",
       
        featured: category.featured || false,
        displayType: category.display_type || "both",
        categoryImages: [],
        categoryPreviews: category.image ? [category.image] : [],
        bannerImages: [],
        bannerPreviews: category.bannerImages || [],
        thumbnailImages: [],
        thumbnailPreviews: category.thumbnailImages || [],
      })
    }
  }

  const handleFormChange = (id: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const resetFormData = () => {
    setFormData({
      name: "", slug: "", parent: "", shortDescription: "", description: "",
      status: "Visible", sortOrder: "0", featured: false, displayType: "both",
      categoryImages: [], categoryPreviews: [], bannerImages: [], bannerPreviews: [],
      thumbnailImages: [], thumbnailPreviews: [],
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const form = new FormData()
      const categoryId = category?._id || category?.id

      form.append("languageId", categoryId|| "")

      form.append("name", formData.name)
      form.append("slug", formData.slug)
      form.append("description", formData.description || "No description provided")
      form.append("shortDescription", formData.shortDescription)
      form.append("parent_id", formData.parent || "")
      form.append("sortOrder", String(Number(formData.sortOrder) || 0))
      form.append("status", formData.status === "Visible" ? "true" : "false")
      form.append("featured", String(formData.featured))
      form.append("displayType", formData.displayType)

      const seoPayload = {
        metaTitle: formData.name,
        metaDescription: formData.shortDescription,
        metaKeyword: formData.slug,
      }
      form.append("seo", JSON.stringify(seoPayload))

      if (formData.categoryImages.length > 0) form.append("image", formData.categoryImages[0])
      formData.bannerImages.forEach(file => form.append("bannerImages", file))
      formData.thumbnailImages.forEach(file => form.append("thumbnailImages", file))
        console.log("FormData being sent:")
    for (const [key, value] of form.entries()) {
      console.log(key, value)
    }

      if (mode === "edit") {
        if (!categoryId) return toast.error("Missing category ID for update")
        await updateCategory({ id: categoryId, formData: form }).unwrap()
        toast.success("Category updated successfully")
      } else {
        await createCategory(form).unwrap()
        
        toast.success("Category created successfully")

        
      }

      resetFormData()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting category:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  const handleCancel = () => {
    setOpen(false)
    if (mode === "create") resetFormData()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Category" : "Edit Category"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new category for your products."
              : "Update the details of this category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Category Details</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <CategoryDetailsForm
                formData={formData}
                onFormChange={handleFormChange}
                categoryImages={formData.categoryImages}
                categoryPreviews={formData.categoryPreviews}
                bannerImages={formData.bannerImages}
                bannerPreviews={formData.bannerPreviews}
                thumbnailImages={formData.thumbnailImages}
                thumbnailPreviews={formData.thumbnailPreviews}
                onCategoryImageSelect={files =>
                  setFormData(prev => ({
                    ...prev,
                    categoryImages: [...prev.categoryImages, ...files],
                    categoryPreviews: [...prev.categoryPreviews, ...files.map(f => URL.createObjectURL(f))],
                  }))
                }
                onRemoveCategoryImage={index =>
                  setFormData(prev => ({
                    ...prev,
                    categoryImages: prev.categoryImages.filter((_, i) => i !== index),
                    categoryPreviews: prev.categoryPreviews.filter((_, i) => i !== index),
                  }))
                }
                onBannerImageSelect={files =>
                  setFormData(prev => ({
                    ...prev,
                    bannerImages: [...prev.bannerImages, ...files],
                    bannerPreviews: [...prev.bannerPreviews, ...files.map(f => URL.createObjectURL(f))],
                  }))
                }
                onRemoveBannerImage={index =>
                  setFormData(prev => ({
                    ...prev,
                    bannerImages: prev.bannerImages.filter((_, i) => i !== index),
                    bannerPreviews: prev.bannerPreviews.filter((_, i) => i !== index),
                  }))
                }
                onThumbnailImageSelect={files =>
                  setFormData(prev => ({
                    ...prev,
                    thumbnailImages: [...prev.thumbnailImages, ...files],
                    thumbnailPreviews: [...prev.thumbnailPreviews, ...files.map(f => URL.createObjectURL(f))],
                  }))
                }
                onRemoveThumbnailImage={index =>
                  setFormData(prev => ({
                    ...prev,
                    thumbnailImages: prev.thumbnailImages.filter((_, i) => i !== index),
                    thumbnailPreviews: prev.thumbnailPreviews.filter((_, i) => i !== index),
                  }))
                }
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <CategorySeoForm category={category} />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {((mode === "create" && canCreate('categories')) || (mode === "edit" && canUpdate('categories'))) && (
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary text-white hover:bg-primary/90">
                {mode === "create" ? "Create" : "Update"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
