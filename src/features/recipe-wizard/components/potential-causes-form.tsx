/**
 * @fileoverview Potential Causes Form component for Recipe Wizard
 * Displays AI-generated potential causes for user selection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type { PotentialCause } from '../types/recipe-wizard.types';
import { fetchPotentialCauses, AIServiceError } from '../services/ai-service';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';

/**
 * Potential Causes form component for selecting relevant causes
 */
export function PotentialCausesForm() {
  // Store state
  const {
    healthConcern,
    demographics,
    selectedCauses,
    potentialCauses,
    isLoading,
    error: storeError,
    updateSelectedCauses,
    setPotentialCauses,
    setCurrentStep,
    markStepCompleted,
    setLoading,
    setError,
    clearError
  } = useRecipeWizardStore();

  // Local state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedCauseIds, setSelectedCauseIds] = useState<Set<string>>(new Set());

  // Streaming AI hook
  const {
    streamingText,
    isStreaming,
    isComplete,
    error: streamingError,
    finalData,
    startStream,
    resetStream
  } = useAIStreaming<PotentialCause[]>();

  /**
   * Initialize selected causes from store
   */
  useEffect(() => {
    if (selectedCauses.length > 0) {
      const ids = new Set(selectedCauses.map(cause => cause.cause_id));
      setSelectedCauseIds(ids);
    }
  }, [selectedCauses]);

  /**
   * Start streaming potential causes from AI service
   */
  const loadPotentialCausesStreaming = useCallback(async () => {
    // Check if we have required data
    if (!healthConcern?.healthConcern || !demographics) {
      return;
    }

    // Don't fetch if we already have causes (unless it's a retry)
    if (potentialCauses.length > 0 && !streamingError) {
      return;
    }

    try {
      setLoading(true);
      clearError();

      await startStream('/api/ai/streaming', {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: healthConcern.healthConcern,
          demographics
        }
      });
    } catch (error) {
      console.error('Failed to start streaming potential causes:', error);
      setError('Failed to start analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [healthConcern, demographics, potentialCauses.length, streamingError, startStream, setLoading, setError, clearError]);

  /**
   * Fallback: Fetch potential causes from AI service (non-streaming)
   */
  const loadPotentialCauses = useCallback(async () => {
    // Check if we have required data
    if (!healthConcern || !demographics) {
      return;
    }

    // Don't fetch if we already have causes
    if (potentialCauses.length > 0) {
      return;
    }

    try {
      setLoading(true);
      clearError();

      const aiResponse = await fetchPotentialCauses({
        healthConcern: healthConcern.healthConcern,
        demographics
      });

      setPotentialCauses(aiResponse);
    } catch (error) {
      console.error('Failed to fetch potential causes:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        // Handle AIServiceError
        setError(`Failed to load potential causes: ${(error as any).message}`);
      } else {
        setError('Failed to load potential causes. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [healthConcern, demographics, potentialCauses.length, setPotentialCauses, setLoading, setError, clearError]);

  /**
   * Load potential causes when component mounts or dependencies change
   */
  useEffect(() => {
    loadPotentialCausesStreaming();
  }, [loadPotentialCausesStreaming]);

  /**
   * Handle streaming completion
   */
  useEffect(() => {
    if (isComplete && finalData) {
      setPotentialCauses(finalData);
    }
  }, [isComplete, finalData, setPotentialCauses]);

  /**
   * Cleanup streaming on unmount
   */
  useEffect(() => {
    return () => {
      resetStream();
    };
  }, [resetStream]);

  /**
   * Handle cause selection toggle
   */
  const handleCauseToggle = (cause: PotentialCause) => {
    const newSelectedIds = new Set(selectedCauseIds);
    const causeId = cause.cause_id;

    if (newSelectedIds.has(causeId)) {
      newSelectedIds.delete(causeId);
    } else {
      newSelectedIds.add(causeId);
    }

    setSelectedCauseIds(newSelectedIds);

    // Update store with selected causes
    const newSelectedCauses = potentialCauses.filter(c =>
      newSelectedIds.has(c.cause_id)
    );
    updateSelectedCauses(newSelectedCauses);

    // Clear validation errors when user makes selection
    if (validationError && newSelectedCauses.length > 0) {
      setValidationError(null);
      clearError();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate selection
    if (selectedCauseIds.size === 0) {
      setValidationError('Please select at least one potential cause.');
      return;
    }

    try {
      // Clear any existing errors
      setValidationError(null);
      clearError();

      // Mark step as completed
      markStepCompleted(RecipeWizardStep.POTENTIAL_CAUSES);

      // Navigate to next step (for MVP, this might be the end or next step)
      // TODO: Update when next step is defined
      console.log('Potential causes selection completed:', selectedCauses);

    } catch (error) {
      console.error('Failed to save potential causes:', error);
      setError('Failed to save your selection. Please try again.');
    }
  };

  /**
   * Handle keyboard navigation for cause selection
   */
  const handleCauseKeyDown = (event: React.KeyboardEvent, cause: PotentialCause) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCauseToggle(cause);
    }
  };

  /**
   * Handle retry loading causes
   */
  const handleRetry = () => {
    clearError();
    resetStream();
    loadPotentialCausesStreaming();
  };

  const displayError = validationError || storeError;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Potential Causes
        </h1>
        <p className="text-gray-600">
          Select the potential causes that might be contributing to your health concern.
        </p>
      </div>

      {/* Health Concern Summary */}
      {healthConcern && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your health concern:</h3>
          <p className="text-sm text-gray-600 italic">
            "{healthConcern.healthConcern}"
          </p>
        </div>
      )}

      {/* Missing Health Concern Message */}
      {(!healthConcern || !healthConcern.healthConcern) && (
        <div
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-md"
          data-testid="missing-health-concern-message"
        >
          <p className="text-sm text-yellow-600">
            Please complete the health concern step first.
          </p>
        </div>
      )}

      {/* Streaming Analysis Display */}
      {isStreaming && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div
                className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"
                data-testid="typing-indicator"
              ></div>
              <h3 className="text-sm font-medium text-gray-700">
                AI Analysis in Progress
              </h3>
            </div>

            <div
              className="text-sm text-gray-600 leading-relaxed min-h-[2rem]"
              data-testid="streaming-text-display"
            >
              {streamingText || 'Preparing analysis...'}
            </div>
          </div>
        </div>
      )}

      {/* Streaming Error Display */}
      {streamingError && !displayError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          data-testid="streaming-error-message"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-600">
              {streamingError}
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-600">
              {displayError}
            </div>
            {displayError.includes('Failed to load') && (
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Initial Loading State */}
      {isLoading && potentialCauses.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
              role="status"
              aria-hidden="true"
              data-testid="initial-loading-spinner"
            ></div>
            <p className="text-gray-600">Preparing analysis...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && potentialCauses.length === 0 && !displayError && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No potential causes found. Please check your previous responses.
          </p>
        </div>
      )}

      {/* Form */}
      {potentialCauses.length > 0 && (
        <form onSubmit={handleSubmit} role="form" className="space-y-6">
          {/* Selection Counter */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Select all that might apply to your situation
            </p>
            <span className="text-sm font-medium text-gray-700">
              {selectedCauseIds.size} selected
            </span>
          </div>

          {/* Causes Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="causes-selection-list"
          >
            {potentialCauses.map((cause) => {
              const isSelected = selectedCauseIds.has(cause.cause_id);

              return (
                <div
                  key={cause.cause_id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all duration-200
                    hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-300 hover:border-blue-300'
                    }
                  `}
                  onClick={() => handleCauseToggle(cause)}
                  onKeyDown={(e) => handleCauseKeyDown(e, cause)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-describedby={`cause-desc-${cause.cause_id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-gray-900">
                        {cause.name_localized}
                      </h3>

                      <p
                        id={`cause-desc-${cause.cause_id}`}
                        className="text-sm text-gray-600"
                      >
                        {cause.suggestion_localized}
                      </p>

                      {cause.explanation_localized && (
                        <p className="text-xs text-gray-500 italic">
                          {cause.explanation_localized}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`
                px-6 py-2 rounded-md font-medium text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isLoading
                  ? 'bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Select the causes that best match your situation. This helps us provide more targeted recommendations.
        </p>
      </div>
    </div>
  );
}
