// src/features/dashboard/profile/components/profile-banner-uploader.tsx
'use client';

import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfileBannerUploader: React.FC<{
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the banner data URI
  defaultImage?: string | null; // URL of the existing banner image
  disabled?: boolean;
}> = ({ control, name, defaultImage, disabled }) => {
  const { toast } = useToast();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => { // `field` (including field.onChange) is available here

        // Define onUpload *inside* this scope so it can use `field.onChange`
        // It also needs access to `imageUploadApi.handleRemove` for the case where an image is too large.
        const onUploadForField = (file: File | null, dataUrl: string | null, imageUploadApiRef?: ReturnType<typeof useImageUpload>) => {
          if (disabled) return;
          if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: "Image too large", description: "Banner image must be less than 5MB.", variant: "destructive" });
            if (imageUploadApiRef) { // Check if api ref is available
              imageUploadApiRef.handleRemove(); // Clear the faulty preview using the hook's own remove
            }
            field.onChange(null); // Clear form value using field.onChange
            return;
          }
          field.onChange(dataUrl); // Update form value using field.onChange
        };

        // Call useImageUpload here. Pass a wrapper for onUpload that can also pass imageUploadApi itself.
        const imageUploadApi = useImageUpload({
          initialPreviewUrl: defaultImage,
          // Pass a lambda that calls onUploadForField with the imageUploadApi instance
          onUpload: (file, dataUrl) => onUploadForField(file, dataUrl, imageUploadApi),
        });
        
        const {
          previewUrl: bannerPreview,
          fileInputRef: bannerFileInputRef,
          handleTriggerClick: handleBannerTriggerClick,
          handleFileChange: handleBannerFileChange, // This will call onUploadForField
          handleRemove: handleBannerRemoveVisualsAndRHF, // Renamed for clarity
          setPreviewUrlDirectly: setBannerPreviewUrlDirectly
        } = imageUploadApi;

        // Effect to sync the preview URL if defaultImage prop changes
        useEffect(() => {
          if (defaultImage !== bannerPreview && !(bannerPreview && bannerPreview.startsWith('blob:'))) {
             setBannerPreviewUrlDirectly(defaultImage || null);
          }
        }, [defaultImage, bannerPreview, setBannerPreviewUrlDirectly]);

        const currentImage = bannerPreview || defaultImage;

        return (
          <div className="h-32 sm:h-40 md:h-48 bg-muted relative group rounded-t-lg overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage}
                alt="Profile banner"
                className="w-full h-full object-cover"
                data-ai-hint="abstract banner"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" data-ai-hint="abstract pattern gradient">
                <ImagePlus className="w-10 h-10 text-muted-foreground/40" />
              </div>
            )}
            {!disabled && (
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300"
                role="group"
                aria-label="Banner image actions"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white focus-visible:ring-white"
                  onClick={handleBannerTriggerClick}
                  aria-label={currentImage ? "Change banner image" : "Upload banner image"}
                  disabled={disabled}
                >
                  <ImagePlus size={16} strokeWidth={2}/>
                </Button>
                {currentImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white focus-visible:ring-white"
                    onClick={() => {
                      handleBannerRemoveVisualsAndRHF(); // This will call onUpload(null,null) which calls field.onChange(null)
                    }}
                    aria-label="Remove banner image"
                    disabled={disabled}
                  >
                    <X size={16} strokeWidth={2}/>
                  </Button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={bannerFileInputRef}
              onChange={(e) => {
                handleBannerFileChange(e); // This calls onUploadForField which calls field.onChange
              }}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              id={`${name}-input`} 
              disabled={disabled}
            />
          </div>
        );
      }}
    />
  );
};

export default ProfileBannerUploader;
