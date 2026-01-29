"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;

      const remainingSlots = maxPhotos - photos.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      if (filesToUpload.length === 0) return;

      setUploading(true);

      try {
        // For now, create object URLs for preview
        // In production, this would upload to S3 and return real URLs
        const newUrls = filesToUpload.map((file) => URL.createObjectURL(file));
        onPhotosChange([...photos, ...newUrls]);

        // TODO: Implement actual S3 upload
        // const uploadPromises = filesToUpload.map(async (file) => {
        //   const formData = new FormData();
        //   formData.append('file', file);
        //   const response = await fetch('/api/upload', { method: 'POST', body: formData });
        //   const data = await response.json();
        //   return data.url;
        // });
        // const uploadedUrls = await Promise.all(uploadPromises);
        // onPhotosChange([...photos, ...uploadedUrls]);
      } catch (error) {
        console.error("Error uploading photos:", error);
      } finally {
        setUploading(false);
      }
    },
    [photos, onPhotosChange, maxPhotos, disabled]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    // Revoke object URL to prevent memory leaks
    if (newPhotos[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPhotos[index]);
    }
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          disabled && "cursor-not-allowed opacity-50",
          photos.length >= maxPhotos && "hidden"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled || uploading || photos.length >= maxPhotos}
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          <div className="text-sm text-gray-600">
            <span className="font-medium text-primary">Click to upload</span> or
            drag and drop
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG up to 10MB ({photos.length}/{maxPhotos} photos)
          </p>
        </div>
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <img
                src={photo}
                alt={`Project photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <ImageIcon className="h-5 w-5" />
          <span>
            Upload photos of the project area to get more accurate AI estimates
          </span>
        </div>
      )}
    </div>
  );
}
