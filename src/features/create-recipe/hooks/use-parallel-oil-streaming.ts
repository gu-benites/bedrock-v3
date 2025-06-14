import { useState, useCallback } from 'react';
import { TherapeuticProperty } from '@/features/create-recipe/types/recipe.types';
import { HealthConcernData, DemographicsData } from '@/features/create-recipe/types/recipe.types';
import { PotentialCause, PotentialSymptom } from '@/features/create-recipe/types/recipe.types';

interface ParallelStreamingState {
  isStreaming: boolean;
  completedCount: number;
  totalCount: number;
  results: Map<string, any>;
  errors: string[];
}

interface UseParallelOilStreamingReturn {
  streamingState: ParallelStreamingState;
  startParallelStreaming: (
    properties: TherapeuticProperty[],
    healthConcern: HealthConcernData,
    demographics: DemographicsData,
    selectedCauses: PotentialCause[],
    selectedSymptoms: PotentialSymptom[]
  ) => Promise<any[]>;
  resetState: () => void;
}

/**
 * Custom hook for managing multiple parallel oil streaming calls
 * Each therapeutic property gets its own API call for better reliability
 */
export function useParallelOilStreaming(): UseParallelOilStreamingReturn {
  const [streamingState, setStreamingState] = useState<ParallelStreamingState>({
    isStreaming: false,
    completedCount: 0,
    totalCount: 0,
    results: new Map(),
    errors: []
  });

  const resetState = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      completedCount: 0,
      totalCount: 0,
      results: new Map(),
      errors: []
    });
  }, []);

  const startParallelStreaming = useCallback(async (
    properties: TherapeuticProperty[],
    healthConcern: HealthConcernData,
    demographics: DemographicsData,
    selectedCauses: PotentialCause[],
    selectedSymptoms: PotentialSymptom[]
  ): Promise<any[]> => {
    console.log('🚀 Starting parallel oil streaming for', properties.length, 'properties');

    // Initialize state
    setStreamingState({
      isStreaming: true,
      completedCount: 0,
      totalCount: properties.length,
      results: new Map(),
      errors: []
    });

    try {
      // Create parallel streaming promises
      const streamingPromises = properties.map(async (property, index) => {
        const propertyId = property.property_id || `prop-${index}-${property.property_name.toLowerCase().replace(/\s+/g, '-')}`;
        
        console.log(`📡 Starting stream for property: ${property.property_name}`);

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
            selected_causes: selectedCauses.map((cause, causeIndex) => ({
              cause_id: `cause-${causeIndex}-${cause.cause_name.toLowerCase().replace(/\s+/g, '-')}`,
              name_localized: cause.cause_name,
              explanation_localized: cause.explanation || ''
            })),
            selected_symptoms: selectedSymptoms.map((symptom, symptomIndex) => ({
              symptom_id: `symptom-${symptomIndex}-${symptom.symptom_name.toLowerCase().replace(/\s+/g, '-')}`,
              name_localized: symptom.symptom_name,
              explanation_localized: symptom.explanation || ''
            })),
            target_property: {
              property_id: propertyId,
              property_name_localized: property.property_name,
              property_name_english: property.property_name_in_english || property.property_name,
              description_localized: property.description
            },
            user_language: 'PT_BR'
          }
        };

        try {
          // Make API call
          const response = await fetch('/api/ai/streaming', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          let propertyResult: any = null;

          // Process streaming response
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'structured_complete' && data.data?.data?.property_oil_suggestions) {
                    propertyResult = data.data.data.property_oil_suggestions[0];
                    console.log(`✅ Completed streaming for: ${property.property_name}`);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }

          // Update state with result
          setStreamingState(prev => ({
            ...prev,
            completedCount: prev.completedCount + 1,
            results: new Map([...prev.results, [propertyId, propertyResult]])
          }));

          return propertyResult;

        } catch (error) {
          console.error(`Failed to stream property ${property.property_name}:`, error);
          
          // Update state with error
          setStreamingState(prev => ({
            ...prev,
            completedCount: prev.completedCount + 1,
            errors: [...prev.errors, `${property.property_name}: ${error}`]
          }));
          
          return null;
        }
      });

      // Wait for all parallel calls to complete
      const results = await Promise.allSettled(streamingPromises);
      
      // Process results
      const successfulResults: any[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulResults.push(result.value);
        } else {
          console.error(`Property ${properties[index].property_name} failed:`, result.reason);
        }
      });

      // Update final state
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false
      }));

      console.log(`✅ Parallel streaming completed: ${successfulResults.length}/${properties.length} successful`);
      return successfulResults;

    } catch (error) {
      console.error('Parallel streaming failed:', error);
      
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        errors: [...prev.errors, `Global error: ${error}`]
      }));
      
      throw error;
    }
  }, []);

  return {
    streamingState,
    startParallelStreaming,
    resetState
  };
}
