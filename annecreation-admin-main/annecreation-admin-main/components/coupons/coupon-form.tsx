"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "@/components/ui/checkbox" // ✅ Import Checkbox from shadcn/ui

interface CouponFormProps {
  coupon?: any
  onStatusChange?: (value: boolean) => void
  onAutoApplyChange?: (value: boolean) => void // ✅ optional callback if you need it in parent
}

export function CouponForm({ coupon, onStatusChange, onAutoApplyChange }: CouponFormProps) {
  const [status, setStatus] = useState<boolean>(
    typeof coupon?.status === "boolean" ? coupon.status : true
  )
  const [autoApply, setAutoApply] = useState<boolean>(!!coupon?.autoApply) // ✅ local state
  const [dateStart, setDateStart] = useState(coupon?.dateStart?.slice(0, 10) || "")
  const [dateEnd, setDateEnd] = useState(coupon?.dateEnd?.slice(0, 10) || "")

  useEffect(() => {
    setDateStart(coupon?.dateStart?.slice(0, 10) || "")
    setDateEnd(coupon?.dateEnd?.slice(0, 10) || "")
    setAutoApply(!!coupon?.autoApply)
  }, [coupon])

  return (
    <div className="grid gap-6">
      {/* Coupon Info */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Coupon Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Coupon Name *</Label>
            <Input
              id="name"
              placeholder="Enter coupon name"
              defaultValue={coupon?.name || ""}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              placeholder="Enter coupon code"
              defaultValue={coupon?.code || ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Discount Type *</Label>
          <RadioGroup
            defaultValue={coupon?.discountType || "Fixed Amount"}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="Percentage"
                id="percentage"
                defaultChecked={coupon?.discountType === "Percentage"}
              />
              <Label htmlFor="percentage">Percentage (%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="Fixed Amount"
                id="fixed"
                defaultChecked={coupon?.discountType === "Fixed Amount"}
              />
              <Label htmlFor="fixed">Fixed Amount (₹)</Label>
            </div>
          </RadioGroup>

        </div>

        <div className="grid gap-2">
          <Label htmlFor="discount">Discount Amount *</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            defaultValue={coupon?.discount || ""}
            required
          />
        </div>
      </div>

      {/* Validity */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Validity Period</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="date-start">Start Date *</Label>
            <Input
              id="date-start"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date-end">End Date *</Label>
            <Input
              id="date-end"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Usage Restrictions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="usage-limit">Usage Limit Per Coupon</Label>
            <Input
              id="usage-limit"
              type="number"
              min="0"
              defaultValue={coupon?.usageLimit || 0}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="usage-limit-per-user">Usage Limit Per Customer</Label>
            <Input
              id="usage-limit-per-user"
              type="number"
              min="0"
              defaultValue={coupon?.usageCount || 0}
            />
          </div>
        </div>
      </div>

      {/* Spend & Discount */}
      <div>
        <div className="grid gap-2">
          <Label htmlFor="minimum-spend">Minimum Spend (₹)</Label>
          <Input
            id="minimum-spend"
            type="number"
            min="0"
            defaultValue={coupon?.minimumSpend || 0}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="max-discount">Maximum Discount (₹)</Label>
          <Input
            id="max-discount"
            type="number"
            min="0"
            defaultValue={coupon?.maxDiscount || 0}
          />
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid gap-3">
        {/* ✅ Auto Apply checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-apply"
            checked={autoApply}
            onCheckedChange={(checked) => {
              const val = Boolean(checked)
              setAutoApply(val)
              onAutoApplyChange?.(val)
            }}
          />
          <Label htmlFor="auto-apply">Auto Apply Coupon</Label>
        </div>

        {/* Existing Switch */}
        <div className="flex items-center gap-2">
          <Switch id="individual-use" defaultChecked={coupon?.logged || false} />
          <Label htmlFor="individual-use">Individual use only</Label>
        </div>

        {/* Status dropdown */}
        <div className="grid gap-2">
          <Label htmlFor="status" className="text-gray-700">Status</Label>
          <Select
            value={status ? "Active" : "Inactive"}
            onValueChange={(val) => {
              const boolVal = val === "Active"
              setStatus(boolVal)
              onStatusChange?.(boolVal)
            }}
          >
            <SelectTrigger id="status" className="border-gray-300">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" defaultValue={coupon?.description || ""} />
        </div>
      </div>
    </div>
  )
}
