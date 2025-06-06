/**
 * @fileoverview Properties Display component for Essential Oil Recipe Creator.
 * Fetches and displays therapeutic properties based on selected causes and symptoms.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { fetchTherapeuticProperties } from '../services/recipe-api.service';
import type { TherapeuticProperty } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Properties Display component
 */
export function PropertiesDisplay() {
  const {
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties,
    setTherapeuticProperties,
    isLoading,
    error,
    setLoading,
    setError,
    clearError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeNavigation();
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  /**
   * Fetch therapeutic properties on component mount
   */
  const loadTherapeuticProperties = useCallback(async () => {
    if (!healthConcern || !demographics || selectedCauses.length === 0 || selectedSymptoms.length === 0) {
      setError('Missing required information. Please complete previous steps.');
      return;
    }

    if (therapeuticProperties.length > 0) {
      return; // Already loaded
    }

    setIsLoadingProperties(true);
    clearError();

    try {
      const properties = await fetchTherapeuticProperties(
        healthConcern,
        demographics,
        selectedCauses,
        selectedSymptoms
      );
      setTherapeuticProperties(properties);

      // Auto-mark step as completed when properties are loaded
      if (properties.length > 0) {
        markCurrentStepCompleted();
      }
    } catch (error) {
      console.error('Failed to fetch therapeutic properties:', error);
      setError('Failed to load therapeutic properties. Please try again.');
    } finally {
      setIsLoadingProperties(false);
    }
  }, [
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties.length,
    setTherapeuticProperties,
    setError,
    clearError,
    markCurrentStepCompleted
  ]);

  useEffect(() => {
    loadTherapeuticProperties();
  }, [loadTherapeuticProperties]);

  /**
   * Handle continue to next step
   */
  const handleContinue = async () => {
    try {
      markCurrentStepCompleted();

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

  /**
   * Handle retry loading properties
   */
  const handleRetry = () => {
    clearError();
    loadTherapeuticProperties();
  };

  /**
   * Get relevancy color
   */
  const getRelevancyColor = (relevancy: number) => {
    if (relevancy >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (relevancy >= 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (relevancy >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  /**
   * Get relevancy label
   */
  const getRelevancyLabel = (relevancy: number) => {
    if (relevancy >= 4) return 'Highly Relevant';
    if (relevancy >= 3) return 'Very Relevant';
    if (relevancy >= 2) return 'Moderately Relevant';
    return 'Somewhat Relevant';
  };

  return (
    <div data-testid="properties-display" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Recommended Therapeutic Properties
        </h2>
        <p className="text-muted-foreground">
          Based on your health concern, causes, and symptoms, here are the therapeutic properties that may help you.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Selected Causes:</h3>
          <div className="flex flex-wrap gap-1">
            {selectedCauses.slice(0, 3).map((cause, index) => (
              <span
                key={`${cause.cause_name}-${index}`}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {cause.cause_name}
              </span>
            ))}
            {selectedCauses.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                +{selectedCauses.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Selected Symptoms:</h3>
          <div className="flex flex-wrap gap-1">
            {selectedSymptoms.slice(0, 3).map((symptom, index) => (
              <span
                key={`${symptom.symptom_name}-${index}`}
                className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md"
              >
                {symptom.symptom_name}
              </span>
            ))}
            {selectedSymptoms.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                +{selectedSymptoms.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-destructive text-sm">{error}</p>
            {error.includes('Failed to load') && (
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
      {isLoadingProperties && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Analyzing your information and finding therapeutic properties...</p>
          </div>
        </div>
      )}

      {/* Properties Display */}
      {!isLoadingProperties && therapeuticProperties.length > 0 && (
        <div className="space-y-6">
          {/* Properties Grid */}
          <div className="space-y-4">
            {therapeuticProperties
              .sort((a, b) => b.relevancy - a.relevancy) // Sort by relevancy (highest first)
              .map((property, index) => (
                <div
                  key={`${property.property_id}-${index}`}
                  className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {property.property_name}
                      </h3>
                      {property.property_name_in_english !== property.property_name && (
                        <p className="text-sm text-muted-foreground">
                          ({property.property_name_in_english})
                        </p>
                      )}
                    </div>

                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      getRelevancyColor(property.relevancy)
                    )}>
                      {getRelevancyLabel(property.relevancy)} ({property.relevancy}/5)
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground">
                    {property.description}
                  </p>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.causes_addressed && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">Addresses Causes:</h4>
                        <p className="text-sm text-muted-foreground">
                          {property.causes_addressed}
                        </p>
                      </div>
                    )}

                    {property.symptoms_addressed && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">Addresses Symptoms:</h4>
                        <p className="text-sm text-muted-foreground">
                          {property.symptoms_addressed}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-900">
                  Next: Essential Oil Recommendations
                </h4>
                <p className="text-sm text-blue-700">
                  In the next step, we'll recommend specific essential oils that have these therapeutic properties to help with your health concern.
                </p>
              </div>
            </div>
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
              <span className="text-sm text-green-600">✓ Analysis complete</span>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isLoading ? 'Processing...' : 'View Essential Oils →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingProperties && therapeuticProperties.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No therapeutic properties found. Please go back and check your selections.
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
