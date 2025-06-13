/**
 * @fileoverview Demographics Form component for Essential Oil Recipe Creator.
 * Collects user demographics with validation and auto-save functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { demographicsSchema } from '../schemas/recipe-schemas';
import type { DemographicsData, PotentialCause } from '../types/recipe.types';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import { cn } from '@/lib/utils';
import { AIStreamingModal } from '@/components/ui/ai-streaming-modal';

/**
 * Age category options (simplified as per user preferences)
 */
const AGE_CATEGORIES = [
  { value: 'child', label: 'Child (0-12)', description: 'Pediatric considerations' },
  { value: 'teen', label: 'Teen (13-17)', description: 'Adolescent development' },
  { value: 'adult', label: 'Adult (18-64)', description: 'General adult population' },
  { value: 'senior', label: 'Senior (65+)', description: 'Elderly considerations' },
] as const;

/**
 * Gender options (simplified as per user preferences)
 */
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

/**
 * Demographics Form component
 */
export function DemographicsForm() {
  const {
    healthConcern,
    demographics,
    updateDemographics,
    potentialCauses,
    setPotentialCauses,
    isLoading,
    error,
    setLoading,
    setError,
    clearError
  } = useRecipeStore();

  const {
    isStreamingCauses,
    streamingError,
    setStreamingCauses,
    setStreamingError,
    clearStreamingError
  } = useRecipeStore();
  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();

  // Ref to track if we've already navigated to avoid infinite loops
  const hasNavigatedRef = React.useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);


  // Configure AI streaming hook for potential causes
  const {
    startStream,
    partialData,
    finalData,
    error: streamError,
    isComplete
  } = useAIStreaming<PotentialCause[]>({
    jsonArrayPath: 'data.potential_causes',
    onError: (error) => {
      console.error('Streaming error:', error);
      setStreamingError(`AI analysis failed: ${error.message}`);
      return false; // Don't retry on error
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<DemographicsData>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      gender: demographics?.gender || undefined,
      ageCategory: demographics?.ageCategory || '',
      specificAge: demographics?.specificAge || undefined
    },
    mode: 'onChange'
  });

  const watchedGender = watch('gender');
  const watchedAgeCategory = watch('ageCategory');
  const watchedSpecificAge = watch('specificAge');

  /**
   * Auto-save functionality
   */
  const autoSave = async (data: DemographicsData) => {
    if (!isDirty || !isValid) return;

    setIsSaving(true);
    try {
      updateDemographics(data);
      setLastSaved(new Date());

      // Mark step as completed if all required fields are filled
      if (data.gender && data.ageCategory && data.specificAge) {
        markCurrentStepCompleted();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Auto-save on form changes
   */
  useEffect(() => {
    if (watchedGender && watchedAgeCategory && watchedSpecificAge) {
      const timeoutId = setTimeout(() => {
        autoSave({
          gender: watchedGender,
          ageCategory: watchedAgeCategory,
          specificAge: watchedSpecificAge
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [watchedGender, watchedAgeCategory, watchedSpecificAge]);

  /**
   * Initialize form with existing data
   */
  useEffect(() => {
    if (demographics) {
      setValue('gender', demographics.gender);
      setValue('ageCategory', demographics.ageCategory);
      setValue('specificAge', demographics.specificAge);
    }
  }, [demographics, setValue]);

  /**
   * Handle form submission and initiate AI streaming for potential causes
   */
  const onSubmit = async (data: DemographicsData) => {
    if (!healthConcern) {
      setError('Health concern is required to proceed');
      return;
    }

    try {
      // Save demographics data first
      updateDemographics(data);
      markCurrentStepCompleted();

      // Reset navigation flag for new streaming session
      hasNavigatedRef.current = false;

      // Start AI streaming for potential causes
      setStreamingCauses(true);
      clearError();
      clearStreamingError();

      console.log('Starting AI streaming for potential causes...');

      await startStream('/api/ai/streaming', {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: healthConcern.healthConcern,
          demographics: {
            gender: data.gender,
            ageCategory: data.ageCategory,
            specificAge: data.specificAge,
            language: 'en' // Default language
          }
        }
      });

      console.log('AI streaming initiated successfully');

    } catch (error) {
      console.error('Form submission failed:', error);
      setStreamingError(error instanceof Error ? error.message : 'Failed to start AI analysis');
    }
  };

  /**
   * Handle streaming data updates - Only complete items
   */
  React.useEffect(() => {
    if (partialData && Array.isArray(partialData) && partialData.length > 0) {
      console.log('📥 Received complete streaming items:', partialData.length, 'total');

      // Only process items that have all required fields (complete items only)
      const completeItems = partialData.filter((cause: any) =>
        cause.name_localized &&
        cause.suggestion_localized &&
        cause.explanation_localized &&
        cause.name_localized.length > 5 &&
        cause.suggestion_localized.length > 10 &&
        cause.explanation_localized.length > 15
      );

      console.log('✅ Complete items found:', completeItems.length, 'of', partialData.length);

      // Transform recipe-wizard format to create-recipe format
      const transformedCauses = completeItems.map((cause: any, index: number) => ({
        cause_name: cause.name_localized,
        cause_suggestion: cause.suggestion_localized,
        explanation: cause.explanation_localized
      }));

      setPotentialCauses(transformedCauses);
    }
  }, [partialData, setPotentialCauses]);

  /**
   * Handle streaming completion
   */
  React.useEffect(() => {
    if (isComplete && finalData && !hasNavigatedRef.current) {
      console.log('Streaming completed with final data:', finalData);

      // Extract potential causes from final data
      let causes: any[] = [];
      if (Array.isArray(finalData)) {
        causes = finalData;
      } else if (finalData && typeof finalData === 'object' && 'data' in finalData) {
        const data = finalData as any;
        if (data.data?.potential_causes && Array.isArray(data.data.potential_causes)) {
          causes = data.data.potential_causes;
        }
      }

      // Transform to create-recipe format
      const transformedCauses = causes.map((cause: any) => ({
        cause_name: cause.name_localized || cause.cause_id || 'Unknown cause',
        cause_suggestion: cause.suggestion_localized || '',
        explanation: cause.explanation_localized || ''
      }));

      setPotentialCauses(transformedCauses);
      setStreamingCauses(false);

      // Mark that we've navigated to prevent infinite loops
      hasNavigatedRef.current = true;

      // Navigate to causes step after a short delay to ensure state is updated
      setTimeout(() => {
        if (canGoNext()) {
          goToNext();
        }
      }, 100);
    }
  }, [isComplete, finalData, setPotentialCauses, setStreamingCauses]);

  /**
   * Handle streaming errors
   */
  React.useEffect(() => {
    if (streamError) {
      setStreamingError(`AI analysis failed: ${streamError}`);
    }
  }, [streamError, setStreamingError]);

  /**
   * Handle continue to next step
   */
  const handleContinue = async () => {
    if (isValid) {
      const data = {
        gender: watchedGender,
        ageCategory: watchedAgeCategory,
        specificAge: watchedSpecificAge
      };
      await onSubmit(data);
    }
  };

  /**
   * Handle go back
   */
  const handleGoBack = async () => {
    if (canGoPrevious()) {
      await goToPrevious();
    }
  };

  return (
    <div data-testid="demographics-form" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          This information helps us provide more personalized essential oil recommendations based on your demographics.
        </p>
      </div>

      {/* Error Display */}
      {(error || streamingError) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error || streamingError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gender Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Gender *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  watchedGender === option.value
                    ? "border-primary bg-primary/5"
                    : "border-input"
                )}
              >
                <input
                  type="radio"
                  {...register('gender')}
                  value={option.value}
                  className="w-4 h-4 text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>

          {errors.gender && (
            <p className="text-destructive text-sm">{errors.gender.message}</p>
          )}
        </div>

        {/* Age Category Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Age Category *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGE_CATEGORIES.map((category) => (
              <label
                key={category.value}
                className={cn(
                  "flex flex-col space-y-1 p-4 border rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  watchedAgeCategory === category.value
                    ? "border-primary bg-primary/5"
                    : "border-input"
                )}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    {...register('ageCategory')}
                    value={category.value}
                    className="w-4 h-4 text-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-7">
                  {category.description}
                </span>
              </label>
            ))}
          </div>

          {errors.ageCategory && (
            <p className="text-destructive text-sm">{errors.ageCategory.message}</p>
          )}
        </div>

        {/* Specific Age Input */}
        <div className="space-y-2">
          <label htmlFor="specificAge" className="text-sm font-medium text-foreground">
            Specific Age *
          </label>

          <div className="relative">
            <input
              id="specificAge"
              type="number"
              {...register('specificAge', { valueAsNumber: true })}
              placeholder="Enter your age"
              min="0"
              max="120"
              className={cn(
                "w-full px-3 py-2 border rounded-md",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground",
                errors.specificAge
                  ? "border-destructive focus:ring-destructive"
                  : "border-input"
              )}
              disabled={isLoading}
            />
          </div>

          {errors.specificAge && (
            <p className="text-destructive text-sm">{errors.specificAge.message}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Age helps us recommend appropriate essential oil concentrations and usage guidelines.
          </p>
        </div>

        {/* Auto-save Status */}
        {(isSaving || lastSaved) && !isStreamingCauses && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {isSaving && (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                <span>Saving...</span>
              </>
            )}
            {lastSaved && !isSaving && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        )}



        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={!canGoPrevious() || isLoading}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
              canGoPrevious()
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            ← Previous
          </button>

          <div className="flex items-center space-x-4">
            {isValid && !isStreamingCauses && (
              <span className="text-sm text-green-600">✓ Ready to continue</span>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid || isLoading || isStreamingCauses}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isValid && !isStreamingCauses
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isStreamingCauses ? 'Analyzing...' : isLoading ? 'Processing...' : 'Continue →'}
            </button>
          </div>
        </div>
      </form>

      {/* AI Streaming Modal */}
      <AIStreamingModal
        isOpen={isStreamingCauses}
        title="AI Analysis in Progress"
        description="Identifying potential causes based on your demographics and health concerns"
        items={potentialCauses.map((cause, index) => ({
          id: `cause-${index}-${cause.cause_name?.slice(0, 10) || 'unknown'}`, // Stable ID based on content
          title: cause.cause_name || `Potential Cause ${index + 1}`,
          subtitle: cause.cause_suggestion || 'Analyzing recommendations...',
          description: cause.explanation || 'Detailed analysis in progress...',
          timestamp: new Date()
        }))}
        maxVisibleItems={50}
        className="max-w-4xl"
        analysisType="causes"
        onClose={() => {
          // Optional: Allow users to minimize modal but keep streaming
          console.log('User requested to close modal');
        }}
      />
    </div>
  );
}
