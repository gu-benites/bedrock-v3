// src/features/dashboard/profile/components/profile-avatar-uploader.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';

import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import { useImageUpload } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { UserCircle2 } from 'lucide-react';
import { validateImageFile, getImageValidationErrorMessage, type ImageProcessingError } from '@/features/user-auth-data/utils/image-validation.utils';
import { cn } from '@/lib/utils';


interface ProfileAvatarUploaderProps {
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the avatar data URI
  defaultImage?: string | null; // URL of the existing avatar
  displayName?: string;
  getInitialsFn: () => React.ReactNode;
  disabled?: boolean;
  isPending?: boolean; // Loading state prop
  error?: string | ImageProcessingError; // Error prop for displaying validation errors
  onRemove?: () => void; // Callback for removing image
}

const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({
  control,
  name,
  defaultImage,
  displayName,
  getInitialsFn,
  disabled = false,
  isPending = false,
  error,
  onRemove
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => { // `field` (including field.onChange) is available here
        
        // Enhanced upload validation with comprehensive error handling
        const onUploadForField = async (file: File | null, dataUrl: string | null, imageUploadApiRef?: ReturnType<typeof useImageUpload>) => {
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
            if (file.size > 1024 * 1024) { // > 1MB
              const sizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
              toast({
                title: "Image Uploaded",
                description: `Avatar image (${sizeMB}MB) uploaded successfully.`,
                variant: "default"
              });
            }

          } catch (error) {
            console.error('Error during avatar upload validation:', error);
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
        
        // Call useImageUpload here. Pass a wrapper for onUpload that can also pass imageUploadApi itself.
        const imageUploadApi = useImageUpload({
          initialPreviewUrl: defaultImage,
          // Pass a lambda that calls onUploadForField with the imageUploadApi instance
          onUpload: (file, dataUrl) => onUploadForField(file, dataUrl, imageUploadApi),
        });

        const {
          previewUrl: avatarPreview,
          fileInputRef: avatarFileInputRef,
          handleTriggerClick: handleAvatarTriggerClick,
          handleFileChange: handleAvatarFileChange, // This will call onUploadForField
          setPreviewUrlDirectly: setAvatarPreviewUrlDirectly,
        } = imageUploadApi;


        const currentAvatarSrc = avatarPreview || defaultImage;
        const isLoading = isPending || isUploading;
        const hasError = !!error;

        return (
          <div className="relative -mt-10 sm:-mt-12 flex flex-col items-center">
            <div className="relative">
              <ShadcnAvatar className={cn(
                "h-20 w-20 sm:h-24 sm:w-24 text-3xl border-4 border-background bg-muted shadow-md group transition-all duration-200",
                hasError && "border-destructive",
                isLoading && "opacity-75"
              )}>
                <AvatarImage src={currentAvatarSrc || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitialsFn()}
                </AvatarFallback>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60">
                    <Loader2 size={20} className="text-white animate-spin" data-testid="loading-spinner" />
                  </div>
                )}

                {/* Upload overlay */}
                {!disabled && !isLoading && (
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={handleAvatarTriggerClick}
                    role="button"
                    aria-label="Change profile picture"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarTriggerClick();}}
                  >
                    <ImagePlus size={20} strokeWidth={2} className="text-white" />
                  </div>
                )}

                {/* Error indicator */}
                {hasError && !isLoading && (
                  <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
                    <AlertCircle size={12} className="text-destructive-foreground" data-testid="error-indicator" />
                  </div>
                )}
              </ShadcnAvatar>

              {/* Remove button for existing images */}
              {currentAvatarSrc && !isLoading && onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={onRemove}
                  disabled={disabled}
                  aria-label="Remove avatar"
                >
                  <X size={12} />
                </Button>
              )}
            </div>

            {/* Error message display */}
            {hasError && (
              <div className="mt-2 text-center">
                <p className="text-sm text-destructive">
                  {typeof error === 'string' ? error : getImageValidationErrorMessage(error)}
                </p>
              </div>
            )}

            <input
              type="file"
              ref={avatarFileInputRef}
              onChange={(e) => {
                handleAvatarFileChange(e); // This calls the onUploadForField which calls field.onChange
              }}
              className="hidden"
              accept="image/png, image/jpeg, image/webp, image/gif"
              id={`${name}-input`} // Ensure unique ID
              disabled={disabled || isLoading}
            />
          </div>
        );
      }}
    />
  );
};

export { ProfileAvatarUploader };
