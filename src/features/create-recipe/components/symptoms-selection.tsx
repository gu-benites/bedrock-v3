/**
 * @fileoverview Symptoms Selection component for Essential Oil Recipe Creator.
 * Fetches and displays potential symptoms for user selection with validation.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain } from 'lucide-react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import type { PotentialSymptom, TherapeuticProperty } from '../types/recipe.types';
import { cn } from '@/lib/utils';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

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
    therapeuticProperties,
    updateTherapeuticProperties,
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    isStreamingSymptoms,
    setStreamingSymptoms,
    isStreamingProperties,
    setStreamingProperties
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamingItems, setStreamingItems] = useState<any[]>([]);

  // Therapeutic Properties streaming state
  const hasNavigatedRef = useRef(false);

  // Ref to track if we've already initiated auto-loading to prevent duplicates
  const hasAutoLoadedRef = useRef(false);

  // AI Streaming setup for symptoms
  const { startStream, partialData, isStreaming, isComplete, finalData, error: streamingError } = useAIStreaming({
    jsonArrayPath: 'data.potential_symptoms'
  });

  // AI Streaming setup for therapeutic properties
  const {
    startStream: startPropertiesStream,
    partialData: propertiesPartialData,
    isStreaming: isStreamingPropertiesData,
    isComplete: isPropertiesComplete,
    finalData: propertiesFinalData,
    error: propertiesStreamingError
  } = useAIStreaming({
    jsonArrayPath: 'data.therapeutic_properties',
    timeout: 60000, // 60 seconds timeout for therapeutic properties analysis
    maxRetries: 2
  });



  /**
   * Initialize selected symptoms from store
   */
  useEffect(() => {
    console.log('🔄 Initializing selected symptoms from store:', {
      selectedSymptomsCount: selectedSymptoms.length,
      selectedSymptoms: selectedSymptoms.map(s => ({ id: s.symptom_id, name: s.symptom_name }))
    });

    if (selectedSymptoms.length > 0) {
      // CRITICAL FIX: Use symptom_id instead of symptom_name for selection tracking
      const ids = new Set(selectedSymptoms.map(symptom => symptom.symptom_id));
      setSelectedSymptomIds(ids);
      console.log('✅ Initialized selected symptom IDs:', Array.from(ids));
    }
  }, [selectedSymptoms]);

  /**
   * Handle streaming data updates - Transform symptoms data
   */
  useEffect(() => {
    if (partialData && Array.isArray(partialData) && partialData.length > 0) {
      console.log('📥 Received streaming symptoms:', partialData.length, 'total');

      // Only process items that have all required fields (complete items only)
      const completeItems = partialData.filter((symptom: any) =>
        symptom.name_localized &&
        symptom.suggestion_localized &&
        symptom.explanation_localized &&
        symptom.name_localized.length > 5 &&
        symptom.suggestion_localized.length > 10 &&
        symptom.explanation_localized.length > 15
      );

      console.log('✅ Complete symptoms found:', completeItems.length, 'of', partialData.length);

      // Transform to match PotentialSymptom interface
      // CRITICAL: Preserve AI-generated symptom_id from the response
      const transformedSymptoms: PotentialSymptom[] = completeItems.map((symptom: any, index: number) => {
        const symptomId = symptom.symptom_id || `symptom_streaming_fallback_${Date.now()}_${index}`;

        // Debug logging for data transformation
        console.log(`🔄 Transforming streaming symptom ${index}:`, {
          original: symptom,
          symptomId: symptomId,
          hasOriginalId: !!symptom.symptom_id
        });

        return {
          symptom_id: symptomId, // Preserve AI-generated ID
          symptom_name: symptom.name_localized,
          symptom_suggestion: symptom.suggestion_localized,
          explanation: symptom.explanation_localized
        };
      });

      setPotentialSymptoms(transformedSymptoms);

      // Transform for modal display
      const modalItems = completeItems.map((symptom: any) => ({
        title: symptom.name_localized,
        subtitle: symptom.suggestion_localized,
        description: symptom.explanation_localized,
        timestamp: new Date()
      }));
      setStreamingItems(modalItems);
    }
  }, [partialData, setPotentialSymptoms]);

  /**
   * Handle streaming completion - Close modal automatically
   */
  useEffect(() => {
    if (isComplete && finalData) {
      console.log('✅ Symptoms streaming completed with final data:', finalData);

      // Close modal automatically when streaming is complete
      setIsModalOpen(false);

      // Reset auto-load flag so it can be triggered again if needed
      hasAutoLoadedRef.current = false;

      // Process final data if needed (fallback)
      if (Array.isArray(finalData)) {
        const transformedSymptoms: PotentialSymptom[] = finalData.map((symptom: any, index: number) => {
          const symptomId = symptom.symptom_id || `symptom_final_fallback_${Date.now()}_${index}`;

          // Debug logging for final data transformation
          console.log(`🔄 Final transform symptom ${index}:`, {
            original: symptom,
            symptomId: symptomId,
            hasOriginalId: !!symptom.symptom_id
          });

          return {
            symptom_id: symptomId, // Preserve AI-generated ID
            symptom_name: symptom.name_localized || symptom.symptom_name || 'Unknown symptom',
            symptom_suggestion: symptom.suggestion_localized || symptom.symptom_suggestion || '',
            explanation: symptom.explanation_localized || symptom.explanation || ''
          };
        });

        if (transformedSymptoms.length > 0) {
          setPotentialSymptoms(transformedSymptoms);
        }
      } else if (finalData && typeof finalData === 'object' && 'data' in finalData) {
        const data = finalData as any;
        if (data.data?.potential_symptoms && Array.isArray(data.data.potential_symptoms)) {
          const symptoms = data.data.potential_symptoms;
          const transformedSymptoms: PotentialSymptom[] = symptoms.map((symptom: any, index: number) => {
            const symptomId = symptom.symptom_id || `symptom_nested_fallback_${Date.now()}_${index}`;

            // Debug logging for nested data transformation
            console.log(`🔄 Nested transform symptom ${index}:`, {
              original: symptom,
              symptomId: symptomId,
              hasOriginalId: !!symptom.symptom_id
            });

            return {
              symptom_id: symptomId, // Preserve AI-generated ID
              symptom_name: symptom.name_localized || symptom.symptom_name || 'Unknown symptom',
              symptom_suggestion: symptom.suggestion_localized || symptom.symptom_suggestion || '',
              explanation: symptom.explanation_localized || symptom.explanation || ''
            };
          });

          if (transformedSymptoms.length > 0) {
            setPotentialSymptoms(transformedSymptoms);
          }
        }
      }
    }
  }, [isComplete, finalData, setPotentialSymptoms]);

  /**
   * Handle therapeutic properties streaming data updates
   */
  useEffect(() => {
    if (propertiesPartialData && Array.isArray(propertiesPartialData) && propertiesPartialData.length > 0) {
      console.log('📥 Received streaming properties:', propertiesPartialData.length, 'total');
      console.log('📥 RAW PROPERTIES PARTIAL DATA:', propertiesPartialData);

      // Transform to match TherapeuticProperty interface
      // CRITICAL: Use correct field names from AI response
      const transformedProperties: TherapeuticProperty[] = propertiesPartialData.map((property: any, index: number) => {
        // Debug logging for properties transformation
        console.log(`🔄 Transforming property ${index}:`, {
          original: property,
          property_id: property.property_id,
          property_name_localized: property.property_name_localized,
          relevancy_score: property.relevancy_score,
          addresses_cause_ids: property.addresses_cause_ids,
          addresses_symptom_ids: property.addresses_symptom_ids,
          // CRITICAL: Show ALL fields in the original property to see what's actually there
          allOriginalFields: Object.keys(property),
          fullOriginalProperty: property
        });

        return {
          property_id: property.property_id,
          property_name: property.property_name_localized, // Map to property_name for compatibility
          property_name_localized: property.property_name_localized,
          property_name_english: property.property_name_english,
          description: property.description_contextual_localized, // Map to description for compatibility
          description_localized: property.description_contextual_localized,
          description_contextual_localized: property.description_contextual_localized, // Keep original field
          relevancy: property.relevancy_score, // Map to relevancy for compatibility
          relevancy_score: property.relevancy_score, // Keep original field
          addresses_cause_ids: property.addresses_cause_ids || [],
          addresses_symptom_ids: property.addresses_symptom_ids || []
        };
      });

      updateTherapeuticProperties(transformedProperties);
    }
  }, [propertiesPartialData, updateTherapeuticProperties]);

  /**
   * Handle therapeutic properties streaming completion - Process final data and navigate
   */
  useEffect(() => {
    if (isPropertiesComplete && propertiesFinalData && !hasNavigatedRef.current) {
      console.log('✅ Properties streaming completed with final data:', propertiesFinalData);
      console.log('✅ RAW PROPERTIES FINAL DATA:', propertiesFinalData);
      hasNavigatedRef.current = true;

      // CRITICAL: Process final data to ensure we have complete properties with all fields
      let finalProperties: TherapeuticProperty[] = [];

      if (Array.isArray(propertiesFinalData)) {
        // Direct array of properties
        finalProperties = propertiesFinalData.map((property: any, index: number) => {
          console.log(`🔄 Final transform property ${index}:`, {
            original: property,
            property_id: property.property_id,
            property_name_localized: property.property_name_localized,
            relevancy_score: property.relevancy_score,
            addresses_cause_ids: property.addresses_cause_ids,
            addresses_symptom_ids: property.addresses_symptom_ids,
            // CRITICAL: Show ALL fields in the final property to see what's actually there
            allFinalFields: Object.keys(property),
            fullFinalProperty: property
          });

          return {
            property_id: property.property_id,
            property_name: property.property_name_localized,
            property_name_localized: property.property_name_localized,
            property_name_english: property.property_name_english,
            description: property.description_contextual_localized,
            description_localized: property.description_contextual_localized,
            description_contextual_localized: property.description_contextual_localized,
            relevancy: property.relevancy_score,
            relevancy_score: property.relevancy_score,
            addresses_cause_ids: property.addresses_cause_ids || [],
            addresses_symptom_ids: property.addresses_symptom_ids || []
          };
        });
      } else if (propertiesFinalData && typeof propertiesFinalData === 'object' && 'data' in propertiesFinalData) {
        // Nested structure
        const data = propertiesFinalData as any;
        if (data.data?.therapeutic_properties && Array.isArray(data.data.therapeutic_properties)) {
          const properties = data.data.therapeutic_properties;
          finalProperties = properties.map((property: any, index: number) => {
            console.log(`🔄 Nested final transform property ${index}:`, {
              original: property,
              property_id: property.property_id,
              property_name_localized: property.property_name_localized,
              relevancy_score: property.relevancy_score,
              addresses_cause_ids: property.addresses_cause_ids,
              addresses_symptom_ids: property.addresses_symptom_ids,
              // CRITICAL: Show ALL fields in the nested property to see what's actually there
              allNestedFields: Object.keys(property),
              fullNestedProperty: property
            });

            return {
              property_id: property.property_id,
              property_name: property.property_name_localized,
              property_name_localized: property.property_name_localized,
              property_name_english: property.property_name_english,
              description: property.description_contextual_localized,
              description_localized: property.description_contextual_localized,
              description_contextual_localized: property.description_contextual_localized,
              relevancy: property.relevancy_score,
              relevancy_score: property.relevancy_score,
              addresses_cause_ids: property.addresses_cause_ids || [],
              addresses_symptom_ids: property.addresses_symptom_ids || []
            };
          });
        }
      }

      // Update with final complete data if we have it
      if (finalProperties.length > 0) {
        console.log('🔄 Updating properties with final complete data:', finalProperties.length, 'properties');
        updateTherapeuticProperties(finalProperties);
      }

      // Stop streaming state
      setStreamingProperties(false);

      // Navigate immediately after state updates
      if (canGoNext()) {
        goToNext();
      }
    }
  }, [isPropertiesComplete, propertiesFinalData, canGoNext, goToNext, setStreamingProperties, updateTherapeuticProperties]);

  /**
   * Handle therapeutic properties streaming errors
   */
  useEffect(() => {
    if (propertiesStreamingError) {
      console.error('🔥 Properties streaming error:', propertiesStreamingError);
      setError(`Failed to analyze therapeutic properties: ${propertiesStreamingError}`);
      setStreamingProperties(false);
      hasNavigatedRef.current = false;
    }
  }, [propertiesStreamingError, setError, setStreamingProperties]);

  /**
   * Sync streaming state with store
   */
  useEffect(() => {
    setStreamingSymptoms(isStreaming);
    setStreamingProperties(isStreamingPropertiesData);
  }, [isStreaming, setStreamingSymptoms, isStreamingPropertiesData, setStreamingProperties]);

  /**
   * Load potential symptoms using AI streaming (auto-triggered on mount)
   */
  const loadPotentialSymptoms = useCallback(async () => {
    // If data is missing, let navigation handle redirects
    if (!healthConcern || !demographics || selectedCauses.length === 0) {
      console.log('⚠️ Missing required data for symptoms analysis:', {
        hasHealthConcern: !!healthConcern,
        hasDemographics: !!demographics,
        causesCount: selectedCauses.length
      });
      return;
    }

    if (potentialSymptoms.length > 0) {
      console.log('✅ Symptoms already loaded, skipping analysis');
      return; // Already loaded
    }

    if (isStreaming) {
      console.log('⏳ Streaming already in progress, skipping duplicate request');
      return; // Already streaming
    }

    console.log('🚀 Starting symptoms analysis...', {
      healthConcern: healthConcern?.healthConcern,
      causesCount: selectedCauses.length,
      timestamp: new Date().toISOString()
    });

    clearError();
    setIsModalOpen(true);

    try {
      // Prepare data for symptoms analysis
      const requestData = {
        feature: 'create-recipe',
        step: 'potential-symptoms',
        data: {
          health_concern: healthConcern?.healthConcern || '',
          demographics: {
            gender: demographics.gender,
            age_category: demographics.ageCategory,  // ✅ Map ageCategory → age_category for template variables
            age_specific: demographics.specificAge?.toString() || demographics.ageCategory  // ✅ Map specificAge → age_specific for template variables
          },
          selected_causes: selectedCauses.map(cause => ({
            cause_id: cause.cause_id, // Use the AI-generated ID from the stored cause
            name_localized: cause.cause_name,
            suggestion_localized: cause.cause_suggestion,
            explanation_localized: cause.explanation
          })),
          user_language: 'PT_BR'
        }
      };

      console.log('🚀 Starting symptoms analysis with data:', requestData);
      await startStream('/api/ai/streaming', requestData);
    } catch (error) {
      console.error('Failed to start symptoms streaming:', error);
      setError('Failed to load potential symptoms. Please try again.');
      setIsModalOpen(false);

      // Reset auto-load flag on error so user can retry
      hasAutoLoadedRef.current = false;
    }
  }, [healthConcern, demographics, selectedCauses, potentialSymptoms.length, startStream, setError, clearError]);

  /**
   * Check if we have required data and symptoms (now loaded from causes page)
   */
  useEffect(() => {
    // Check if we have required data
    if (!healthConcern || !demographics || selectedCauses.length === 0) {
      return;
    }

    // Symptoms should already be loaded from causes page
    // If not available, show message to go back
    if (potentialSymptoms.length === 0 && !isStreaming) {
      setError('Potential symptoms not found. Please go back to the causes step to generate them.');
      return;
    }

    clearError();
  }, [healthConcern, demographics, selectedCauses.length, potentialSymptoms.length, isStreaming, setError, clearError]);

  /**
   * Handle symptom selection toggle
   */
  const handleSymptomToggle = (symptom: PotentialSymptom) => {
    const symptomId = symptom.symptom_id;

    // Debug logging and safety checks
    console.log('🔄 Symptom toggle clicked:', {
      symptomName: symptom.symptom_name,
      symptomId: symptomId,
      isIdValid: !!symptomId,
      currentSelectedIds: Array.from(selectedSymptomIds),
      totalSymptoms: potentialSymptoms.length
    });

    // Safety check: ensure symptom has a valid ID
    if (!symptomId) {
      console.error('❌ Symptom missing ID:', symptom);
      setError('Invalid symptom data. Please refresh and try again.');
      return;
    }

    const newSelectedIds = new Set(selectedSymptomIds);
    const isCurrentlySelected = newSelectedIds.has(symptomId);

    if (isCurrentlySelected) {
      // Remove from selection
      newSelectedIds.delete(symptomId);
      console.log('➖ Removing symptom from selection:', symptomId);
    } else {
      // Add to selection - allow selecting all available symptoms
      newSelectedIds.add(symptomId);
      console.log('➕ Adding symptom to selection:', symptomId);
      clearError();
    }

    console.log('📊 Selection state after toggle:', {
      newSelectedCount: newSelectedIds.size,
      newSelectedIds: Array.from(newSelectedIds)
    });

    setSelectedSymptomIds(newSelectedIds);

    // Update store with selected symptoms
    const newSelectedSymptoms = potentialSymptoms.filter(s =>
      newSelectedIds.has(s.symptom_id) // Use symptom_id for filtering
    );
    updateSelectedSymptoms(newSelectedSymptoms);

    console.log('✅ Updated selected symptoms in store:', newSelectedSymptoms.length);

    // Mark step as completed if at least one symptom is selected
    if (newSelectedSymptoms.length > 0) {
      markCurrentStepCompleted();
    }
  };

  /**
   * Handle form submission - Start therapeutic properties streaming
   */
  const onSubmit = async () => {
    if (selectedSymptomIds.size === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    try {
      markCurrentStepCompleted();
      clearError();
      hasNavigatedRef.current = false;

      // Start therapeutic properties streaming (stay on current page)
      setStreamingProperties(true);

      const requestData = {
        feature: 'create-recipe',
        step: 'therapeutic-properties',
        data: {
          health_concern: healthConcern?.healthConcern || '',
          demographics: {
            gender: demographics?.gender,
            age_category: demographics?.ageCategory,  // ✅ Map ageCategory → age_category for template variables
            age_specific: demographics?.specificAge?.toString()  // ✅ Map specificAge → age_specific for template variables
          },
          selected_causes: selectedCauses.map(cause => ({
            cause_id: cause.cause_id || `cause_${Date.now()}_${Math.random()}`,
            name_localized: cause.cause_name,
            suggestion_localized: cause.cause_suggestion,
            explanation_localized: cause.explanation
          })),
          selected_symptoms: selectedSymptoms.map(symptom => ({
            symptom_id: symptom.symptom_id, // Use the AI-generated ID from the stored symptom
            name_localized: symptom.symptom_name,
            suggestion_localized: symptom.symptom_suggestion,
            explanation_localized: symptom.explanation
          })),
          user_language: 'PT_BR'
        }
      };

      // CRITICAL DEBUG: Log the exact IDs being sent to AI vs. what's stored
      console.log('🚀 CRITICAL DEBUG - IDs being sent to AI:', {
        selectedCausesStored: selectedCauses.map(c => ({ cause_id: c.cause_id, cause_name: c.cause_name })),
        selectedSymptomsStored: selectedSymptoms.map(s => ({ symptom_id: s.symptom_id, symptom_name: s.symptom_name })),
        causesBeingSent: requestData.data.selected_causes.map(c => ({ cause_id: c.cause_id, name_localized: c.name_localized })),
        symptomsBeingSent: requestData.data.selected_symptoms.map(s => ({ symptom_id: s.symptom_id, name_localized: s.name_localized })),
        fullRequestData: requestData
      });

      await startPropertiesStream('/api/ai/streaming', requestData);

    } catch (error) {
      console.error('Failed to start properties streaming:', error);
      setError('Failed to analyze therapeutic properties. Please try again.');
      setStreamingProperties(false);
      hasNavigatedRef.current = false;
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
    hasAutoLoadedRef.current = false; // Reset flag to allow retry
    loadPotentialSymptoms();
  };

  const isFormValid = selectedSymptomIds.size > 0 && selectedSymptomIds.size <= potentialSymptoms.length;

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

      {/* Missing Data State */}
      {potentialSymptoms.length === 0 && !isStreaming && !error && (
        <div className="text-center py-12 space-y-6">
          <div className="space-y-2">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold text-muted-foreground">Missing Required Data</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Potential symptoms not found. Please go back to the causes step to generate them.
            </p>
          </div>

          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            ← Go Back to Causes
          </button>
        </div>
      )}

      {/* Symptoms Selection */}
      {potentialSymptoms.length > 0 && !isStreaming && (
        <div className="space-y-6">
          {/* Selection Counter */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Select 1-{potentialSymptoms.length} symptoms that you're experiencing
            </p>
            <span className={cn(
              "text-sm font-medium",
              selectedSymptomIds.size > potentialSymptoms.length ? "text-destructive" : "text-foreground"
            )}>
              {selectedSymptomIds.size}/{potentialSymptoms.length} selected
            </span>
          </div>

          {/* Symptoms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {potentialSymptoms.map((symptom, index) => {
              const isSelected = selectedSymptomIds.has(symptom.symptom_id); // Use symptom_id for selection check

              // Debug logging for visual state
              if (index === 0) { // Only log for first item to avoid spam
                console.log(`🎨 Rendering symptoms - Selected IDs:`, Array.from(selectedSymptomIds));
                console.log(`🎨 First symptom ID: ${symptom.symptom_id}, isSelected: ${isSelected}`);
              }

              return (
                <div
                  key={`${symptom.symptom_id}-${index}`} // Use symptom_id for unique keys
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
                type="button"
                onClick={onSubmit}
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
        </div>
      )}

      {/* AI Streaming Modal for Symptoms */}
      <AIStreamingModal
        isOpen={isModalOpen}
        title="AI Analysis in Progress"
        description="Identifying potential symptoms based on your selected causes"
        items={streamingItems}
        onClose={() => setIsModalOpen(false)}
        maxVisibleItems={100}
        analysisType="symptoms"
      />

      {/* AI Streaming Modal for Therapeutic Properties */}
      <AIStreamingModal
        isOpen={isStreamingProperties}
        title="AI Analysis in Progress"
        description="Identifying therapeutic properties to address your symptoms"
        items={therapeuticProperties.map((property, index) => ({
          id: `property-${index}-${property.property_name?.slice(0, 10) || 'unknown'}`,
          title: property.property_name || property.property_name_localized || `Therapeutic Property ${index + 1}`,
          subtitle: property.property_name_english || 'Therapeutic property',
          description: property.description || property.description_localized || '',
          timestamp: new Date()
        }))}
        onClose={() => console.log('User requested to close properties modal')}
        maxVisibleItems={100}
        analysisType="properties"
      />
    </div>
  );
}
