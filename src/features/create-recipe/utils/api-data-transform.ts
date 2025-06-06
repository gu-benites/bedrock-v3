/**
 * @fileoverview Utility functions for transforming and processing API data
 * in the Essential Oil Recipe Creator feature.
 */

import type {
  HealthConcernData,
  DemographicsData,
  PotentialCause,
  PotentialSymptom,
  TherapeuticProperty,
  EssentialOil,
  PropertyOilSuggestions,
  BaseApiRequest
} from '../types/recipe.types';

import { 
  DEFAULT_API_LANGUAGE,
  AGE_CATEGORY_OPTIONS 
} from '../constants/recipe.constants';

// ============================================================================
// REQUEST TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transforms form data into API request format
 */
export function transformToApiRequest(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  userLanguage: string = DEFAULT_API_LANGUAGE
): BaseApiRequest {
  return {
    health_concern: healthConcern.healthConcern.trim(),
    gender: demographics.gender,
    age_category: demographics.ageCategory,
    age_specific: demographics.specificAge.toString(),
    user_language: userLanguage
  };
}

/**
 * Validates age against selected age category
 */
export function validateAgeCategory(age: number, ageCategory: string): boolean {
  const category = AGE_CATEGORY_OPTIONS.find(cat => cat.value === ageCategory);
  if (!category) return false;
  
  return age >= category.minAge && age <= category.maxAge;
}

/**
 * Gets the appropriate age category for a given age
 */
export function getAgeCategoryForAge(age: number): string | null {
  const category = AGE_CATEGORY_OPTIONS.find(
    cat => age >= cat.minAge && age <= cat.maxAge
  );
  return category?.value || null;
}

/**
 * Sanitizes health concern input
 */
export function sanitizeHealthConcern(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters except basic punctuation
    .substring(0, 500); // Ensure max length
}

// ============================================================================
// RESPONSE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Sorts potential causes by relevancy (if available) or alphabetically
 */
export function sortPotentialCauses(causes: PotentialCause[]): PotentialCause[] {
  return [...causes].sort((a, b) => {
    // Primary sort by cause name alphabetically
    return a.cause_name.localeCompare(b.cause_name);
  });
}

/**
 * Sorts potential symptoms by relevancy or alphabetically
 */
export function sortPotentialSymptoms(symptoms: PotentialSymptom[]): PotentialSymptom[] {
  return [...symptoms].sort((a, b) => {
    return a.symptom_name.localeCompare(b.symptom_name);
  });
}

/**
 * Sorts therapeutic properties by relevancy score (highest first)
 */
export function sortTherapeuticProperties(properties: TherapeuticProperty[]): TherapeuticProperty[] {
  return [...properties].sort((a, b) => {
    // Primary sort by relevancy (highest first)
    if (a.relevancy !== b.relevancy) {
      return b.relevancy - a.relevancy;
    }
    // Secondary sort by name alphabetically
    return a.property_name.localeCompare(b.property_name);
  });
}

/**
 * Sorts essential oils by relevancy score (highest first)
 */
export function sortEssentialOils(oils: EssentialOil[]): EssentialOil[] {
  return [...oils].sort((a, b) => {
    // Primary sort by relevancy (highest first)
    if (a.relevancy !== b.relevancy) {
      return b.relevancy - a.relevancy;
    }
    // Secondary sort by name alphabetically
    return a.name_local_language.localeCompare(b.name_local_language);
  });
}

/**
 * Groups and sorts oil suggestions by therapeutic property
 */
export function sortPropertyOilSuggestions(suggestions: PropertyOilSuggestions[]): PropertyOilSuggestions[] {
  return suggestions.map(suggestion => ({
    ...suggestion,
    suggested_oils: sortEssentialOils(suggestion.suggested_oils)
  })).sort((a, b) => {
    // Sort by property name alphabetically
    return a.property_name.localeCompare(b.property_name);
  });
}

// ============================================================================
// DATA FILTERING UTILITIES
// ============================================================================

/**
 * Filters causes based on search query
 */
export function filterCausesBySearch(causes: PotentialCause[], searchQuery: string): PotentialCause[] {
  if (!searchQuery.trim()) return causes;
  
  const query = searchQuery.toLowerCase().trim();
  return causes.filter(cause =>
    cause.cause_name.toLowerCase().includes(query) ||
    cause.cause_suggestion.toLowerCase().includes(query) ||
    cause.explanation.toLowerCase().includes(query)
  );
}

/**
 * Filters symptoms based on search query
 */
export function filterSymptomsBySearch(symptoms: PotentialSymptom[], searchQuery: string): PotentialSymptom[] {
  if (!searchQuery.trim()) return symptoms;
  
  const query = searchQuery.toLowerCase().trim();
  return symptoms.filter(symptom =>
    symptom.symptom_name.toLowerCase().includes(query) ||
    symptom.symptom_suggestion.toLowerCase().includes(query) ||
    symptom.explanation.toLowerCase().includes(query)
  );
}

