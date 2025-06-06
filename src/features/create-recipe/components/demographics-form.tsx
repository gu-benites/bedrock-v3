/**
 * @fileoverview Demographics Form component for Essential Oil Recipe Creator.
 * Collects user demographics with validation and auto-save functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { demographicsSchema } from '../schemas/recipe-schemas';
import type { DemographicsData } from '../types/recipe.types';
import { cn } from '@/lib/utils';

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
  const { demographics, updateDemographics, isLoading, error } = useRecipeStore();
  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
   * Handle form submission
   */
  const onSubmit = async (data: DemographicsData) => {
    try {
      updateDemographics(data);
      markCurrentStepCompleted();

      if (canGoNext()) {
        await goToNext();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

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
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
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
        {(isSaving || lastSaved) && (
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
            {isValid && (
              <span className="text-sm text-green-600">✓ Ready to continue</span>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid || isLoading}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isValid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isLoading ? 'Processing...' : 'Continue →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
