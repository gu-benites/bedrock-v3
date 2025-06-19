/**
 * Memo Calculation Hooks
 * Custom hooks with useMemo for expensive calculations and derived state
 */

import { useMemo, useCallback } from 'react';
import type { 
  PotentialCause, 
  PotentialSymptom, 
  TherapeuticProperty, 
  PropertyOilSuggestions,
  DemographicsData 
} from '@/features/create-recipe/types/recipe.types';

/**
 * Performance monitoring for memo calculations
 */
class MemoCalculationMonitor {
  private calculationTimes = new Map<string, number[]>();
  private calculationCounts = new Map<string, number>();

  recordCalculation(calculationName: string, duration: number): void {
    // Update counts
    const currentCount = this.calculationCounts.get(calculationName) || 0;
    this.calculationCounts.set(calculationName, currentCount + 1);

    // Track timing
    const times = this.calculationTimes.get(calculationName) || [];
    times.push(duration);
    if (times.length > 100) times.shift(); // Keep last 100 measurements
    this.calculationTimes.set(calculationName, times);

    // Log slow calculations
    if (duration > 10 && process.env.NODE_ENV === 'development') {
      console.warn(`🐌 Slow calculation: ${calculationName} took ${duration.toFixed(2)}ms`);
    }
  }

  getReport(): {
    calculationName: string;
    totalCalculations: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  }[] {
    const report: any[] = [];

    for (const [calculationName, count] of this.calculationCounts) {
      const times = this.calculationTimes.get(calculationName) || [];
      const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;
      const minTime = times.length > 0 ? Math.min(...times) : 0;

      report.push({
        calculationName,
        totalCalculations: count,
        averageTime,
        maxTime,
        minTime
      });
    }

    return report.sort((a, b) => b.averageTime - a.averageTime);
  }

  clearMetrics(): void {
    this.calculationTimes.clear();
    this.calculationCounts.clear();
  }
}

// Global calculation monitor
export const memoCalculationMonitor = new MemoCalculationMonitor();

/**
 * Higher-order function to add monitoring to calculations
 */
export const withCalculationMonitoring = <T>(
  calculationName: string,
  calculationFn: () => T
): T => {
  const startTime = performance.now();
  const result = calculationFn();
  const duration = performance.now() - startTime;

  memoCalculationMonitor.recordCalculation(calculationName, duration);
  return result;
};

/**
 * Hook for filtering and sorting causes with memoization
 */
export const useFilteredAndSortedCauses = (
  causes: PotentialCause[],
  searchQuery: string = '',
  sortBy: 'name' | 'relevancy' | 'alphabetical' = 'relevancy',
  selectedIds: Set<string> = new Set()
) => {
  return useMemo(() => {
    return withCalculationMonitoring('filteredAndSortedCauses', () => {
      // Filter by search query
      let filtered = causes;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = causes.filter(cause =>
          cause.cause_name.toLowerCase().includes(query) ||
          cause.cause_suggestion.toLowerCase().includes(query) ||
          cause.explanation.toLowerCase().includes(query)
        );
      }

      // Sort by specified criteria
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.cause_name.localeCompare(b.cause_name);
          case 'alphabetical':
            return a.cause_name.localeCompare(b.cause_name);
          case 'relevancy':
            // Sort by relevancy score if available, then by name
            const aScore = (a as any).relevancy_score || 0;
            const bScore = (b as any).relevancy_score || 0;
            if (aScore !== bScore) {
              return bScore - aScore; // Higher relevancy first
            }
            return a.cause_name.localeCompare(b.cause_name);
          default:
            return 0;
        }
      });

      // Separate selected and unselected for better UX
      const selected = sorted.filter(cause => selectedIds.has(cause.cause_id));
      const unselected = sorted.filter(cause => !selectedIds.has(cause.cause_id));

      return {
        all: sorted,
        selected,
        unselected,
        filteredCount: filtered.length,
        totalCount: causes.length
      };
    });
  }, [causes, searchQuery, sortBy, selectedIds]);
};

/**
 * Hook for filtering and sorting symptoms with memoization
 */
