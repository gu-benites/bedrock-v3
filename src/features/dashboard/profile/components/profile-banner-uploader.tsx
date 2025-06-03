// src/features/dashboard/profile/components/profile-banner-uploader.tsx
'use client';

import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder for a client-side logger
const clientLogger = {
  info: (message: string, context?: any) => console.log(`[ClientBannerUploaderINFO] ${message}`, context),
  warn: (message: string, context?: any) => console.warn(`[ClientBannerUploaderWARN] ${message}`, context),
  error: (message: string, context?: any) => console.error(`[ClientBannerUploaderERROR] ${message}`, context),
};


const ProfileBannerUploader: React.FC<{
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the banner data URI
  defaultImage?: string | null; // URL of the existing banner image
  disabled?: boolean;
}> = ({ control, name, defaultImage, disabled }) => {
  clientLogger.info('ProfileBannerUploader rendered/updated.', { defaultImageProp: defaultImage, disabled, name });
  const { toast } = useToast();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => { 
        
        const onUploadForField = (file: File | null, dataUrl: string | null, imageUploadApiRef?: ReturnType<typeof useImageUpload>) => {
          clientLogger.info('ProfileBannerUploader - onUploadForField called.', { hasFile: !!file, hasDataUrl: !!dataUrl });
          if (disabled) return;
          if (file && file.size > 5 * 1024 * 1024) { 
            toast({ title: "Image too large", description: "Banner image must be less than 5MB.", variant: "destructive" });
            if (imageUploadApiRef) { 
              imageUploadApiRef.handleRemove(); 
            }
            field.onChange(null); 
            return;
          }
          field.onChange(dataUrl); 
        };

        const imageUploadApi = useImageUpload({
          initialPreviewUrl: defaultImage ? defaultImage.split('?')[0] : null, // Remove query string
          onUpload: (file, dataUrl) => onUploadForField(file, dataUrl, imageUploadApi),
        });
        
        const {
          previewUrl: bannerPreview, // This is the state from useImageUpload
          fileInputRef: bannerFileInputRef,
          handleTriggerClick: handleBannerTriggerClick,
          handleFileChange: handleBannerFileChange, 
          handleRemove: handleBannerRemoveVisualsAndRHF, 
        } = imageUploadApi;
        
        // currentImage will be the one displayed. It prioritizes the hook's previewUrl.
        // If bannerPreview is null (e.g. after removing a selection, or initially if defaultImage was null),
        // and defaultImage (the prop from form.watch) is also null, then currentImage will be null.
        const currentImage = bannerPreview; 
        clientLogger.info('ProfileBannerUploader - render logic.', { defaultImageProp: defaultImage, bannerPreviewState: bannerPreview, currentImageToRender: currentImage });

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
                      handleBannerRemoveVisualsAndRHF(); 
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
                handleBannerFileChange(e); 
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
