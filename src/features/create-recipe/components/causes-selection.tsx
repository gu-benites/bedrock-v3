/**
 * @fileoverview Causes Selection component for Essential Oil Recipe Creator.
 * Fetches and displays potential causes for user selection with validation.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import type { PotentialCause } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Causes Selection component
 */
export function CausesSelection() {
  const {
    healthConcern,
    demographics,
    selectedCauses,
    potentialCauses,
    updateSelectedCauses,
    setPotentialCauses,
    isLoading,
    error,
    setLoading,
    setError,
    clearError
  } = useRecipeStore();

  const {
    isStreamingCauses,
    streamingError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [selectedCauseIds, setSelectedCauseIds] = useState<Set<string>>(new Set());

  // Determine if we're in a loading state (either local loading or streaming from demographics)
  const isLoadingCauses = isStreamingCauses || isLoading;

  /**
   * Initialize selected causes from store
   */
  useEffect(() => {
    if (selectedCauses.length > 0) {
      const ids = new Set(selectedCauses.map(cause => cause.cause_name));
      setSelectedCauseIds(ids);
    }
  }, [selectedCauses]);

  /**
   * Check if potential causes are available (now loaded via AI streaming from demographics step)
   */
  const loadPotentialCauses = useCallback(async () => {
    // If data is missing, check if we should redirect to earlier steps
    if (!healthConcern || !demographics) {
      // Don't show error immediately - let navigation handle redirects
      // Only show error if user tries to stay on this step
      return;
    }

    // Potential causes should already be loaded via AI streaming from demographics step
    // If not available and not currently streaming, show message to go back and complete demographics
    if (potentialCauses.length === 0 && !isStreamingCauses) {
      setError('Potential causes not found. Please go back to the demographics step to generate them.');
      return;
    }

    clearError();
  }, [healthConcern, demographics, potentialCauses.length, setError, clearError]);

  /**
   * Check if we have required data and show appropriate state
   */
  const checkRequiredData = useCallback(() => {
    if (!healthConcern || !demographics) {
      // Don't set errors during reset/navigation - let the navigation system handle redirects
      return;
    } else {
      clearError();
      loadPotentialCauses();
    }
  }, [healthConcern, demographics, loadPotentialCauses, clearError]);

  useEffect(() => {
    const cleanup = checkRequiredData();
    return cleanup;
  }, [checkRequiredData]);

  /**
   * Handle cause selection toggle
   */
  const handleCauseToggle = (cause: PotentialCause) => {
    const newSelectedIds = new Set(selectedCauseIds);
    const causeId = cause.cause_name;

    if (newSelectedIds.has(causeId)) {
      newSelectedIds.delete(causeId);
    } else {
      if (newSelectedIds.size >= 10) {
        setError('You can select up to 10 causes maximum.');
        return;
      }
      newSelectedIds.add(causeId);
      clearError();
    }

    setSelectedCauseIds(newSelectedIds);

    // Update store with selected causes
    const newSelectedCauses = potentialCauses.filter(c =>
      newSelectedIds.has(c.cause_name)
    );
    updateSelectedCauses(newSelectedCauses);

    // Mark step as completed if at least one cause is selected
    if (newSelectedCauses.length > 0) {
      markCurrentStepCompleted();
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCauseIds.size === 0) {
      setError('Please select at least one potential cause.');
      return;
    }

    try {
      markCurrentStepCompleted();

      if (canGoNext()) {
        await goToNext();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      setError('Failed to proceed to next step. Please try again.');
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

  /**
   * Handle retry loading causes
   */
  const handleRetry = () => {
    clearError();
    loadPotentialCauses();
  };

  const isFormValid = selectedCauseIds.size > 0 && selectedCauseIds.size <= 10;

  return (
    <div data-testid="causes-selection" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          What might be causing your health concern?
        </h2>
        <p className="text-muted-foreground">
          Based on your health concern, here are some potential causes. Select all that might apply to your situation.
        </p>
      </div>

      {/* Health Concern Summary */}
      {healthConcern && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Your health concern:</h3>
          <p className="text-sm text-muted-foreground italic">
            "{healthConcern.healthConcern}"
          </p>
        </div>
      )}

      {/* Error Display */}
      {(error || streamingError) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-destructive text-sm">{error || streamingError}</p>
            {(error?.includes('Failed to load') || streamingError?.includes('failed')) && (
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingCauses && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              {isStreamingCauses
                ? 'AI is analyzing your information to identify potential causes...'
                : 'Loading potential causes...'
              }
            </p>
            {isStreamingCauses && (
              <p className="text-xs text-muted-foreground">
                This may take a few moments as we generate personalized recommendations
              </p>
            )}
          </div>
        </div>
      )}

      {/* Streaming Progress Indicator */}
      {isStreamingCauses && potentialCauses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse rounded-full h-3 w-3 bg-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Generating potential causes... ({potentialCauses.length} found so far)
              </p>
              <p className="text-xs text-blue-600">
                You can review the causes below while we continue analyzing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Causes Selection */}
      {potentialCauses.length > 0 && !isLoading && (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Selection Counter */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Select 1-10 causes that might apply to you
            </p>
            <span className={cn(
              "text-sm font-medium",
              selectedCauseIds.size > 10 ? "text-destructive" : "text-foreground"
            )}>
              {selectedCauseIds.size}/10 selected
            </span>
          </div>

          {/* Causes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {potentialCauses.map((cause, index) => {
              const isSelected = selectedCauseIds.has(cause.cause_name);

              return (
                <div
                  key={`${cause.cause_name}-${index}`}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all duration-200",
                    "hover:shadow-md",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-input hover:border-primary/50"
                  )}
                  onClick={() => handleCauseToggle(cause)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-input"
                      )}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-foreground">
                        {cause.cause_name}
                      </h3>

                      {cause.cause_suggestion && (
                        <p className="text-sm text-muted-foreground">
                          {cause.cause_suggestion}
                        </p>
                      )}

                      {cause.explanation && (
                        <p className="text-xs text-muted-foreground italic">
                          {cause.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              {isFormValid && (
                <span className="text-sm text-green-600">✓ Ready to continue</span>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isFormValid
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading ? 'Processing...' : 'Continue →'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty State */}
      {!isLoadingCauses && potentialCauses.length === 0 && !error && !streamingError && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No potential causes found. Please go back and check your health concern.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
}
