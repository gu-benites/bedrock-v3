// src/features/dashboard/profile/components/image-remove-button.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageRemoveButtonProps {
  onRemove: () => void | Promise<void>;
  imageType: 'avatar' | 'banner';
  disabled?: boolean;
  isPending?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  children?: React.ReactNode;
}

export const ImageRemoveButton: React.FC<ImageRemoveButtonProps> = ({
  onRemove,
  imageType,
  disabled = false,
  isPending = false,
  variant = 'destructive',
  size = 'sm',
  className,
  showConfirmation = true,
  confirmationTitle,
  confirmationDescription,
  children
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRemove = async () => {
    if (disabled || isPending || isRemoving) return;

    setIsRemoving(true);
    try {
      await onRemove();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`Error removing ${imageType}:`, error);
      // Error handling is typically done by the parent component
    } finally {
      setIsRemoving(false);
    }
  };

  const isLoading = isPending || isRemoving;

  const defaultTitle = confirmationTitle || `Remove ${imageType === 'avatar' ? 'Profile Picture' : 'Banner Image'}`;
  const defaultDescription = confirmationDescription || 
    `Are you sure you want to remove your ${imageType === 'avatar' ? 'profile picture' : 'banner image'}? This action cannot be undone.`;

  const buttonContent = children || (
    <>
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
      {size !== 'icon' && (
        <span className="ml-2">
          {isLoading ? 'Removing...' : `Remove ${imageType === 'avatar' ? 'Picture' : 'Banner'}`}
        </span>
      )}
    </>
  );

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={cn(className)}
      onClick={showConfirmation ? undefined : handleRemove}
      aria-label={`Remove ${imageType} image`}
    >
      {buttonContent}
    </Button>
  );

  if (!showConfirmation) {
    return button;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        {button}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Specialized components for specific use cases
export const AvatarRemoveButton: React.FC<Omit<ImageRemoveButtonProps, 'imageType'>> = (props) => (
  <ImageRemoveButton {...props} imageType="avatar" />
);

export const BannerRemoveButton: React.FC<Omit<ImageRemoveButtonProps, 'imageType'>> = (props) => (
  <ImageRemoveButton {...props} imageType="banner" />
);

// Compact remove button for overlays
interface CompactRemoveButtonProps {
  onRemove: () => void | Promise<void>;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
  showConfirmation?: boolean;
}

export const CompactRemoveButton: React.FC<CompactRemoveButtonProps> = ({
  onRemove,
  disabled = false,
  isPending = false,
  className,
  showConfirmation = false
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (disabled || isPending || isRemoving) return;

    setIsRemoving(true);
    try {
      await onRemove();
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const isLoading = isPending || isRemoving;

  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      className={cn(
        "h-6 w-6 rounded-full p-0 absolute -top-2 -right-2",
        className
      )}
      onClick={showConfirmation ? undefined : handleRemove}
      disabled={disabled || isLoading}
      aria-label="Remove image"
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Trash2 size={12} />
      )}
    </Button>
  );
};

export default ImageRemoveButton;
