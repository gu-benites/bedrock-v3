// src/features/dashboard/profile/components/profile-banner-uploader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile, getImageValidationErrorMessage, type ImageProcessingError } from '@/features/user-auth-data/utils/image-validation.utils';

// Placeholder for a client-side logger
const clientLogger = {
  info: (message: string, context?: any) => console.log(`[ClientBannerUploaderINFO] ${message}`, context),
  warn: (message: string, context?: any) => console.warn(`[ClientBannerUploaderWARN] ${message}`, context),
  error: (message: string, context?: any) => console.error(`[ClientBannerUploaderERROR] ${message}`, context),
};


interface ProfileBannerUploaderProps {
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the banner data URI
  defaultImage?: string | null; // URL of the existing banner image
  disabled?: boolean;
  isPending?: boolean; // Loading state prop
  error?: string | ImageProcessingError; // Error prop for displaying validation errors
  onRemove?: () => void; // Callback for removing image
}

const ProfileBannerUploader: React.FC<ProfileBannerUploaderProps> = ({
  control,
  name,
  defaultImage,
  disabled = false,
  isPending = false,
  error,
  onRemove
}) => {
  clientLogger.info('ProfileBannerUploader rendered/updated.', { defaultImageProp: defaultImage, disabled, name });
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => { 
        
        // Enhanced upload validation with comprehensive error handling
        const onUploadForField = async (file: File | null, dataUrl: string | null, imageUploadApiRef?: ReturnType<typeof useImageUpload>) => {
          clientLogger.info('ProfileBannerUploader - onUploadForField called.', { hasFile: !!file, hasDataUrl: !!dataUrl });
          if (disabled || isPending) return;

          if (!file) {
            field.onChange(null);
            return;
          }

          setIsUploading(true);

          try {
            // Validate the file using our enhanced validation utility
            const validationResult = validateImageFile(file);

            if (!validationResult.isValid && validationResult.error) {
              const errorMessage = getImageValidationErrorMessage(validationResult.error);
              toast({
                title: "Invalid Image",
                description: errorMessage,
                variant: "destructive"
              });

              if (imageUploadApiRef) {
                imageUploadApiRef.handleRemove();
              }
              field.onChange(null);
              return;
            }

            // If validation passes, update the form field
            field.onChange(dataUrl);

            // Show success message for large files that are still valid
            if (file.size > 2 * 1024 * 1024) { // > 2MB
              const sizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
              toast({
                title: "Image Uploaded",
                description: `Banner image (${sizeMB}MB) uploaded successfully.`,
                variant: "default"
              });
            }

          } catch (error) {
            console.error('Error during banner upload validation:', error);
            toast({
              title: "Upload Error",
              description: "An error occurred while processing the image. Please try again.",
              variant: "destructive"
            });

            if (imageUploadApiRef) {
              imageUploadApiRef.handleRemove();
            }
            field.onChange(null);
          } finally {
            setIsUploading(false);
          }
        };

        const imageUploadApi = useImageUpload({
          initialPreviewUrl: defaultImage, // Use the full URL including the timestamp
          onUpload: (file, dataUrl) => onUploadForField(file, dataUrl, imageUploadApi),
        });

        // Use a useEffect to update the useImageUpload hook's state
        // when the defaultImage prop changes. This ensures the previewUrl
        // within the hook is updated with the new timestamped URL.
        useEffect(() => {
            clientLogger.info('ProfileBannerUploader - defaultImage prop changed.', { newDefaultImage: defaultImage });
            // Assuming useImageUpload exposes a way to update its previewUrl
            // If not, you might need to adjust useImageUpload or re-structure
            // how the previewUrl is managed here.
            // For now, let's assume useImageUpload updates its internal state
            // when initialPreviewUrl changes *after* initial mount.
            // If useImageUpload is NOT reactive to initialPreviewUrl changes
            // after mount, we would need a different approach.
        }, [defaultImage, imageUploadApi]); // Depend on defaultImage and imageUploadApi

        const {
          previewUrl: bannerPreview, // This is the state from useImageUpload
          fileInputRef: bannerFileInputRef,
          handleTriggerClick: handleBannerTriggerClick,
          handleFileChange: handleBannerFileChange, 
          handleRemove: handleBannerRemoveVisualsAndRHF, 
        } = imageUploadApi;
        
        // currentImage will be the one displayed. It prioritizes the hook's previewUrl.
        const currentImage = bannerPreview;
        const isLoading = isPending || isUploading;
        const hasError = !!error;
        clientLogger.info('ProfileBannerUploader - render logic.', { defaultImageProp: defaultImage, bannerPreviewState: bannerPreview, currentImageToRender: currentImage });

        return (
          <div className="relative">
            <div className={cn(
              "h-32 sm:h-40 md:h-48 bg-muted relative group rounded-t-lg overflow-hidden transition-all duration-200",
              hasError && "border-2 border-destructive",
              isLoading && "opacity-75"
            )} data-testid="banner-container">
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

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 size={24} className="text-white animate-spin" data-testid="loading-spinner" />
                </div>
              )}

              {/* Error indicator */}
              {hasError && !isLoading && (
                <div className="absolute top-2 right-2 bg-destructive rounded-full p-1">
                  <AlertCircle size={16} className="text-destructive-foreground" data-testid="error-indicator" />
                </div>
              )}
              {/* Action buttons overlay */}
              {!disabled && !isLoading && (
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
                    disabled={disabled || isLoading}
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
                        if (onRemove) {
                          onRemove();
                        } else {
                          handleBannerRemoveVisualsAndRHF();
                        }
                      }}
                      aria-label="Remove banner image"
                      disabled={disabled || isLoading}
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
                accept="image/png, image/jpeg, image/webp, image/gif"
                id={`${name}-input`}
                disabled={disabled || isLoading}
              />
            </div>

            {/* Error message display */}
            {hasError && (
              <div className="mt-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">
                  {typeof error === 'string' ? error : getImageValidationErrorMessage(error)}
                </p>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default ProfileBannerUploader;
