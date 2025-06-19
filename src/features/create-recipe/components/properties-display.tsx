/**
 * @fileoverview Properties Display component for Essential Oil Recipe Creator.
 * Fetches and displays therapeutic properties based on selected causes and symptoms.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRecipeStore, useRecipeStreaming } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import { AIStreamingModal } from '@/components/ui/ai-streaming-modal';

import { fetchTherapeuticProperties } from '../services/recipe-api.service';

import type { TherapeuticProperty } from '../types/recipe.types';
import { cn } from '@/lib/utils';
import { MemoComparisons, withMemoMonitoring } from '@/lib/utils/memo-comparison-functions';
import { usePropertiesWithAddressedItems, useOilRecommendationsSummary } from '@/lib/utils/memo-calculation-hooks';

/**
 * Memoized property card component for better performance
 */
const PropertyCard = React.memo(({
  property,
  index,
  addressedCauses,
  addressedSymptoms,
  relevancyScore,
  onAnalyzeProperty
}: {
  property: TherapeuticProperty;
  index: number;
  addressedCauses: any[];
  addressedSymptoms: any[];
  relevancyScore: number;
  onAnalyzeProperty: (property: TherapeuticProperty) => void;
}) => {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
    >
      {/* Relevancy Score Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
          relevancyScore >= 5
            ? "bg-green-50 text-green-700 ring-green-600/20"
            : relevancyScore >= 4
            ? "bg-blue-50 text-blue-700 ring-blue-600/20"
            : relevancyScore >= 3
            ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
            : "bg-gray-50 text-gray-700 ring-gray-600/20"
        )}>
          <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.107 10.5a.75.75 0 00-1.214 1.029l1.5 2.25a.75.75 0 001.214-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
          {relevancyScore}/5
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight">
            {property.property_name_localized || property.property_name || 'Unknown Property'}
          </h3>
          {property.property_name_english && property.property_name_english !== property.property_name_localized && (
            <p className="text-sm text-muted-foreground">
              {property.property_name_english}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {property.description_contextual_localized || property.description || 'No description available'}
        </p>

        {/* Addressed Causes and Symptoms */}
        {(addressedCauses.length > 0 || addressedSymptoms.length > 0) && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {addressedCauses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground flex items-center">
                  <svg className="mr-2 h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Addresses Causes ({addressedCauses.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {addressedCauses.map((cause, causeIndex) => (
                    <span
                      key={`${cause.cause_id}-${causeIndex}`}
                      className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10"
                      title={cause.explanation}
                    >
                      {cause.cause_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {addressedSymptoms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground flex items-center">
                  <svg className="mr-2 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Addresses Symptoms ({addressedSymptoms.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {addressedSymptoms.map((symptom, symptomIndex) => (
                    <span
                      key={`${symptom.symptom_id}-${symptomIndex}`}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                      title={symptom.explanation}
                    >
                      {symptom.symptom_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Essential Oils Button */}
        <div className="border-t pt-4 mt-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center space-y-3 border border-green-200/50">
            <div className="space-y-2">
              <svg className="mx-auto h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-sm font-medium text-green-800">
                Discover Essential Oils
              </p>
              <p className="text-xs text-green-700">
                Get personalized oil recommendations for this therapeutic property
              </p>
            </div>
            <button
              onClick={() => onAnalyzeProperty(property)}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              🌿 Analyze Essential Oils
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Properties Display component
 * Optimized with React.memo for performance
 */
const PropertiesDisplayComponent = () => {
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
    setStreamingError
  } = useRecipeStreaming();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [streamingItems, setStreamingItems] = useState<any[]>([]);
  const [currentProperty, setCurrentProperty] = useState<TherapeuticProperty | null>(null);
  const processedCompletionRef = useRef<string | null>(null);

  // Optimized calculations with useMemo
  const propertiesWithAddressed = usePropertiesWithAddressedItems(
    therapeuticProperties,
    selectedCauses,
    selectedSymptoms
  );

  const oilsSummary = useOilRecommendationsSummary(suggestedOils);

  // Debug logging for properties data
  useEffect(() => {
    console.log('🔍 Properties Display Debug:', {
      therapeuticPropertiesCount: therapeuticProperties.length,
      therapeuticProperties: therapeuticProperties.map(p => ({
        property_id: p.property_id,
        property_name: p.property_name,
        property_name_localized: p.property_name_localized,
        description: p.description,
        description_contextual_localized: p.description_contextual_localized,
        relevancy: p.relevancy,
        relevancy_score: p.relevancy_score,
        addresses_cause_ids: p.addresses_cause_ids,
        addresses_symptom_ids: p.addresses_symptom_ids,
        // Show ALL fields to debug what's actually stored
        allFields: Object.keys(p),
        // Show the COMPLETE property object
        fullProperty: p
      })),
      selectedCausesCount: selectedCauses.length,
      selectedCausesData: selectedCauses.map(c => ({ cause_id: c.cause_id, cause_name: c.cause_name })),
      selectedSymptomsCount: selectedSymptoms.length,
      selectedSymptomsData: selectedSymptoms.map(s => ({ symptom_id: s.symptom_id, symptom_name: s.symptom_name }))
    });

    // CRITICAL DEBUG: Check each property's relevancy score individually
    therapeuticProperties.forEach((property, index) => {
      console.log(`🔍 Property ${index} relevancy debug:`, {
        property_id: property.property_id,
        property_name: property.property_name_localized || property.property_name,
        relevancy_score: property.relevancy_score,
        relevancy: property.relevancy,
        typeof_relevancy_score: typeof property.relevancy_score,
        typeof_relevancy: typeof property.relevancy,
        calculated_score: property.relevancy_score || property.relevancy || 0,
        // Show the COMPLETE property object for this specific property
        fullPropertyObject: property
      });
    });
  }, [therapeuticProperties, selectedCauses, selectedSymptoms]);

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
            age_category: demographics.ageCategory,  // ✅ Map ageCategory → age_category for template variables
            age_specific: demographics.specificAge.toString()  // ✅ Map specificAge → age_specific for template variables
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
   * Get addressed causes for a property
   */
  const getAddressedCauses = (property: TherapeuticProperty) => {
    console.log('🔍 getAddressedCauses debug:', {
      property_id: property.property_id,
      property_name: property.property_name_localized || property.property_name,
      addresses_cause_ids: property.addresses_cause_ids,
      addresses_cause_ids_length: property.addresses_cause_ids?.length || 0,
      selectedCausesCount: selectedCauses.length,
      selectedCauseIds: selectedCauses.map(c => c.cause_id),
      selectedCauseNames: selectedCauses.map(c => c.cause_name)
    });

    if (!property.addresses_cause_ids || property.addresses_cause_ids.length === 0) {
      console.log('❌ No addresses_cause_ids found for property');
      return [];
    }

    // Match by the actual AI-generated cause IDs
    const matchedCauses = selectedCauses.filter(cause => {
      const isMatch = property.addresses_cause_ids?.includes(cause.cause_id);
      console.log(`🔍 Checking cause match: ${cause.cause_name} (${cause.cause_id}) -> ${isMatch}`);
      return isMatch;
    });

    console.log(`✅ Found ${matchedCauses.length} matching causes for property ${property.property_name_localized}`);
    return matchedCauses;
  };

  /**
   * Get addressed symptoms for a property
   */
  const getAddressedSymptoms = (property: TherapeuticProperty) => {
    console.log('🔍 getAddressedSymptoms debug:', {
      property_id: property.property_id,
      property_name: property.property_name_localized || property.property_name,
      addresses_symptom_ids: property.addresses_symptom_ids,
      addresses_symptom_ids_length: property.addresses_symptom_ids?.length || 0,
      selectedSymptomsCount: selectedSymptoms.length,
      selectedSymptomIds: selectedSymptoms.map(s => s.symptom_id),
      selectedSymptomNames: selectedSymptoms.map(s => s.symptom_name)
    });

    if (!property.addresses_symptom_ids || property.addresses_symptom_ids.length === 0) {
      console.log('❌ No addresses_symptom_ids found for property');
      return [];
    }

    // Match by the actual AI-generated symptom IDs
    const matchedSymptoms = selectedSymptoms.filter(symptom => {
      const isMatch = property.addresses_symptom_ids?.includes(symptom.symptom_id);
      console.log(`🔍 Checking symptom match: ${symptom.symptom_name} (${symptom.symptom_id}) -> ${isMatch}`);
      return isMatch;
    });

    console.log(`✅ Found ${matchedSymptoms.length} matching symptoms for property ${property.property_name_localized}`);
    return matchedSymptoms;
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
          <div className="space-y-6">
            {propertiesWithAddressed
              .sort((a, b) => b.relevancyScore - a.relevancyScore)
              .map((property, index) => {
                const { addressedCauses, addressedSymptoms, relevancyScore } = property;

                // Debug logging for property data
                console.log(`🎨 Rendering property ${index}:`, {
                  property_id: property.property_id,
                  property_name_localized: property.property_name_localized,
                  property_name: property.property_name,
                  relevancy_score: property.relevancy_score,
                  relevancy: property.relevancy,
                  calculated_relevancy_score: relevancyScore,
                  typeof_relevancy_score: typeof property.relevancy_score,
                  typeof_relevancy: typeof property.relevancy,
                  addresses_cause_ids: property.addresses_cause_ids,
                  addresses_symptom_ids: property.addresses_symptom_ids,
                  addressedCausesFound: addressedCauses.length,
                  addressedSymptomsFound: addressedSymptoms.length,
                  // Show the ENTIRE property object to see what fields exist
                  fullPropertyObject: property
                });

                return (
                  <PropertyCard
                    key={`${property.property_id}-${index}`}
                    property={property}
                    index={index}
                    addressedCauses={addressedCauses}
                    addressedSymptoms={addressedSymptoms}
                    relevancyScore={relevancyScore}
                    onAnalyzeProperty={handleAnalyzeSingleProperty}
                  />
                );
              })}
          </div>

          {/* Oil Recommendations Summary */}
          {oilsSummary.hasRecommendations && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-900">Oil Recommendations Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">{oilsSummary.totalProperties}</span>
                    <span className="text-green-600 ml-1">Properties analyzed</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">{oilsSummary.uniqueOils}</span>
                    <span className="text-green-600 ml-1">Unique oils found</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">{oilsSummary.totalOils}</span>
                    <span className="text-green-600 ml-1">Total recommendations</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">{oilsSummary.averageOilsPerProperty.toFixed(1)}</span>
                    <span className="text-green-600 ml-1">Avg per property</span>
                  </div>
                </div>
                {oilsSummary.mostRecommended.length > 0 && (
                  <div>
                    <p className="text-xs text-green-700 mb-2">Most recommended oils:</p>
                    <div className="flex flex-wrap gap-1">
                      {oilsSummary.mostRecommended.slice(0, 3).map((rec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                        >
                          {rec.oil.name_localized || rec.oil.name_english} ({rec.recommendationCount}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
};

// Memoized version with custom comparison for optimal performance
export const PropertiesDisplay = memo(
  PropertiesDisplayComponent,
  withMemoMonitoring('PropertiesDisplay', MemoComparisons.propertiesDisplay)
);
