/**
 * @fileoverview Health Concern Form component for Essential Oil Recipe Creator.
 * Allows users to input their health concern with validation and auto-save.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { healthConcernSchema } from '../schemas/recipe-schemas';
import type { HealthConcernData } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Health Concern Form component
 */
export function HealthConcernForm() {
  const { healthConcern, updateHealthConcern, isLoading, error } = useRecipeStore();
  const { goToNext, canGoNext, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<HealthConcernData>({
    resolver: zodResolver(healthConcernSchema),
    defaultValues: {
      healthConcern: healthConcern?.healthConcern || ''
    },
    mode: 'onChange'
  });

  const watchedHealthConcern = watch('healthConcern');

  /**
   * Auto-save functionality with debouncing
   */
  const autoSave = useCallback(async (data: HealthConcernData) => {
    if (!isDirty || !isValid) return;

    setIsSaving(true);
    try {
      updateHealthConcern(data);
      setLastSaved(new Date());

      // Mark step as completed if valid
      if (data.healthConcern.trim().length >= 3) {
        markCurrentStepCompleted();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isValid, updateHealthConcern, markCurrentStepCompleted]);

  /**
   * Debounced auto-save effect
   */
  useEffect(() => {
    if (!watchedHealthConcern || watchedHealthConcern.trim().length < 3) return;

    const timeoutId = setTimeout(() => {
      autoSave({ healthConcern: watchedHealthConcern });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [watchedHealthConcern, autoSave]);

  /**
   * Initialize form with existing data
   */
  useEffect(() => {
    if (healthConcern?.healthConcern) {
      setValue('healthConcern', healthConcern.healthConcern);
    }
  }, [healthConcern, setValue]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: HealthConcernData) => {
    try {
      updateHealthConcern(data);
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
    if (isValid && watchedHealthConcern.trim().length >= 3) {
      await onSubmit({ healthConcern: watchedHealthConcern });
    }
  };

  const characterCount = watchedHealthConcern?.length || 0;
  const isNearLimit = characterCount > 450;
  const isAtLimit = characterCount >= 500;

  return (
    <div data-testid="health-concern-form" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          What's your health concern?
        </h2>
        <p className="text-muted-foreground">
          Describe your health concern in detail. The more specific you are, the better we can help you find the right essential oils.
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
        <div className="space-y-2">
          <label
            htmlFor="healthConcern"
            className="text-sm font-medium text-foreground"
          >
            Health Concern *
          </label>

          <div className="relative">
            <textarea
              id="healthConcern"
              {...register('healthConcern')}
              placeholder="For example: I've been experiencing anxiety and stress from work, especially during busy periods. I have trouble sleeping and feel tense throughout the day..."
              className={cn(
                "w-full min-h-[120px] px-3 py-2 border rounded-md resize-y",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground",
                errors.healthConcern
                  ? "border-destructive focus:ring-destructive"
                  : "border-input",
                isAtLimit && "border-destructive"
              )}
              disabled={isLoading}
              maxLength={500}
            />

            {/* Character Counter */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              <span className={cn(
                isNearLimit && "text-orange-500",
                isAtLimit && "text-destructive"
              )}>
                {characterCount}/500
              </span>
            </div>
          </div>

          {/* Validation Error */}
          {errors.healthConcern && (
            <p className="text-destructive text-sm">
              {errors.healthConcern.message}
            </p>
          )}

          {/* Auto-save Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              {isSaving && (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                  <span>Saving...</span>
                </>
              )}
              {lastSaved && !isSaving && (
                <span>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="text-right">
              <p>Minimum 3 characters required</p>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            💡 Examples of good health concerns:
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• "I have chronic headaches that worsen with stress and lack of sleep"</li>
            <li>• "Experiencing digestive issues with bloating after meals"</li>
            <li>• "Difficulty falling asleep and staying asleep, feeling anxious at bedtime"</li>
            <li>• "Muscle tension in shoulders and neck from desk work"</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {isValid && characterCount >= 3 && (
              <span className="text-green-600">✓ Ready to continue</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!isValid || characterCount < 3 || isLoading}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isValid && characterCount >= 3
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? 'Processing...' : 'Continue →'}
          </button>
        </div>
      </form>
    </div>
  );
}
