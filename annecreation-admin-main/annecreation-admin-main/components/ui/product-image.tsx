"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onRemove?: () => void;
}

export function ProductImage({
  src,
  alt,
  className = "",
  width = 80,
  height = 80,
  onRemove,
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getFinalSrc = () => {
    // Handle no source or error cases
    if (!src || error) {
      return "/placeholder.svg";
    }

    // Handle full URLs
    if (src.startsWith("http")) {
      return src;
    }

    // Clean up the source path
    const cleanPath = src.replace(/^\/+/, "");

    // Handle catalog/product images (from orders)
    if (cleanPath.startsWith("catalog/product")) {
      return `${API_URL?.replace(/\/+$/, "")}/image/${cleanPath}`;
    }

    // Handle other images
    return `${API_URL?.replace(/\/+$/, "")}/${cleanPath}`;
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Image
        src={getFinalSrc()}
        alt={alt}
        width={width}
        height={height}
        className="object-cover rounded-md"
        style={{ userSelect: "none" }}
        draggable={false}
        onError={() => setError(true)}
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
