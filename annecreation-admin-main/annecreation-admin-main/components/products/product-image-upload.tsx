"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface ProductImageUploadProps {
  onImageSelect: (files: File[]) => void;
  selectedImages: File[];
  previewImages: string[];
  onRemoveImage: (index: number) => void;
  label?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  description?: string;
  className?: string;
}

export function ProductImageUpload({
  onImageSelect,
  selectedImages,
  previewImages,
  onRemoveImage,
  label = "Product Images",
  maxFiles = 5,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  description = "Upload product images (JPEG, PNG, GIF, WebP - max 5MB each)",
  className = "",
}: ProductImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const validateAndProcessFiles = (fileList: FileList) => {
    const files: File[] = Array.from(fileList);
    const validFiles: File[] = [];
    let errors = false;

    // Check if adding these files would exceed the maximum
    if (selectedImages.length + files.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} images`);
      return;
    }

    // Validate each file
    files.forEach((file) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File type not allowed: ${file.name}. Only JPEG, PNG, GIF, and WebP are supported.`
        );
        errors = true;
        return;
      }

      // Check file size (convert maxSizeMB to bytes)
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(
          `File too large: ${file.name}. Maximum file size is ${maxSizeMB}MB.`
        );
        errors = true;
        return;
      }

      validFiles.push(file);
    });

    if (!errors && validFiles.length > 0) {
      onImageSelect(validFiles);
    }
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <Label className="text-gray-700">{label}</Label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed ${isDragging
          ? "border-[#ffb729] bg-[#fff8e6]"
          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          } transition-colors`}
        onClick={() => document.getElementById("image-upload")?.click()}
      >
        <div className="flex flex-col items-center gap-1 text-gray-500">
          <Upload className="h-8 w-8" />
          <span className="text-sm">Click or drag to upload</span>
          <span className="text-xs">{description}</span>
        </div>
        <input
          id="image-upload"
          type="file"
          className="hidden"
          multiple
          accept={allowedTypes.join(",")}
          onChange={(e) => {
            if (e.target.files) {
              validateAndProcessFiles(e.target.files);
              e.target.value = ""; // ✅ reset so user can re-select same file
            }
          }}
        />

      </div>


      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {previewImages.map((preview, index) => {
            if (!preview) return null;

            return (
              <div
                key={index}
                className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`Product image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
