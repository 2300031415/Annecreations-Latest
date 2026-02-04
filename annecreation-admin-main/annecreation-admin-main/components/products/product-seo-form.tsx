"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormData } from "./product-dialog";

interface ProductSeoFormProps {
  product?: any;
  formData: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
}

export function ProductSeoForm({
  product,
  formData,
  onChange,
}: ProductSeoFormProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">
          SEO Settings
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="meta-title" className="text-gray-700">
              Meta Title
            </Label>
            <Input
              id="meta-title"
              placeholder="Enter meta title"
              value={formData.meta_title || ""}
              className="border-gray-300"
              onChange={(e) => onChange("meta_title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meta-description" className="text-gray-700">
              Meta Description
            </Label>
            <Textarea
              id="meta-description"
              placeholder="Enter meta description"
              className="min-h-[80px] resize-y border-gray-300"
              value={formData.meta_description || ""}
              onChange={(e) => onChange("meta_description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meta-keywords" className="text-gray-700">
              Meta Keywords (Optional)
            </Label>
            <Input
              id="meta-keywords"
              placeholder="keyword1, keyword2, keyword3"
              value={formData.meta_keyword|| ""}
              className="border-gray-300"
              onChange={(e) => onChange("meta_keyword", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
