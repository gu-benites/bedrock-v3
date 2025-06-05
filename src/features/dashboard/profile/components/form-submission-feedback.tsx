// src/features/dashboard/profile/components/form-submission-feedback.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { type ProfileUpdateProgress, type ProfileUpdateError } from '../hooks/use-profile-update';

interface FormSubmissionFeedbackProps {
  isSubmitting?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  progress?: ProfileUpdateProgress | null;
  errors?: Record<string, ProfileUpdateError>;
  successMessage?: string;
  onDismiss?: () => void;
  className?: string;
}

export const FormSubmissionFeedback: React.FC<FormSubmissionFeedbackProps> = ({
  isSubmitting = false,
  isSuccess = false,
  isError = false,
  progress,
  errors = {},
  successMessage = 'Profile updated successfully!',
  onDismiss,
  className
}) => {
  const hasErrors = Object.keys(errors).length > 0;
  const showFeedback = isSubmitting || isSuccess || isError || hasErrors;

  if (!showFeedback) return null;

  return (
    <AnimatePresence mode="wait">
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn("space-y-3", className)}
        >
          {/* Progress indicator during submission */}
          {isSubmitting && progress && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertTitle className="text-blue-800">
                {progress.message}
              </AlertTitle>
              <AlertDescription className="mt-2">
                <Progress 
                  value={progress.progress} 
                  className="w-full h-2"
                />
                <p className="text-sm text-blue-600 mt-1">
                  {progress.progress}% complete
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {isSuccess && !isSubmitting && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success!</AlertTitle>
                <AlertDescription className="text-green-700">
                  {successMessage}
                </AlertDescription>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
                    onClick={onDismiss}
                  >
                    <X size={14} />
                  </Button>
                )}
              </Alert>
            </motion.div>
          )}

          {/* Error messages */}
          {hasErrors && !isSubmitting && (
            <div className="space-y-2">
              {Object.entries(errors).map(([type, error]) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {type === 'text' && 'Profile Information Error'}
                      {type === 'avatar' && 'Profile Picture Error'}
                      {type === 'banner' && 'Banner Image Error'}
                      {type === 'validation' && 'Validation Error'}
                      {type === 'network' && 'Network Error'}
                      {type === 'unknown' && 'Unexpected Error'}
                    </AlertTitle>
                    <AlertDescription>
                      {error.message}
                      {error.field && (
                        <span className="block text-sm mt-1 opacity-75">
                          Field: {error.field}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ))}
            </div>
          )}

          {/* General error state */}
          {isError && !hasErrors && !isSubmitting && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  An error occurred while updating your profile. Please try again.
                </AlertDescription>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                    onClick={onDismiss}
                  >
                    <X size={14} />
                  </Button>
                )}
              </Alert>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simplified progress indicator component
interface ProgressIndicatorProps {
  progress: ProfileUpdateProgress;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  className
}) => {
  const getStepIcon = (step: ProfileUpdateProgress['step']) => {
    switch (step) {
      case 'validating':
        return <Info className="h-4 w-4" />;
      case 'updating-text':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'updating-avatar':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'updating-banner':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'finalizing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className={cn("flex items-center space-x-3 p-3 bg-muted/50 rounded-lg", className)}>
      {getStepIcon(progress.step)}
      <div className="flex-1">
        <p className="text-sm font-medium">{progress.message}</p>
        <Progress value={progress.progress} className="w-full h-1 mt-1" />
      </div>
      <span className="text-xs text-muted-foreground">
        {progress.progress}%
      </span>
    </div>
  );
};

// Error summary component
interface ErrorSummaryProps {
  errors: Record<string, ProfileUpdateError>;
  onClearErrors?: () => void;
  className?: string;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  onClearErrors,
  className
}) => {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) return null;

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {errorCount === 1 ? '1 Error' : `${errorCount} Errors`} Found
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {Object.entries(errors).map(([type, error]) => (
            <li key={type} className="text-sm">
              <strong className="capitalize">{type}:</strong> {error.message}
            </li>
          ))}
        </ul>
        {onClearErrors && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onClearErrors}
          >
            Clear Errors
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default FormSubmissionFeedback;
