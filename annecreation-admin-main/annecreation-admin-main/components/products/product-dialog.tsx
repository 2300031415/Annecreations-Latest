"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductDetailsForm } from "./product-details-form";
import { ProductSeoForm } from "./product-seo-form";
import {
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/lib/redux/api/productApi";
import { useGetMachineFormatsQuery } from "@/lib/redux/api/machineApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductDialogProps {
  children: React.ReactNode;
  mode?: "create" | "edit";
  product?: any;
}

export interface ProductFormData {
  name: string;
  productModel: string;
  sku: string;
  price: number;
  description: string;
  weight?: number;
  dimensions?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  images: File[];
  categories: string[]; // category IDs
  designSpec?: string;
  stitches?: string;
  colourNeedles?: string;
  machineFormatFiles: Record<string, File | null>;
  selectedMachineFormats: string[];
  machineFormatPrices: Record<string, string>;
  status: boolean;
  sortOrder?: number;

  // images from backend
  existingImage?: string | null;
  existingAdditionalImages?: { _id?: string; image: string }[];
  deletedExistingImages?: (string | number | "main")[];
}

export function ProductDialog({ children, mode = "create", product }: ProductDialogProps) {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    productModel: "",
    sku: "",
    price: 0,
    description: "",
    categories: [],
    images: [],
    machineFormatFiles: {},
    selectedMachineFormats: [],
    machineFormatPrices: {},
    status: true,
    sortOrder: 0,
    stitches: "",
    dimensions: "",
    colourNeedles: "",
    deletedExistingImages: [],
    image: "",
  });

  const productId = product?._id || product?.product_id;

  // fetch product details
  const { data: fetchedProduct, isLoading: isProductLoading } = useGetProductByIdQuery(
    { id: productId || "" },
    { skip: mode !== "edit" || !productId }
  );

  // fetch machine formats
  const { data: machineFormatsData, isLoading: isMachineLoading } = useGetMachineFormatsQuery();
  const machineFormats = machineFormatsData?.map(m => ({ id: m._id, name: m.name })) || [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isLoading = isCreating || isUpdating || isMachineLoading;

  // normalize status from backend
  const convertToBoolean = (status: any): boolean => {
    if (typeof status === "boolean") return status;
    if (typeof status === "string") return status === "1" || status === "true";
    if (typeof status === "number") return status === 1;
    return true;
  };

  // populate form in edit mode
  useEffect(() => {
    if (mode === "edit" && fetchedProduct) {
      const existingMain = fetchedProduct.image || null;
      const existingAdditional = (fetchedProduct.additionalImages || []).map((img: any) => ({
        _id: img._id || undefined,
        image: img.image || "",
      }));

      setFormData(prev => ({
        ...prev,
        name: fetchedProduct.descriptions?.[0]?.name || fetchedProduct.name || "",
        productModel: fetchedProduct.productModel || fetchedProduct.model || "",
        sku: fetchedProduct.sku || "",
        price: fetchedProduct.price || 0,
        description: fetchedProduct.descriptions?.[0]?.description || fetchedProduct.description || "",
        stitches: fetchedProduct.stitches || "",
        colourNeedles: fetchedProduct.colourNeedles || "",
        dimensions: fetchedProduct.dimensions || "",
        weight: fetchedProduct.weight ?? 0,
        status: convertToBoolean(fetchedProduct.status),
        categories: (fetchedProduct.categories || []).map((cat: any) => cat._id),
        existingImage: existingMain,
        existingAdditionalImages: existingAdditional,
        machineFormatFiles: {},
        selectedMachineFormats: (fetchedProduct.options || []).map((opt: any) => opt.option._id),
        machineFormatPrices: (fetchedProduct.options || []).reduce((acc: Record<string, string>, opt: any) => {
          acc[opt.option._id] = String(opt.price || 0);
          return acc;
        }, {}),
        sortOrder: fetchedProduct.sortOrder || 0,
        deletedExistingImages: prev.deletedExistingImages || [],

        // ✅ FIX: include SEO data
        meta_title: fetchedProduct.seo?.metaTitle || "",
        meta_description: fetchedProduct.seo?.metaDescription || "",
        meta_keyword: fetchedProduct.seo?.metaKeyword || "",
      }));
    }
  }, [fetchedProduct, mode]);




  const handleFormChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleFileUpload = (formatId: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      machineFormatFiles: { ...prev.machineFormatFiles, [formatId]: file },
    }));
  };

  // ✅ for new image uploads


  // ✅ for existing images (main + additional)
  const handleRemoveExistingImage = (index: number | "main") => {
    setFormData(prev => {
      const deleted = new Set(prev.deletedExistingImages || []);

      // Remove main image
      if (index === "main") {
        if (prev.existingImage) deleted.add("main");
        return {
          ...prev,
          existingImage: "",
          deletedExistingImages: Array.from(deleted),
        };
      }

      // Remove additional image
      const imgObj = prev.existingAdditionalImages?.[index];
      if (!imgObj) return prev;

      // Always use image path as identifier
      deleted.add(imgObj.image);

      return {
        ...prev,
        existingAdditionalImages: prev.existingAdditionalImages.filter((_, i) => i !== index),
        deletedExistingImages: Array.from(deleted),
      };
    });
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (!formData.categories.length) return toast.error("Select at least one category.");

      const form = new FormData();

      // ---------------- Basic Fields ----------------
      form.append("productModel", formData.productModel || `MODEL-${Date.now()}`);
      form.append("sku", formData.sku || `SKU-${Date.now()}`);
      form.append("name", formData.name || "");
      form.append("description", formData.description || "");
      form.append("price", String(formData.price ?? 0));
      form.append("status", formData.status ? "1" : "0");
      form.append("stitches", formData.stitches || "");
      form.append("colourNeedles", formData.colourNeedles || "");
      if (formData.dimensions) form.append("dimensions", formData.dimensions);

      // ---------------- Categories ----------------
      formData.categories.forEach((catId, idx) => form.append(`categories[${idx}]`, catId));

      // ---------------- Machine Formats ----------------
      formData.selectedMachineFormats.forEach((id, idx) => {
        form.append(`options[${idx}].option`, id);
        form.append(`options[${idx}].price`, formData.machineFormatPrices[id] || "0");
        const file = formData.machineFormatFiles[id];
        if (file) form.append(`options[${idx}].file`, file);
      });

      // ---------------- SEO ----------------
      // ---------------- SEO ----------------
      if (formData.meta_title) form.append("seo[metaTitle]", formData.meta_title);
      if (formData.meta_description) form.append("seo[metaDescription]", formData.meta_description);
      if (formData.meta_keyword) form.append("seo[metaKeyword]", formData.meta_keyword);



      // ---------------- Images ----------------
      if (formData.images.length > 0) {
        form.append("image", formData.images[0]); // main image
        formData.images.slice(1).forEach(file => form.append("additionalImages", file));
      }

      // ---------------- Deleted Existing Images ----------------
      (formData.deletedExistingImages || []).forEach((item, idx) => {
        form.append(`deletedExistingImages[${idx}]`, String(item));
      });

      // ---------------- Sort Order ----------------
      form.append("sortOrder", String(formData.sortOrder || 0));

      // ---------------- API Calls ----------------
      console.log(form)
      if (mode === "create") {
        await createProduct(form).unwrap();
        toast.success("Product created successfully!");
      } else if (mode === "edit" && productId) {
        await updateProduct({ id: productId.toString(), formData: form }).unwrap();

        toast.success("Product updated successfully!");
      }

      // ---------------- Reset Form ----------------
      setOpen(false);
      setFormData({
        name: "",
        productModel: "",
        sku: "",
        price: 0,
        description: "",
        categories: [],
        images: [],
        machineFormatFiles: {},
        selectedMachineFormats: [],
        machineFormatPrices: {},
        status: true,
        meta_title: "",
        meta_description: "",
        meta_keyword: "",
        sortOrder: 0,
        dimensions: "",
        stitches: "",
        colourNeedles: "",
      });
    } catch (err: any) {
      console.error("Failed to submit product:", err);
      const message =
        err?.data?.message ||
        err?.data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join(", ") ||
        err?.message ||
        "Failed to submit product.";
      toast.error(message);
    }
  };

  console.log(formData)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "create"
              ? "Add New Product"
              : isProductLoading
                ? "Loading..."
                : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new product for your store."
              : isProductLoading
                ? "Fetching product details..."
                : "Update the details of this product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <ProductDetailsForm
                product={product}
                formData={formData}
                onChange={handleFormChange}
                onImagesChange={handleImagesChange}
                onRemoveImage={handleRemoveImage}
                onFileUpload={handleFileUpload}
                machineFormats={machineFormats}
                onRemoveExistingImage={handleRemoveExistingImage}
              />
            </TabsContent>
            <TabsContent value="seo" className="mt-6">
              <ProductSeoForm product={product} formData={formData} onChange={handleFormChange} />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#ffb729] text-[#311807]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Product"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
