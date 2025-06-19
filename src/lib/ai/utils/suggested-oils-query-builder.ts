/**
 * @fileoverview Suggested oils query construction utilities
 *
 * This module provides utilities for constructing search queries specifically
 * for the suggested oils feature in the create-recipe workflow. It follows
 * domain-specific logic while keeping the vector search functionality generic.
 */

/**
 * Parameters for building essential oils search queries
 */
export interface EssentialOilsQueryParams {
  therapeuticProperty: string;
  healthConcern: string;
  additionalContext?: string;
  language?: 'portuguese' | 'english';
}

/**
 * Result of query construction with multiple query variations
 */
export interface EssentialOilsQueryResult {
  primaryQuery: string;
  alternativeQueries: string[];
  allQueries: string[];
}

/**
 * Constructs optimized search queries for essential oils based on therapeutic properties
 * and health concerns. Uses Portuguese by default as it's optimized for the current
 * Pinecone index content.
 * 
 * @param params - Parameters for query construction
 * @returns Object containing primary query and alternatives
 * 
 * @example
 * ```typescript
 * const queryResult = buildEssentialOilsQuery({
 *   therapeuticProperty: "Anti-inflammatory",
 *   healthConcern: "dor de cabeça",
 *   additionalContext: "stress relief"
 * });
 * 
 * console.log(queryResult.primaryQuery);
 * // "propriedades anti-inflammatory para dor de cabeça"
 * ```
 */
export function buildEssentialOilsQuery(params: EssentialOilsQueryParams): EssentialOilsQueryResult {
  const {
    therapeuticProperty,
    healthConcern,
    additionalContext,
    language = 'portuguese'
  } = params;

  const lowerTherapeuticProperty = therapeuticProperty.toLowerCase();
  const lowerHealthConcern = healthConcern.toLowerCase();

  let queries: string[];

  if (language === 'portuguese') {
    queries = [
      // Primary query: Portuguese therapeutic property + health concern
      `propriedades ${lowerTherapeuticProperty} para ${lowerHealthConcern}`,
      
      // Secondary query: Essential oils for the therapeutic property
      `óleos essenciais ${lowerTherapeuticProperty}`,
      
      // Tertiary query: Health concern with oils
      `óleos para ${lowerHealthConcern}`,
      
      // Additional context if provided
      additionalContext ? `${lowerTherapeuticProperty} ${additionalContext.toLowerCase()}` : null
    ].filter(Boolean) as string[];
  } else {
    // English queries
    queries = [
      // Primary query: English therapeutic property + health concern
      `${lowerTherapeuticProperty} properties for ${lowerHealthConcern}`,
      
      // Secondary query: Essential oils for the therapeutic property
      `essential oils ${lowerTherapeuticProperty}`,
      
      // Tertiary query: Health concern with oils
      `oils for ${lowerHealthConcern}`,
      
      // Additional context if provided
      additionalContext ? `${lowerTherapeuticProperty} ${additionalContext.toLowerCase()}` : null
    ].filter(Boolean) as string[];
  }

  const [primaryQuery = '', ...alternativeQueries] = queries;

  return {
    primaryQuery,
    alternativeQueries,
    allQueries: queries
  };
}

/**
 * Constructs a simple search query for general essential oils search
 * 
 * @param searchTerm - The term to search for
 * @param language - Language for the query construction
 * @returns Formatted search query
 * 
 * @example
 * ```typescript
 * const query = buildSimpleOilsQuery("lavender", "portuguese");
 * // "óleos essenciais lavender"
 * ```
 */
export function buildSimpleOilsQuery(
  searchTerm: string,
  language: 'portuguese' | 'english' = 'portuguese'
): string {
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  if (language === 'portuguese') {
    return `óleos essenciais ${lowerSearchTerm}`;
  } else {
    return `essential oils ${lowerSearchTerm}`;
  }
}

/**
 * Validates essential oils query parameters
 * 
 * @param params - Parameters to validate
 * @returns Validation result with any error messages
 */
export function validateEssentialOilsQueryParams(params: EssentialOilsQueryParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.therapeuticProperty || params.therapeuticProperty.trim().length === 0) {
    errors.push('Therapeutic property is required and cannot be empty');
  }

  if (!params.healthConcern || params.healthConcern.trim().length === 0) {
    errors.push('Health concern is required and cannot be empty');
  }

  if (params.language && !['portuguese', 'english'].includes(params.language)) {
    errors.push('Language must be either "portuguese" or "english"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Logs query construction details for debugging
 * 
 * @param params - Original parameters
 * @param result - Query construction result
 */
export function logQueryConstruction(
  params: EssentialOilsQueryParams,
  result: EssentialOilsQueryResult
): void {
  console.log('📝 Essential Oils Query Construction:');
  console.log(`   Therapeutic Property: ${params.therapeuticProperty}`);
  console.log(`   Health Concern: ${params.healthConcern}`);
  console.log(`   Additional Context: ${params.additionalContext || 'None'}`);
  console.log(`   Language: ${params.language || 'portuguese'}`);
  console.log(`   Primary Query: "${result.primaryQuery}"`);
  console.log(`   Alternative Queries: ${result.alternativeQueries.length}`);
  result.alternativeQueries.forEach((query, index) => {
    console.log(`     ${index + 1}. "${query}"`);
  });
}
