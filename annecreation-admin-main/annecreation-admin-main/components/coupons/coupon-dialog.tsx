"use client"

import { useState } from "react"
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
import { CouponForm } from "./coupon-form"
import { useCreateCouponMutation, useUpdateCouponMutation } from "@/lib/redux/api/couponsApi"
import { useToast } from "@/components/ui/use-toast"
import { usePermissions } from "@/hooks/use-permissions"

interface CouponDialogProps {
  children: React.ReactNode
  mode?: "create" | "edit"
  coupon?: any
}

export function CouponDialog({ children, mode = "create", coupon }: CouponDialogProps) {
  const [open, setOpen] = useState(false)
  const [createCoupon] = useCreateCouponMutation()
  const [updateCoupon] = useUpdateCouponMutation()
  const [loading, setLoading] = useState(false)
  const { canCreate, canUpdate } = usePermissions()
  const [status, setStatus] = useState<boolean>(coupon?.status ?? true)
  const [autoApply, setAutoApply] = useState<boolean>(coupon?.autoApply ?? false)

  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const form = event.currentTarget

      const getValue = (id: string) =>
        form.querySelector<HTMLInputElement>(`#${id}`)?.value?.trim() || ""

      const isChecked = (id: string) => {
        const element = form.querySelector<HTMLInputElement>(`#${id}`)
        return element?.getAttribute("data-state") === "checked"
      }

      const payload = {
        ...(mode === "edit" && coupon?._id ? { _id: coupon._id } : {}),
        name: getValue("name"),
        code: getValue("code"),
        discount: Number(getValue("discount")),
        discountType: isChecked("percentage") ? "Percentage" : "Fixed Amount",
        logged: isChecked("individual-use"),
        dateStart: getValue("date-start"),
        dateEnd: getValue("date-end"),
        status,
        autoApply,

        minimumSpend: Number(getValue("minimum-spend")) || 0,
        maxDiscount: Number(getValue("max-discount")) || 0,
        usageLimit: Number(getValue("usage-limit")) || 0,
        usageCount: Number(getValue("usage-limit-per-user")) || 0,
        createdAt: coupon?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log("Submitting coupon payload:", payload)

      if (mode === "create") {
        console.log("AutoApply value going to API:", payload.autoApply)
        await createCoupon(payload).unwrap()
        toast({
          title: "Coupon Created 🎉",
          description: `"${payload.name}" has been created successfully.`,
        })
      } else if (mode === "edit" && coupon?._id) {
        console.log("AutoApply value going to API:", payload.autoApply)
        await updateCoupon({
          id: coupon._id,
          body: payload,
        }).unwrap()
        toast({
          title: "Coupon Updated ",
          description: `"${payload.name}" has been updated successfully.`,
        })
      }


      setOpen(false)
    } catch (err) {
      console.error("Mutation failed:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong! Check the console for details.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "create" ? "Add New Coupon" : "Edit Coupon"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new discount coupon for your customers."
              : "Update the details of this coupon."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">

          <CouponForm
            coupon={coupon}
            onStatusChange={setStatus}
            onAutoApplyChange={setAutoApply}
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            {((mode === "create" && canCreate('coupons')) || (mode === "edit" && canUpdate('coupons'))) && (
              <Button
                type="submit"
                className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
                disabled={loading}
              >
                {loading
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Create Coupon"
                    : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
