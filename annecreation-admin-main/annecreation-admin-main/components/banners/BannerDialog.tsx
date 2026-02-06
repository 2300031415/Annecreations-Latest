"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BannerForm } from "./BannerForm"
import { useCreateBannerMutation, useUpdateBannerMutation } from "@/lib/redux/api/bannersApi"
import { useToast } from "@/components/ui/use-toast"

interface BannerDialogProps {
  children: React.ReactNode
  mode?: "create" | "edit"
  banner?: any
}

export function BannerDialog({ children, mode = "create", banner }: BannerDialogProps) {
  const [open, setOpen] = useState(false)
  const [createBanner] = useCreateBannerMutation()
  const [updateBanner] = useUpdateBannerMutation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const { toast } = useToast()

  // Initialize form in edit mode
  useEffect(() => {
    if (open && mode === "edit" && banner) {
      setFormData({
        ...banner,
        mobileFiles: [],
        websiteFiles: [],
        deviceType: banner.deviceType || "web",
      })
    }
  }, [open, mode, banner])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (!formData.title.trim()) throw new Error("Title is required")
      if (!formData.mobileFiles?.length && !formData.mobileImages?.length) throw new Error("At least one mobile image is required")
      if (!formData.websiteFiles?.length && !formData.websiteImages?.length) throw new Error("At least one website image is required")
      if (!formData.deviceType) throw new Error("Device type is required")


      const data = new FormData()
      data.append("title", formData.title)
      data.append("description", formData.description || "")
      data.append("sortOrder", formData.sortOrder?.toString() || "0")
      data.append("status", formData.status ? "true" : "false")
      data.append("deviceType", formData.deviceType)



      // Append new files
      // ✅ correct code
      formData.mobileFiles?.forEach((file: File) => data.append("mobileImages", file))
      formData.websiteFiles?.forEach((file: File) => data.append("webImages", file))

      formData.mobileImages?.forEach((url: string) => data.append("existingMobileImages", url))
      formData.websiteImages?.forEach((url: string) => data.append("existingWebImages", url))

      if (mode === "create") {
        await createBanner(data).unwrap()
        toast({ title: "Banner Created 🎉", description: `"${formData.title}" created successfully.` })
      } else if (mode === "edit" && banner?._id) {
        await updateBanner({ id: banner._id, body: data }).unwrap()
        toast({ title: "Banner Updated ✅", description: `"${formData.title}" updated successfully.` })
      }

      setOpen(false)
      setFormData({})
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Error", description: err.message || "Something went wrong." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Banner" : "Edit Banner"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new banner" : "Update this banner"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <BannerForm banner={formData} onChange={setFormData} />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90" disabled={loading}>
              {loading ? (mode === "create" ? "Creating..." : "Saving...") : (mode === "create" ? "Create Banner" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
