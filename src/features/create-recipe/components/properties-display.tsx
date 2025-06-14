/**
 * @fileoverview Properties Display component for Essential Oil Recipe Creator.
 * Fetches and displays therapeutic properties based on selected causes and symptoms.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRecipeStore, useRecipeStreaming } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import { AIStreamingModal } from '@/components/ui/ai-streaming-modal';

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
    suggestedOils,
    updateTherapeuticProperties,
    updateSuggestedOils,
    isLoading,
    error,
    setError,
    clearError
  } = useRecipeStore();

  const {
    setStreamingError,
    streamingError
  } = useRecipeStreaming();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [streamingItems, setStreamingItems] = useState<any[]>([]);
  const [currentProperty, setCurrentProperty] = useState<TherapeuticProperty | null>(null);
  const processedCompletionRef = useRef<string | null>(null);

  // AI Streaming setup for suggested oils
  const {
    partialData,
    isStreaming: isStreamingFromHook,
    isComplete,
    finalData,
    error: oilStreamingError,
    startStream,
    resetStream
  } = useAIStreaming({
    jsonArrayPath: 'data.suggested_oils',
    timeout: 90000, // 90 seconds for oil analysis
    maxRetries: 2
  });



  // Handle streaming data updates (for partial data during streaming)
  // Note: Suggested oils uses structured-only streaming, so partialData is usually empty
  useEffect(() => {
    console.log('🔍 FRONTEND DEBUG - partialData changed:', {
      hasPartialData: !!partialData,
      isArray: Array.isArray(partialData),
      length: Array.isArray(partialData) ? partialData.length : 'N/A',
      partialDataContent: partialData
    });

    if (partialData && Array.isArray(partialData) && partialData.length > 0) {
      console.log('📥 Received streaming oils:', partialData.length, 'total');
      console.log('📥 Oil details:', partialData.map(oil => ({
        oil_id: oil.oil_id,
        name_localized: oil.name_localized,
        name_english: oil.name_english
      })));

      // Transform individual oils for modal display (partialData now contains individual oils)
      const modalItems = partialData.map((oil: any, index: number) => ({
        id: `oil-${oil.oil_id || index}`,
        title: oil.name_localized || oil.name_english,
        subtitle: oil.name_botanical,
        description: oil.match_rationale_localized,
        timestamp: new Date()
      }));
      console.log('🎭 Setting modal items from partial data:', modalItems.length, 'items');
      console.log('🎭 Modal items details:', modalItems);
      setStreamingItems(modalItems);
    } else {
      console.log('⚠️ No valid partialData for modal display');
    }
  }, [partialData]);

  // Handle streaming completion - This is where the main data processing happens for structured-only streaming
  useEffect(() => {
    console.log('🏁 Streaming completion check:', {
      isComplete,
      finalData: !!finalData,
      finalDataType: typeof finalData,
      finalDataKeys: finalData ? Object.keys(finalData) : null
    });

    if (isComplete && finalData) {
      console.log('✅ Oil streaming completed:', finalData);

      // Extract property context and all oils from the structured response
      let propertyContext: any = null;
      let allOils: any[] = [];

      if (finalData && typeof finalData === 'object') {
        const data = finalData as any;

        // Get property context from the structured response
        if (data.data?.property_oil_suggestion?.therapeutic_property_context) {
          propertyContext = data.data.property_oil_suggestion.therapeutic_property_context;
        }

        // Get all oils from the structured response
        if (data.data?.property_oil_suggestion?.suggested_oils) {
          allOils = data.data.property_oil_suggestion.suggested_oils;
        }
      }

      // Also include any oils that came through progressive streaming
      if (Array.isArray(partialData) && partialData.length > 0) {
        // Merge progressive oils with final oils (avoid duplicates)
        const existingOilIds = new Set(allOils.map(oil => oil.oil_id));
        const progressiveOils = partialData.filter(oil => !existingOilIds.has(oil.oil_id));
        allOils = [...allOils, ...progressiveOils];
      }

      console.log('📋 Extracted property context:', propertyContext);
      console.log('📋 Total oils found:', allOils.length);

      if (propertyContext && allOils.length > 0) {
        // Transform to match PropertyOilSuggestions interface
        const transformedOils = [{
          property_id: propertyContext.property_id,
          property_name: propertyContext.property_name_localized,
          property_name_in_english: propertyContext.property_name_english,
          description: propertyContext.description_localized,
          suggested_oils: allOils
        }];

        console.log('🔄 Transformed oils for store:', transformedOils);

        // Create a unique completion ID to prevent duplicate processing
        const completionId = `${currentProperty?.property_id}-${Date.now()}`;

        // Check if we've already processed this completion
        if (processedCompletionRef.current === completionId) {
          console.log('⚠️ Completion already processed, skipping');
          return;
        }

        processedCompletionRef.current = completionId;

        // Get current oils from store and merge
        const currentOils = suggestedOils || [];
        const existingOils = currentOils.filter(oil =>
          !transformedOils.some((newOil: any) => newOil.property_id === oil.property_id)
        );
        const updatedOils = [...existingOils, ...transformedOils];

        console.log('🏪 Updating store with oils:', {
          existingOilsCount: existingOils.length,
          newOilsCount: transformedOils.length,
          totalOilsCount: updatedOils.length,
          updatedOils: updatedOils.map(oil => ({
            property_id: oil.property_id,
            property_name: oil.property_name,
            oils_count: oil.suggested_oils?.length || 0
          }))
        });

        updateSuggestedOils(updatedOils);

        // Show final results in modal before closing
        const finalModalItems = transformedOils.flatMap((propertyOils: any) =>
          propertyOils.suggested_oils?.map((oil: any, index: number) => ({
            id: `final-oil-${oil.oil_id || index}`,
            title: oil.name_localized || oil.name_english,
            subtitle: oil.name_botanical,
            description: oil.match_rationale_localized,
            timestamp: new Date()
          })) || []
        );

        console.log('🎭 Final modal items:', finalModalItems);
        setStreamingItems(finalModalItems);

        // Modal will close automatically when isStreamingFromHook becomes false
        console.log('🎉 Oil analysis completed successfully');
      } else {
        console.warn('⚠️ No property context or oils found in final data');
      }
    }
  }, [isComplete, finalData]);

  // Handle streaming errors
  useEffect(() => {
    if (oilStreamingError) {
      console.error('Oil streaming error:', oilStreamingError);
      setStreamingError(oilStreamingError);
      // Modal will close automatically when isStreamingFromHook becomes false
    }
  }, [oilStreamingError, setStreamingError]);

  /**
   * Fetch therapeutic properties on component mount
   */
  const loadTherapeuticProperties = useCallback(async () => {
    // If data is missing, let navigation handle redirects
    if (!healthConcern || !demographics || selectedCauses.length === 0 || selectedSymptoms.length === 0) {
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
      updateTherapeuticProperties(properties);

      // Auto-mark step as completed when properties are loaded
      if (properties.length > 0) {
        markCurrentStepCompleted();
        // Note: Oil suggestions will be triggered manually by user button
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
    updateTherapeuticProperties,
    setError,
    clearError,
    markCurrentStepCompleted
  ]);

  /**
   * Check if we have required data and show appropriate state
   */
  const checkRequiredData = useCallback(() => {
    if (!healthConcern || !demographics || selectedCauses.length === 0 || selectedSymptoms.length === 0) {
      // Don't set errors during reset/navigation - let the navigation system handle redirects
      return;
    } else {
      clearError();
      loadTherapeuticProperties();
    }
  }, [healthConcern, demographics, selectedCauses, selectedSymptoms, loadTherapeuticProperties, clearError]);

  useEffect(() => {
    const cleanup = checkRequiredData();
    return cleanup;
  }, [checkRequiredData]);

  /**
   * Load oil suggestions for a single therapeutic property using AI streaming
   */
  const handleAnalyzeSingleProperty = useCallback(async (property: TherapeuticProperty) => {
    if (!healthConcern?.healthConcern || !demographics) {
      console.warn('Missing required data for oil suggestions');
      return;
    }

    console.log(`🔍 Starting oil analysis for property: ${property.property_name}`);

    // Reset completion tracking and set current property for modal context
    processedCompletionRef.current = null;
    setCurrentProperty(property);
    setStreamingError(null);

    // Clear modal data for fresh start
    setStreamingItems([]);
    resetStream(); // Clear any previous streaming data

    // Note: Modal will open automatically when startStream begins (isStreamingFromHook becomes true)

    try {
      const requestData = {
        feature: 'create-recipe',
        step: 'suggested-oils',
        data: {
          health_concern: healthConcern.healthConcern,
          demographics: {
            gender: demographics.gender,
            age_category: demographics.ageCategory,
            age_specific: demographics.specificAge.toString()
          },
          selected_causes: selectedCauses.map((cause, index) => ({
            cause_id: `cause-${index}-${cause.cause_name.toLowerCase().replace(/\s+/g, '-')}`,
            name_localized: cause.cause_name,
            explanation_localized: cause.explanation || ''
          })),
          selected_symptoms: selectedSymptoms.map((symptom, index) => ({
            symptom_id: `symptom-${index}-${symptom.symptom_name.toLowerCase().replace(/\s+/g, '-')}`,
            name_localized: symptom.symptom_name,
            explanation_localized: symptom.explanation || ''
          })),
          target_property: {
            property_id: property.property_id,
            property_name_localized: property.property_name,
            property_name_english: property.property_name_in_english || property.property_name,
            description_localized: property.description
          },
          user_language: 'PT_BR'
        }
      };

      console.log(`🚀 Starting AI streaming for property: ${property.property_name}`, requestData);
      await startStream('/api/ai/streaming', requestData);

    } catch (error) {
      console.error(`Oil analysis failed for ${property.property_name}:`, error);
      setStreamingError(`Failed to analyze oils for ${property.property_name}. Please try again.`);
      // Modal will close automatically when isStreamingFromHook becomes false
    }
  }, [
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    startStream,
    setStreamingError
  ]);

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

                  {/* Suggested Essential Oils */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">Recommended Essential Oils</h4>
                      {isStreamingFromHook && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                          <span>Finding oils...</span>
                        </div>
                      )}
                    </div>

                    {(() => {
                      // Find oils for this specific property
                      const propertyOils = suggestedOils.find(
                        oil => oil.property_id === property.property_id
                      );



                      if (isStreamingFromHook && currentProperty?.property_id === property.property_id && !propertyOils) {
                        return (
                          <div className="bg-muted/30 rounded-lg p-4 text-center">
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                              <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                            </div>
                          </div>
                        );
                      }

                      if (!propertyOils || !propertyOils.suggested_oils || propertyOils.suggested_oils.length === 0) {
                        if (streamingError) {
                          return (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                              <p className="text-destructive text-xs">{streamingError}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-muted/30 rounded-lg p-4 text-center space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Click the button below to find essential oils for this specific property.
                            </p>

                            <button
                              onClick={() => handleAnalyzeSingleProperty(property)}
                              disabled={!healthConcern || !demographics || isStreamingFromHook}
                              className={cn(
                                "px-3 py-2 rounded-md font-medium transition-colors text-xs",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                healthConcern && demographics && !isStreamingFromHook
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              )}
                            >
                              {isStreamingFromHook && currentProperty?.property_id === property.property_id
                                ? "🔍 Finding oils..."
                                : `🔍 Find Oils for ${property.property_name}`
                              }
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {propertyOils.suggested_oils
                            .sort((a, b) => (b.relevancy_to_property_score || 0) - (a.relevancy_to_property_score || 0))
                            .slice(0, 5) // Show top 5 oils
                            .map((oil, oilIndex) => (
                              <div
                                key={`${oil.oil_id || oil.name_english}-${oilIndex}`}
                                className="bg-muted/20 rounded-lg p-3 space-y-2"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h5 className="text-sm font-medium text-foreground">
                                      {oil.name_localized || oil.name_english}
                                    </h5>
                                    {oil.name_botanical && (
                                      <p className="text-xs text-muted-foreground italic">
                                        {oil.name_botanical}
                                      </p>
                                    )}
                                  </div>
                                  {oil.relevancy_to_property_score && (
                                    <div className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      oil.relevancy_to_property_score >= 4
                                        ? "bg-green-100 text-green-700"
                                        : oil.relevancy_to_property_score >= 3
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    )}>
                                      {oil.relevancy_to_property_score}/5
                                    </div>
                                  )}
                                </div>
                                {oil.match_rationale_localized && (
                                  <p className="text-xs text-muted-foreground">
                                    {oil.match_rationale_localized}
                                  </p>
                                )}
                              </div>
                            ))}

                          {propertyOils.suggested_oils.length > 5 && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                +{propertyOils.suggested_oils.length - 5} more oils available
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                <h4 className="text-sm font-medium text-blue-900">Essential Oil Recommendations</h4>
                <p className="text-sm text-blue-700">
                  Click the "Find Oils" button in each property card above to get personalized essential oil recommendations for that specific therapeutic property.
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
                disabled={isLoading || isStreamingFromHook}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  (isLoading || isStreamingFromHook)
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isLoading
                  ? 'Processing...'
                  : isStreamingFromHook
                  ? 'Finding oils...'
                  : 'Complete Recipe →'}
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

      {/* AI Streaming Modal for Oil Analysis */}
      <AIStreamingModal
        isOpen={isStreamingFromHook}
        title="AI Analysis in Progress"
        description={`Finding essential oils for ${currentProperty?.property_name || 'therapeutic property'}`}
        items={streamingItems}
        onClose={() => {
          // Allow users to minimize modal but keep streaming
          console.log('User requested to close oil streaming modal');
        }}
        maxVisibleItems={50}
        className="max-w-4xl"
        analysisType="oils"
        terminalTitle="Essential Oils Analysis"
        terminalSubtitle={`Analyzing oils for ${currentProperty?.property_name || 'property'}...`}
        loadingMessage="Searching oil database..."
        progressMessage="Finding more relevant oils..."
      />
    </div>
  );
}
