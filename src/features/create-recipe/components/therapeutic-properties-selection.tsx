/**
 * @fileoverview Therapeutic Properties Selection component for Essential Oil Recipe Creator.
 * Displays pre-loaded therapeutic properties for user review (non-interactive display).
 */

'use client';

import React, { useEffect } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import type { TherapeuticProperty } from '../types/recipe.types';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Therapeutic Properties Selection component
 * This component displays pre-loaded therapeutic properties from the symptoms step
 * It's a display-only component (not interactive selection)
 */
export function TherapeuticPropertiesSelection() {
  const {
    healthConcern,
    demographics,
    selectedSymptoms,
    therapeuticProperties,
    updateTherapeuticProperties,
    isLoading,
    error,
    setError,
    clearError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();

  /**
   * Check for pre-loaded data (data comes from symptoms step)
   */
  useEffect(() => {
    // Check if we have required data
    if (!healthConcern || !demographics || selectedSymptoms.length === 0) {
      return;
    }

    // Properties should already be loaded from symptoms step
    // If not available, show message to go back
    if (therapeuticProperties.length === 0) {
      setError('Therapeutic properties not found. Please go back to the symptoms step to generate them.');
      return;
    }

    // Mark step as completed since this is a display-only step
    markCurrentStepCompleted();
    clearError();
  }, [healthConcern, demographics, selectedSymptoms.length, therapeuticProperties.length, setError, clearError, markCurrentStepCompleted]);

  /**
   * Handle continue to next step
   */
  const handleContinue = async () => {
    try {
      if (canGoNext()) {
        await goToNext();
      }
    } catch (error) {
      console.error('Navigation failed:', error);
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

  return (
    <div data-testid="therapeutic-properties" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Recommended Therapeutic Properties
        </h2>
        <p className="text-muted-foreground">
          Based on your selected symptoms, here are the therapeutic properties that essential oils should possess to address your health concerns effectively.
        </p>
      </div>

      {/* Selected Symptoms Summary */}
      {selectedSymptoms.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Based on your symptoms:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((symptom, index) => (
              <span
                key={`${symptom.symptom_name}-${index}`}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {symptom.symptom_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Missing Data State */}
      {therapeuticProperties.length === 0 && !error && (
        <div className="text-center py-12 space-y-6">
          <div className="space-y-2">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold text-muted-foreground">Missing Required Data</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Therapeutic properties not found. Please go back to the symptoms step to generate them.
            </p>
          </div>

          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            ← Go Back to Symptoms
          </button>
        </div>
      )}

      {/* Therapeutic Properties Display */}
      {therapeuticProperties.length > 0 && (
        <div className="space-y-6">
          {/* Properties Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {therapeuticProperties.length} therapeutic properties identified
            </p>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Analysis Complete</span>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {therapeuticProperties.map((property, index) => (
              <div
                key={`${property.property_name || property.name_localized}-${index}`}
                className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground text-lg">
                      {property.property_name || property.name_localized}
                    </h3>
                    {property.relevancy && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {Math.round(property.relevancy * 100)}% match
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {property.description || property.description_localized}
                  </p>

                  {property.mechanism && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">
                        <strong>How it works:</strong> {property.mechanism}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoPrevious() || isLoading}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                "flex items-center space-x-2",
                canGoPrevious()
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to continue</span>
              </span>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!canGoNext() || isLoading}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "flex items-center space-x-2",
                  canGoNext()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <span>{isLoading ? 'Processing...' : 'Continue'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
