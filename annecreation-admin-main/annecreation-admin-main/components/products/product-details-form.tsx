"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetCategoriesQuery } from "@/lib/redux/api/categoryApi";
import { useGetMachineFormatsQuery } from "@/lib/redux/api/machineApi";
import { ProductFormData } from "./product-dialog";
import { ProductImageUpload } from "./product-image-upload";
import { ProductImage } from "../ui/product-image";

interface ProductDetailsFormProps {
  product?: any;
  formData: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
  onImagesChange: (images: File[]) => void;
  onRemoveImage: (index: number) => void;
  onFileUpload: (formatId: string, file: File) => void;
  onMachineFormatsLoaded?: (formats: { id: string; name: string }[]) => void;
  validationErrors?: {
    name?: boolean;
    stitches?: boolean;
    designSpec?: boolean;
    categories?: boolean;
  };
  onRemoveExistingImage: (index: number | "main") => void;
}

// ---------------- Image URL Helper ----------------
function buildImageUrl(imagePath?: string) {
  if (!imagePath) return "/placeholder.png";

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const base = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = imagePath.replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

// ---------------- ProductDetailsForm ----------------
export function ProductDetailsForm({
  product,
  formData,
  onChange,
  onImagesChange,
  onRemoveImage,
  onFileUpload,
  validationErrors,
  onMachineFormatsLoaded = () => { },
  onRemoveExistingImage,
}: ProductDetailsFormProps) {
  // ---------------- Categories ----------------
  const { data: categoriesApiData, isLoading: categoriesLoading, isError: categoriesError } =
    useGetCategoriesQuery({ include_inactive: false });
  const categories = Array.isArray(categoriesApiData?.data) ? categoriesApiData.data : [];

  useEffect(() => {
    if (product?.categories) {
      const ids = product.categories.map((cat: any) => String(cat._id));
      onChange("categories", ids);
    }
  }, [product]);

  // ---------------- Machine Formats ----------------
  const { data: machineFormatsData, isLoading: machineLoading } = useGetMachineFormatsQuery();
  const machineFormats = machineFormatsData?.map(m => ({ id: m._id, name: m.name })) || [];

  useEffect(() => {
    if (machineFormats.length) onMachineFormatsLoaded(machineFormats);
  }, [machineFormats]);

  // ---------------- Local State ----------------
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [applyGlobalPrice, setApplyGlobalPrice] = useState(false);
  const [globalPrice, setGlobalPrice] = useState(product?.price?.toString() || "");

  // ---------------- Handlers ----------------
  const handleImageSelect = (files: File[]) => {
    const allFiles = [...formData.images, ...files];
    onImagesChange(allFiles);

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImageInternal = (index: number) => {
    const newFiles = formData.images.filter((_, i) => i !== index);
    onImagesChange(newFiles);

    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
  };

  const toggleMachineFormat = (formatId: string) => {
    if (machineLoading) return;

    const isSelected = formData.selectedMachineFormats.includes(formatId);
    let updatedFormats = isSelected
      ? formData.selectedMachineFormats.filter(f => f !== formatId)
      : [...formData.selectedMachineFormats, formatId];

    onChange("selectedMachineFormats", updatedFormats);

    if (isSelected) {
      const updatedPrices = { ...formData.machineFormatPrices };
      updatedPrices[formatId] = "";
      onChange("machineFormatPrices", updatedPrices);
    }
  };

  const handleMachineFormatPriceChange = (formatId: string, value: string) => {
    const updatedPrices = { ...formData.machineFormatPrices, [formatId]: value };
    onChange("machineFormatPrices", updatedPrices);
  };

  const toggleApplyGlobalPrice = () => {
    const newState = !applyGlobalPrice;
    setApplyGlobalPrice(newState);

    if (newState) {
      const allIds = machineFormats.map(f => f.id);
      onChange("selectedMachineFormats", allIds);

      const updatedPrices: Record<string, string> = {};
      allIds.forEach(id => (updatedPrices[id] = globalPrice));
      onChange("machineFormatPrices", updatedPrices);
    } else {
      onChange("selectedMachineFormats", []);
      const clearedPrices: Record<string, string> = {};
      machineFormats.forEach(f => (clearedPrices[f.id] = ""));
      onChange("machineFormatPrices", clearedPrices);
    }
  };

  const handleGlobalPriceChange = (value: string) => {
    setGlobalPrice(value);
    if (applyGlobalPrice) {
      const updatedPrices = { ...formData.machineFormatPrices };
      machineFormats.forEach(f => (updatedPrices[f.id] = value));
      onChange("machineFormatPrices", updatedPrices);
    }
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  // ---------------- JSX ----------------
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-1">
        {/* Product Info */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="model">Product Name</Label>
              <Input
                id="model"
                placeholder="Enter product name"
                value={formData.productModel}
                onChange={e => onChange("productModel", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="Enter SKU"
                value={formData.sku}
                onChange={e => onChange("sku", e.target.value)}
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="status"
              checked={formData.status}
              onCheckedChange={checked => onChange("status", checked)}
            />
            <Label htmlFor="status">Active</Label>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>Design Specification</Label>
              <Textarea
                value={formData.description || ""}
                onChange={e => onChange("description", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Stitches", key: "stitches", placeholder: "e.g. 14 count" },
                { label: "Dimensions", key: "dimensions", placeholder: "e.g. 8x10 inches" },
                { label: "Colour & Needles", key: "colourNeedles", placeholder: "e.g. DMC threads included" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="text"
                    placeholder={placeholder}
                    value={formData[key as keyof typeof formData] || ""}
                    onChange={e => onChange(key as keyof typeof formData, e.target.value)}
                    className={validationErrors?.[key] ? "border-red-500" : "border-gray-300"}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New Images */}
        <ProductImageUpload
          onImageSelect={handleImageSelect}
          selectedImages={formData.images}
          previewImages={previewImages}
          onRemoveImage={handleRemoveImageInternal}
          label="Product Images"
          description="Upload product images (JPEG, PNG, GIF, WebP - max 5MB each)"
        />
        {/* Existing Images */}
        <div className="mb-4">
          <Label className="block font-medium mb-2">Existing Images</Label>
          <div className="flex gap-2 flex-wrap">
            {/* Main Image */}
            {formData.existingImage && (
              <ProductImage
                src={buildImageUrl(formData.existingImage)}
                alt="Main Product"
                onRemove={() => onRemoveExistingImage("main")}
              />
            )}

            {/* Additional Images */}
            {formData.existingAdditionalImages?.map((imgObj, idx) => (
              <ProductImage
                key={idx} // use index, not _id
                src={buildImageUrl(typeof imgObj === "string" ? imgObj : imgObj.image)}
                alt={`Additional ${idx}`}
                onRemove={() => onRemoveExistingImage(idx)}
              />
            ))}

          </div>
        </div>

        {/* Categories */}
        <div className="grid gap-2">
          <Label htmlFor="category" className="text-gray-700">
            Category <span className="text-red-500">*</span>
          </Label>
          {categoriesLoading ? (
            <p className="text-gray-500">Loading categories...</p>
          ) : categoriesError ? (
            <p className="text-red-500">Failed to load categories</p>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {categories.map(cat => {
                const id = String(cat._id);
                return (
                  <label key={id} className="flex items-center gap-2 border p-2 rounded">
                    <input
                      type="checkbox"
                      value={id}
                      checked={formData.categories.includes(id)}
                      onChange={e => {
                        const updated = e.target.checked
                          ? [...formData.categories, id]
                          : formData.categories.filter(item => item !== id);
                        onChange("categories", updated);
                      }}
                    />
                    {cat.name}
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No categories found</p>
          )}
          {validationErrors?.categories && (
            <p className="text-red-500 text-sm">Please select at least one category.</p>
          )}
        </div>

        {/* Machine Formats */}
        <div>
          <h3 className="font-medium text-gray-900">Pricing & Machine Formats</h3>

          {/* Global Price */}
          <div className="flex items-center gap-4 bg-gray-50 border p-4 rounded-md">
            <Checkbox
              id="apply-global-price"
              checked={applyGlobalPrice}
              onCheckedChange={toggleApplyGlobalPrice}
              disabled={machineLoading}
            />
            <Label htmlFor="apply-global-price">Add Price to all Products</Label>
            <Input
              type="number"
              placeholder="Price"
              value={globalPrice}
              onChange={e => handleGlobalPriceChange(e.target.value)}
              className="border-gray-300 w-32"
            />
          </div>

          {machineLoading ? (
            <p className="text-center text-gray-500 mt-2">Loading machine formats...</p>
          ) : (
            <div className="space-y-4 border p-4 rounded-md">
              {machineFormats.map(format => (
                <div key={format.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`format-${format.id}`}
                      checked={formData.selectedMachineFormats.includes(format.id)}
                      onCheckedChange={() => toggleMachineFormat(format.id)}
                    />
                    <Label htmlFor={`format-${format.id}`}>{format.name}</Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={formData.machineFormatPrices?.[format.id] || ""}
                    onChange={e => handleMachineFormatPriceChange(format.id, e.target.value)}
                  />
                  <Input
                    type="file"
                    accept=".zip"
                    className="file:mr-4 file:bg-[#ffb729] file:text-[#311807]"
                    disabled={!formData.selectedMachineFormats.includes(format.id)}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.name.endsWith(".zip")) {
                        alert("Only zip files are allowed.");
                        e.target.value = "";
                        return;
                      }
                      onFileUpload(format.id, file);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
