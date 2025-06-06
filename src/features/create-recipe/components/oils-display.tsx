/**
 * @fileoverview Oils Display component for Essential Oil Recipe Creator.
 * Fetches and displays essential oil recommendations based on therapeutic properties.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { fetchSuggestedOilsForAllProperties } from '../services/recipe-api.service';
import type { PropertyOilSuggestions, EssentialOil } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Oils Display component
 */
export function OilsDisplay() {
  const router = useRouter();
  const {
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties,
    suggestedOils,
    setSuggestedOils,
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    resetWizard
  } = useRecipeStore();

  const { goToPrevious, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [isLoadingOils, setIsLoadingOils] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  /**
   * Fetch suggested oils on component mount
   */
  const loadSuggestedOils = useCallback(async () => {
    // If data is missing, let navigation handle redirects
    if (!healthConcern || !demographics || selectedCauses.length === 0 ||
        selectedSymptoms.length === 0 || therapeuticProperties.length === 0) {
      return;
    }

    if (suggestedOils.length > 0) {
      return; // Already loaded
    }

    setIsLoadingOils(true);
    clearError();

    try {
      const oilSuggestions = await fetchSuggestedOilsForAllProperties(
        healthConcern,
        demographics,
        selectedCauses,
        selectedSymptoms,
        therapeuticProperties
      );
      setSuggestedOils(oilSuggestions);

      // Auto-mark step as completed when oils are loaded
      if (oilSuggestions.length > 0) {
        markCurrentStepCompleted();
      }
    } catch (error) {
      console.error('Failed to fetch suggested oils:', error);
      setError('Failed to load essential oil recommendations. Please try again.');
    } finally {
      setIsLoadingOils(false);
    }
  }, [
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties,
    suggestedOils.length,
    setSuggestedOils,
    setError,
    clearError,
    markCurrentStepCompleted
  ]);

  /**
   * Check if we have required data and show appropriate state
   */
  const checkRequiredData = useCallback(() => {
    if (!healthConcern || !demographics || selectedCauses.length === 0 ||
        selectedSymptoms.length === 0 || therapeuticProperties.length === 0) {
      // Don't set errors during reset/navigation - let the navigation system handle redirects
      return;
    } else {
      clearError();
      loadSuggestedOils();
    }
  }, [healthConcern, demographics, selectedCauses, selectedSymptoms, therapeuticProperties, loadSuggestedOils, clearError]);

  useEffect(() => {
    const cleanup = checkRequiredData();
    return cleanup;
  }, [checkRequiredData]);

  /**
   * Handle go back
   */
  const handleGoBack = async () => {
    if (canGoPrevious()) {
      await goToPrevious();
    }
  };

  /**
   * Handle retry loading oils
   */
  const handleRetry = () => {
    clearError();
    loadSuggestedOils();
  };

  /**
   * Handle start new recipe
   */
  const handleStartNew = () => {
    resetWizard();
    router.push('/dashboard/create-recipe/health-concern');
  };

  /**
   * Toggle property expansion
   */
  const togglePropertyExpansion = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  /**
   * Get relevancy color for oils
   */
  const getOilRelevancyColor = (relevancy: number) => {
    if (relevancy >= 4) return 'border-green-200 bg-green-50';
    if (relevancy >= 3) return 'border-blue-200 bg-blue-50';
    if (relevancy >= 2) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
  };

  /**
   * Get all unique oils with their highest relevancy
   */
  const getAllUniqueOils = () => {
    const oilMap = new Map<string, EssentialOil & { maxRelevancy: number; properties: string[] }>();

    suggestedOils.forEach(propertySuggestion => {
      propertySuggestion.suggested_oils.forEach(oil => {
        const key = oil.name_english;
        const existing = oilMap.get(key);

        if (!existing || oil.relevancy > existing.maxRelevancy) {
          oilMap.set(key, {
            ...oil,
            maxRelevancy: oil.relevancy,
            properties: existing ? [...existing.properties, propertySuggestion.property_name] : [propertySuggestion.property_name]
          });
        } else if (oil.relevancy === existing.maxRelevancy) {
          existing.properties.push(propertySuggestion.property_name);
        }
      });
    });

    return Array.from(oilMap.values()).sort((a, b) => b.maxRelevancy - a.maxRelevancy);
  };

  const uniqueOils = getAllUniqueOils();

  return (
    <div data-testid="oils-display" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          🌿 Your Essential Oil Recommendations
        </h2>
        <p className="text-muted-foreground">
          Based on your health concern and selected therapeutic properties, here are the essential oils that may help you.
        </p>
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
      {isLoadingOils && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Finding the perfect essential oils for you...</p>
          </div>
        </div>
      )}

      {/* Oils Display */}
      {!isLoadingOils && suggestedOils.length > 0 && (
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{uniqueOils.length}</div>
              <div className="text-sm text-muted-foreground">Recommended Oils</div>
            </div>
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{therapeuticProperties.length}</div>
              <div className="text-sm text-muted-foreground">Therapeutic Properties</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{uniqueOils.filter(oil => oil.maxRelevancy >= 4).length}</div>
              <div className="text-sm text-muted-foreground">Highly Relevant</div>
            </div>
          </div>

          {/* Top Recommended Oils */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Top Recommended Essential Oils</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueOils.slice(0, 6).map((oil, index) => (
                <div
                  key={`${oil.name_english}-${index}`}
                  className={cn(
                    "border rounded-lg p-4 space-y-3 transition-shadow hover:shadow-md",
                    getOilRelevancyColor(oil.maxRelevancy)
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-foreground">{oil.name_english}</h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < oil.maxRelevancy ? "text-yellow-400" : "text-gray-300"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {oil.name_local_language !== oil.name_english && (
                      <p className="text-sm text-muted-foreground">({oil.name_local_language})</p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{oil.oil_description}</p>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-foreground">Therapeutic Properties:</h5>
                    <div className="flex flex-wrap gap-1">
                      {oil.properties.slice(0, 2).map((property, propIndex) => (
                        <span
                          key={`${property}-${propIndex}`}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                        >
                          {property}
                        </span>
                      ))}
                      {oil.properties.length > 2 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                          +{oil.properties.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Breakdown by Property */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Oils by Therapeutic Property</h3>

            <div className="space-y-4">
              {suggestedOils.map((propertySuggestion, index) => {
                const isExpanded = expandedProperties.has(propertySuggestion.property_id);

                return (
                  <div
                    key={`${propertySuggestion.property_id}-${index}`}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => togglePropertyExpansion(propertySuggestion.property_id)}
                      className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-foreground">
                          {propertySuggestion.property_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {propertySuggestion.suggested_oils.length} recommended oils
                        </p>
                      </div>

                      <svg
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          {propertySuggestion.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {propertySuggestion.suggested_oils.map((oil, oilIndex) => (
                            <div
                              key={`${oil.name_english}-${oilIndex}`}
                              className="border rounded-md p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-foreground">{oil.name_english}</h5>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={cn(
                                        "w-3 h-3",
                                        i < oil.relevancy ? "text-yellow-400" : "text-gray-300"
                                      )}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{oil.oil_description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-amber-900">
                  Important Safety Information
                </h4>
                <p className="text-sm text-amber-700">
                  These recommendations are for informational purposes only. Always consult with a qualified aromatherapist or healthcare provider before using essential oils, especially if you have medical conditions, are pregnant, or are taking medications.
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
              <span className="text-sm text-green-600">✓ Recipe complete!</span>

              <button
                type="button"
                onClick={handleStartNew}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                Create New Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingOils && suggestedOils.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No essential oil recommendations found. Please go back and check your selections.
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
