/**
 * @fileoverview Symptoms Selection component for Essential Oil Recipe Creator.
 * Fetches and displays potential symptoms for user selection with validation.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { fetchPotentialSymptoms } from '../services/recipe-api.service';
import { symptomsSelectionSchema } from '../schemas/recipe-schemas';
import type { PotentialSymptom } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Form data interface
 */
interface SymptomsSelectionData {
  selectedSymptoms: PotentialSymptom[];
}

/**
 * Symptoms Selection component
 */
export function SymptomsSelection() {
  const {
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    potentialSymptoms,
    updateSelectedSymptoms,
    setPotentialSymptoms,
    isLoading,
    error,
    setLoading,
    setError,
    clearError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeNavigation();
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<Set<string>>(new Set());

  const {
    handleSubmit,
    formState: { isValid }
  } = useForm<SymptomsSelectionData>({
    resolver: zodResolver(symptomsSelectionSchema),
    mode: 'onChange'
  });

  /**
   * Initialize selected symptoms from store
   */
  useEffect(() => {
    if (selectedSymptoms.length > 0) {
      const ids = new Set(selectedSymptoms.map(symptom => symptom.symptom_name));
      setSelectedSymptomIds(ids);
    }
  }, [selectedSymptoms]);

  /**
   * Fetch potential symptoms on component mount
   */
  const loadPotentialSymptoms = useCallback(async () => {
    if (!healthConcern || !demographics || selectedCauses.length === 0) {
      setError('Missing required information. Please complete previous steps.');
      return;
    }

    if (potentialSymptoms.length > 0) {
      return; // Already loaded
    }

    setIsLoadingSymptoms(true);
    clearError();

    try {
      const symptoms = await fetchPotentialSymptoms(healthConcern, demographics, selectedCauses);
      setPotentialSymptoms(symptoms);
    } catch (error) {
      console.error('Failed to fetch potential symptoms:', error);
      setError('Failed to load potential symptoms. Please try again.');
    } finally {
      setIsLoadingSymptoms(false);
    }
  }, [healthConcern, demographics, selectedCauses, potentialSymptoms.length, setPotentialSymptoms, setError, clearError]);

  useEffect(() => {
    loadPotentialSymptoms();
  }, [loadPotentialSymptoms]);

  /**
   * Handle symptom selection toggle
   */
  const handleSymptomToggle = (symptom: PotentialSymptom) => {
    const newSelectedIds = new Set(selectedSymptomIds);
    const symptomId = symptom.symptom_name;

    if (newSelectedIds.has(symptomId)) {
      newSelectedIds.delete(symptomId);
    } else {
      if (newSelectedIds.size >= 15) {
        setError('You can select up to 15 symptoms maximum.');
        return;
      }
      newSelectedIds.add(symptomId);
      clearError();
    }

    setSelectedSymptomIds(newSelectedIds);

    // Update store with selected symptoms
    const newSelectedSymptoms = potentialSymptoms.filter(s =>
      newSelectedIds.has(s.symptom_name)
    );
    updateSelectedSymptoms(newSelectedSymptoms);

    // Mark step as completed if at least one symptom is selected
    if (newSelectedSymptoms.length > 0) {
      markCurrentStepCompleted();
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async () => {
    if (selectedSymptomIds.size === 0) {
      setError('Please select at least one symptom.');
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
   * Handle retry loading symptoms
   */
  const handleRetry = () => {
    clearError();
    loadPotentialSymptoms();
  };

  const isFormValid = selectedSymptomIds.size > 0 && selectedSymptomIds.size <= 15;

  return (
    <div data-testid="symptoms-selection" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          What symptoms are you experiencing?
        </h2>
        <p className="text-muted-foreground">
          Based on your selected causes, here are potential symptoms. Select all that you're currently experiencing.
        </p>
      </div>

      {/* Selected Causes Summary */}
      {selectedCauses.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Selected causes:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCauses.map((cause, index) => (
              <span
                key={`${cause.cause_name}-${index}`}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {cause.cause_name}
              </span>
            ))}
          </div>
        </div>
      )}

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
      {isLoadingSymptoms && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading potential symptoms...</p>
          </div>
        </div>
      )}

      {/* Symptoms Selection */}
      {!isLoadingSymptoms && potentialSymptoms.length > 0 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Selection Counter */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Select 1-15 symptoms that you're experiencing
            </p>
            <span className={cn(
              "text-sm font-medium",
              selectedSymptomIds.size > 15 ? "text-destructive" : "text-foreground"
            )}>
              {selectedSymptomIds.size}/15 selected
            </span>
          </div>

          {/* Symptoms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {potentialSymptoms.map((symptom, index) => {
              const isSelected = selectedSymptomIds.has(symptom.symptom_name);

              return (
                <div
                  key={`${symptom.symptom_name}-${index}`}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all duration-200",
                    "hover:shadow-md",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-input hover:border-primary/50"
                  )}
                  onClick={() => handleSymptomToggle(symptom)}
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
                        {symptom.symptom_name}
                      </h3>

                      {symptom.symptom_suggestion && (
                        <p className="text-sm text-muted-foreground">
                          {symptom.symptom_suggestion}
                        </p>
                      )}

                      {symptom.explanation && (
                        <p className="text-xs text-muted-foreground italic">
                          {symptom.explanation}
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
      {!isLoadingSymptoms && potentialSymptoms.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No potential symptoms found. Please go back and check your selected causes.
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
