"use client";

import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { BASE_URL } from "@/lib/redux/api/baseApi";

interface CategoryImageUploadProps {
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
  inputId?: string;
}

export function CategoryImageUpload({
  onImageSelect,
  selectedImages,
  previewImages,
  onRemoveImage,
  label = "Category Images",
  maxFiles = 2,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  description = "Upload category images (JPEG, PNG, GIF, WebP - max 5MB each)",
  className = "",
  inputId = "category-image-upload",
}: CategoryImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getValidImageUrl = (preview: string) => {
    // Handle blob URLs for newly added images
    if (preview.startsWith('blob:')) {
      return preview;
    }
    
    // Handle existing images from the server
    // const baseUrl = 'https://annecreation.reesanit.com/';
    // Remove any leading slashes from the preview path
    const cleanPath = preview.replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
  };

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

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      previewImages.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previewImages]);

  const validateAndProcessFiles = (fileList: FileList) => {
    const files: File[] = Array.from(fileList);
    const validFiles: File[] = [];
    let errors = false;

    if (selectedImages.length + files.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} images`);
      return;
    }

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File type not allowed: ${file.name}. Only JPEG, PNG, GIF, and WebP are supported.`
        );
        errors = true;
        return;
      }
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
      <Label className="text-gray-700" htmlFor={inputId}>
        {label}
      </Label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed ${
          isDragging
            ? "border-[#ffb729] bg-[#fff8e6]"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        } transition-colors`}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <div className="flex flex-col items-center gap-1 text-gray-500">
          <Upload className="h-8 w-8" />
          <span className="text-sm">Click or drag to upload</span>
          <span className="text-xs">{description}</span>
        </div>
        <input
          id={inputId}
          type="file"
          className="hidden"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileChange}
        />
      </div>
      {previewImages.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {previewImages.map((preview, index) => (
            <div
              key={index}
              className="relative rounded-md border border-gray-200 bg-white p-1 shadow-sm"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={getValidImageUrl(preview)}
                  alt={`Category image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gray-800 text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}