export const useFilteredAndSortedSymptoms = (
  symptoms: PotentialSymptom[],
  searchQuery: string = '',
  sortBy: 'name' | 'relevancy' | 'alphabetical' = 'relevancy',
  selectedIds: Set<string> = new Set()
) => {
  return useMemo(() => {
    return withCalculationMonitoring('filteredAndSortedSymptoms', () => {
      // Filter by search query
      let filtered = symptoms;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = symptoms.filter(symptom =>
          symptom.symptom_name.toLowerCase().includes(query) ||
          symptom.symptom_suggestion.toLowerCase().includes(query) ||
          symptom.explanation.toLowerCase().includes(query)
        );
      }

      // Sort by specified criteria
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.symptom_name.localeCompare(b.symptom_name);
          case 'alphabetical':
            return a.symptom_name.localeCompare(b.symptom_name);
          case 'relevancy':
            const aScore = (a as any).relevancy_score || 0;
            const bScore = (b as any).relevancy_score || 0;
            if (aScore !== bScore) {
              return bScore - aScore;
            }
            return a.symptom_name.localeCompare(b.symptom_name);
          default:
            return 0;
        }
      });

      // Separate selected and unselected
      const selected = sorted.filter(symptom => selectedIds.has(symptom.symptom_id));
      const unselected = sorted.filter(symptom => !selectedIds.has(symptom.symptom_id));

      return {
        all: sorted,
        selected,
        unselected,
        filteredCount: filtered.length,
        totalCount: symptoms.length
      };
    });
  }, [symptoms, searchQuery, sortBy, selectedIds]);
};

/**
 * Hook for calculating therapeutic properties with addressed causes/symptoms
 */
export const usePropertiesWithAddressedItems = (
  properties: TherapeuticProperty[],
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[]
) => {
  return useMemo(() => {
    return withCalculationMonitoring('propertiesWithAddressedItems', () => {
      return properties.map(property => {
        // Find causes addressed by this property
        const addressedCauses = selectedCauses.filter(cause => {
          const addressedCauseIds = property.addresses_cause_ids || [];
          return addressedCauseIds.includes(cause.cause_id);
        });

        // Find symptoms addressed by this property
        const addressedSymptoms = selectedSymptoms.filter(symptom => {
          const addressedSymptomIds = property.addresses_symptom_ids || [];
          return addressedSymptomIds.includes(symptom.symptom_id);
        });

        // Calculate relevancy score
        const relevancyScore = property.relevancy_score || property.relevancy || 0;

        return {
          ...property,
          addressedCauses,
          addressedSymptoms,
          relevancyScore,
          totalAddressed: addressedCauses.length + addressedSymptoms.length
        };
      });
    });
  }, [properties, selectedCauses, selectedSymptoms]);
};

/**
 * Hook for calculating selection statistics
 */
export const useSelectionStatistics = (
  potentialItems: (PotentialCause | PotentialSymptom)[],
  selectedItems: (PotentialCause | PotentialSymptom)[],
  type: 'causes' | 'symptoms'
) => {
  return useMemo(() => {
    return withCalculationMonitoring('selectionStatistics', () => {
      const totalCount = potentialItems.length;
      const selectedCount = selectedItems.length;
      const selectionPercentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

      // Calculate relevancy distribution
      const relevancyDistribution = {
        high: 0, // 4-5
        medium: 0, // 2-3
        low: 0 // 0-1
      };

      selectedItems.forEach(item => {
        const score = (item as any).relevancy_score || (item as any).relevancy || 0;
        if (score >= 4) {
          relevancyDistribution.high++;
        } else if (score >= 2) {
          relevancyDistribution.medium++;
        } else {
          relevancyDistribution.low++;
        }
      });

      // Calculate average relevancy
      const totalRelevancy = selectedItems.reduce((sum, item) => {
        return sum + ((item as any).relevancy_score || (item as any).relevancy || 0);
      }, 0);
      const averageRelevancy = selectedCount > 0 ? totalRelevancy / selectedCount : 0;

      return {
        totalCount,
        selectedCount,
        selectionPercentage,
        relevancyDistribution,
        averageRelevancy,
        hasSelection: selectedCount > 0,
        isComplete: selectedCount >= 1, // Minimum selection requirement
        type
      };
    });
  }, [potentialItems, selectedItems, type]);
};

/**
 * Hook for calculating oil recommendations summary
 */