/**
 * Filters oils based on search query
 */
export function filterOilsBySearch(oils: EssentialOil[], searchQuery: string): EssentialOil[] {
  if (!searchQuery.trim()) return oils;
  
  const query = searchQuery.toLowerCase().trim();
  return oils.filter(oil =>
    oil.name_english.toLowerCase().includes(query) ||
    oil.name_local_language.toLowerCase().includes(query) ||
    oil.oil_description.toLowerCase().includes(query)
  );
}

/**
 * Filters therapeutic properties by minimum relevancy score
 */
export function filterPropertiesByRelevancy(
  properties: TherapeuticProperty[], 
  minRelevancy: number = 1
): TherapeuticProperty[] {
  return properties.filter(property => property.relevancy >= minRelevancy);
}

// ============================================================================
// DATA VALIDATION UTILITIES
// ============================================================================

/**
 * Validates that required selections are made
 */
export function validateSelections(
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (selectedCauses.length === 0) {
    errors.push('At least one cause must be selected');
  }
  
  if (selectedSymptoms.length === 0) {
    errors.push('At least one symptom must be selected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that API response data is complete
 */
export function validateApiResponseData(data: any, expectedFields: string[]): boolean {
  if (!data || typeof data !== 'object') return false;
  
  return expectedFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null && 
           (typeof value !== 'string' || value.trim().length > 0);
  });
}

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Formats relevancy score for display
 */
export function formatRelevancyScore(score: number): string {
  const stars = '★'.repeat(score) + '☆'.repeat(5 - score);
  return `${stars} (${score}/5)`;
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats oil names for display (prioritizes local language)
 */
export function formatOilName(oil: EssentialOil): string {
  if (oil.name_local_language && oil.name_local_language !== oil.name_english) {
    return `${oil.name_local_language} (${oil.name_english})`;
  }
  return oil.name_english;
}

/**
 * Creates a summary of selected items
 */
export function createSelectionSummary(
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[]
): string {
  const causesText = selectedCauses.length === 1 
    ? '1 cause' 
    : `${selectedCauses.length} causes`;
  
  const symptomsText = selectedSymptoms.length === 1 
    ? '1 symptom' 
    : `${selectedSymptoms.length} symptoms`;
  
  return `Selected: ${causesText} and ${symptomsText}`;
}

// ============================================================================
// DATA EXPORT UTILITIES
// ============================================================================

/**
 * Exports wizard data to a shareable format
 */
export function exportWizardData(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  therapeuticProperties: TherapeuticProperty[],
  suggestedOils: PropertyOilSuggestions[]
) {
  return {
    healthConcern: healthConcern.healthConcern,
    demographics: {
      gender: demographics.gender,
      ageCategory: demographics.ageCategory,
      specificAge: demographics.specificAge
    },
    selectedCauses: selectedCauses.map(cause => ({
      name: cause.cause_name,
      suggestion: cause.cause_suggestion
    })),
    selectedSymptoms: selectedSymptoms.map(symptom => ({
      name: symptom.symptom_name,
      suggestion: symptom.symptom_suggestion
    })),
    therapeuticProperties: therapeuticProperties.map(prop => ({
      name: prop.property_name,
      description: prop.description,
      relevancy: prop.relevancy
    })),
    suggestedOils: suggestedOils.map(propOils => ({
      property: propOils.property_name,
      oils: propOils.suggested_oils.map(oil => ({
        name: formatOilName(oil),
        description: oil.oil_description,
        relevancy: oil.relevancy
      }))
    })),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Creates a text summary of the recipe
 */
export function createRecipeSummary(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  suggestedOils: PropertyOilSuggestions[]
): string {
  const lines: string[] = [];
  
  lines.push(`Health Concern: ${healthConcern.healthConcern}`);
  lines.push(`Demographics: ${demographics.gender}, ${demographics.specificAge} years old`);
  lines.push('');
  
  lines.push('Selected Causes:');
  selectedCauses.forEach(cause => {
    lines.push(`• ${cause.cause_name}`);
  });
  lines.push('');
  
  lines.push('Selected Symptoms:');
  selectedSymptoms.forEach(symptom => {
    lines.push(`• ${symptom.symptom_name}`);
  });
  lines.push('');
  
  lines.push('Recommended Essential Oils:');
  suggestedOils.forEach(propOils => {
    lines.push(`\n${propOils.property_name}:`);
    propOils.suggested_oils.forEach(oil => {
      lines.push(`• ${formatOilName(oil)} ${formatRelevancyScore(oil.relevancy)}`);
    });
  });
  
  return lines.join('\n');
}
