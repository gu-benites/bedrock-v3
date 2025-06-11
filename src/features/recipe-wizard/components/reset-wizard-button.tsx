/**
 * @fileoverview Reset Wizard Button component for Recipe Wizard.
 * Provides a button with confirmation dialog to reset all wizard state and restart the flow.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';

/**
 * Props for the ResetWizardButton component
 */
interface ResetWizardButtonProps {
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional CSS classes */
  className?: string;
  /** Button text (defaults to "Reset Wizard") */
  children?: React.ReactNode;
  /** Show icon */
  showIcon?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
  /** Custom confirmation message */
  confirmationMessage?: string;
  /** Custom confirmation title */
  confirmationTitle?: string;
  /** Callback after successful reset */
  onResetComplete?: () => void;
}

/**
 * Reset Wizard Button Component
 * 
 * Provides a button with confirmation dialog to reset all Recipe Wizard state:
 * - Clears all form data (health concern, demographics, selected causes)
 * - Clears AI responses and cached data
 * - Clears localStorage and session storage
 * - Resets Zustand store state
 * - Navigates back to the first step
 */
export function ResetWizardButton({
  variant = 'outline',
  size = 'default',
  className,
  children,
  showIcon = true,
  compact = false,
  confirmationMessage,
  confirmationTitle,
  onResetComplete
}: ResetWizardButtonProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { resetWizard, currentStep } = useRecipeWizardStore();

  /**
   * Handle the reset wizard action
   */
  const handleResetWizard = async () => {
    try {
      setIsResetting(true);

      // Clear all Recipe Wizard state using the store's reset function
      resetWizard();

      // Clear any additional session/local storage that might not be handled by the store
      try {
        // Clear session storage
        const sessionKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('recipe-wizard') || key.includes('recipeWizard'))) {
            sessionKeys.push(key);
          }
        }
        sessionKeys.forEach(key => sessionStorage.removeItem(key));

        // Clear any additional localStorage keys that might be missed
        const localKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('recipe-wizard') || key.includes('recipeWizard'))) {
            localKeys.push(key);
          }
        }
        localKeys.forEach(key => localStorage.removeItem(key));

      } catch (storageError) {
        console.warn('Error clearing additional storage during reset:', storageError);
        // Continue with reset even if storage clearing fails
      }

      // Close the dialog
      setIsDialogOpen(false);

      // Navigate to the first step
      router.push('/dashboard/recipe-wizard/health-concern');

      // Call the completion callback if provided
      onResetComplete?.();

      console.log('✅ Recipe Wizard reset completed successfully');

    } catch (error) {
      console.error('❌ Error resetting Recipe Wizard:', error);
      // Still close dialog and navigate even if there's an error
      setIsDialogOpen(false);
      router.push('/dashboard/recipe-wizard/health-concern');
    } finally {
      setIsResetting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleDialogClose = () => {
    if (!isResetting) {
      setIsDialogOpen(false);
    }
  };

  // Button content
  const buttonContent = compact ? (
    showIcon && <RotateCcw className="h-4 w-4" />
  ) : (
    <>
      {showIcon && <RotateCcw className="h-4 w-4" />}
      {children || 'Reset Wizard'}
    </>
  );

  // Default confirmation messages
  const defaultTitle = confirmationTitle || 'Reset Recipe Wizard?';
  const defaultMessage = confirmationMessage || 
    'Are you sure you want to start over? All your progress will be lost, including your health concern, demographics, and selected potential causes.';

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={compact ? 'icon' : size}
          className={cn(
            'transition-colors',
            compact && 'h-9 w-9',
            className
          )}
          disabled={isResetting}
          title={compact ? 'Reset Recipe Wizard' : undefined}
        >
          {isResetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            buttonContent
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            {defaultTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {defaultMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleDialogClose}
            disabled={isResetting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResetWizard}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Wizard
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Compact Reset Button for headers/toolbars
 */
export function CompactResetWizardButton(props: Omit<ResetWizardButtonProps, 'compact'>) {
  return <ResetWizardButton {...props} compact={true} />;
}

/**
 * Destructive Reset Button for prominent placement
 */
export function DestructiveResetWizardButton(props: ResetWizardButtonProps) {
  return <ResetWizardButton {...props} variant="destructive" />;
}