export const useOilRecommendationsSummary = (
  suggestedOils: PropertyOilSuggestions[]
) => {
  return useMemo(() => {
    return withCalculationMonitoring('oilRecommendationsSummary', () => {
      const totalProperties = suggestedOils.length;
      const totalOils = suggestedOils.reduce((sum, property) => 
        sum + (property.suggested_oils?.length || 0), 0
      );

      // Calculate oil frequency (how many properties recommend each oil)
      const oilFrequency = new Map<string, { count: number; oil: any }>();
      
      suggestedOils.forEach(property => {
        property.suggested_oils?.forEach(oil => {
          const key = oil.oil_id || oil.name_english;
          if (oilFrequency.has(key)) {
            oilFrequency.get(key)!.count++;
          } else {
            oilFrequency.set(key, { count: 1, oil });
          }
        });
      });

      // Get most recommended oils
      const mostRecommended = Array.from(oilFrequency.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)
        .map(([key, { count, oil }]) => ({
          oil,
          recommendationCount: count,
          recommendationPercentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
        }));

      // Calculate average oils per property
      const averageOilsPerProperty = totalProperties > 0 ? totalOils / totalProperties : 0;

      return {
        totalProperties,
        totalOils,
        uniqueOils: oilFrequency.size,
        mostRecommended,
        averageOilsPerProperty,
        hasRecommendations: totalOils > 0
      };
    });
  }, [suggestedOils]);
};

/**
 * Hook for calculating wizard completion progress
 */
export const useWizardProgress = (
  healthConcern: any,
  demographics: DemographicsData | null,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  therapeuticProperties: TherapeuticProperty[],
  suggestedOils: PropertyOilSuggestions[]
) => {
  return useMemo(() => {
    return withCalculationMonitoring('wizardProgress', () => {
      const steps = [
        { name: 'Health Concern', completed: !!healthConcern },
        { name: 'Demographics', completed: !!demographics },
        { name: 'Causes', completed: selectedCauses.length > 0 },
        { name: 'Symptoms', completed: selectedSymptoms.length > 0 },
        { name: 'Properties', completed: therapeuticProperties.length > 0 },
        { name: 'Oils', completed: suggestedOils.length > 0 }
      ];

      const completedSteps = steps.filter(step => step.completed).length;
      const totalSteps = steps.length;
      const progressPercentage = (completedSteps / totalSteps) * 100;

      const nextStep = steps.find(step => !step.completed);
      const isComplete = completedSteps === totalSteps;

      return {
        steps,
        completedSteps,
        totalSteps,
        progressPercentage,
        nextStep: nextStep?.name || null,
        isComplete,
        canProceed: completedSteps >= 2 // Can proceed after demographics
      };
    });
  }, [healthConcern, demographics, selectedCauses, selectedSymptoms, therapeuticProperties, suggestedOils]);
};

/**
 * Hook for demographic-based recommendations
 */
export const useDemographicRecommendations = (
  demographics: DemographicsData | null,
  items: (PotentialCause | PotentialSymptom | TherapeuticProperty)[]
) => {
  return useMemo(() => {
    return withCalculationMonitoring('demographicRecommendations', () => {
      if (!demographics || items.length === 0) {
        return {
          ageRelevant: [],
          genderRelevant: [],
          generalRecommendations: items,
          hasPersonalization: false
        };
      }

      // Age-based filtering (simplified logic)
      const ageRelevant = items.filter(item => {
        const description = (item as any).description || (item as any).explanation || '';
        const ageCategory = demographics.ageCategory;
        
        // Simple keyword matching for age relevance
        if (ageCategory === 'child' || ageCategory === 'teen') {
          return !description.toLowerCase().includes('adult only') &&
                 !description.toLowerCase().includes('mature');
        }
        if (ageCategory === 'senior') {
          return description.toLowerCase().includes('senior') ||
                 description.toLowerCase().includes('elderly') ||
                 !description.toLowerCase().includes('young');
        }
        return true; // Adults get all recommendations
      });

      // Gender-based filtering (simplified logic)
      const genderRelevant = items.filter(item => {
        const description = (item as any).description || (item as any).explanation || '';
        const gender = demographics.gender.toLowerCase();
        
        // Simple keyword matching for gender relevance
        if (gender === 'female') {
          return !description.toLowerCase().includes('male only') &&
                 !description.toLowerCase().includes('men only');
        }
        if (gender === 'male') {
          return !description.toLowerCase().includes('female only') &&
                 !description.toLowerCase().includes('women only');
        }
        return true;
      });

      // Combine age and gender filtering
      const personalizedRecommendations = items.filter(item => 
        ageRelevant.includes(item) && genderRelevant.includes(item)
      );

      return {
        ageRelevant,
        genderRelevant,
        personalizedRecommendations,
        generalRecommendations: items,
        hasPersonalization: personalizedRecommendations.length !== items.length
      };
    });
  }, [demographics, items]);
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).memoCalculationMonitor = memoCalculationMonitor;
}
