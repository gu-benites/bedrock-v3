/**
 * @fileoverview OpenAI Agents JS tools for suggested oils search in create-recipe workflow
 *
 * This module contains the AI tools that agents use to search for essential oils
 * based on therapeutic properties. It uses the generic Pinecone service for
 * vector search operations while handling domain-specific logic.
 *
 * Updated: Fixed OpenAI Structured Outputs compatibility with nullable optional fields.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { performVectorSearch, checkVectorSearchHealth } from '@/lib/pinecone/pinecone.service';
import { 
  buildEssentialOilsQuery, 
  validateEssentialOilsQueryParams,
  logQueryConstruction 
} from '../utils/suggested-oils-query-builder';

/**
 * Vector search tool parameters schema for essential oils
 */
const SuggestedOilsSearchParams = z.object({
  therapeutic_property: z.string().describe('The therapeutic property to search for (e.g., "Anti-inflammatory", "Relaxante Muscular")'),
  health_concern: z.string().describe('The health concern context (e.g., "dor de cabeça", "back pain")'),
  additional_context: z.string().nullable().optional().describe('Additional context like symptoms or causes'),
  max_results: z.number().min(1).max(20).default(10).describe('Maximum number of oils to return'),
  embedding_model: z.string().nullable().optional().describe('Optional: The specific embedding model to use (e.g., "text-embedding-ada-002", "text-embedding-3-small")')
});

/**
 * Search for essential oils using domain-specific logic and generic vector search
 * This function handles the create-recipe workflow specific requirements while
 * delegating the actual vector search to the generic Pinecone service.
 */
async function searchSuggestedOils(
  therapeutic_property: string,
  health_concern: string,
  additional_context: string | null | undefined,
  max_results: number,
  embedding_model: string | null | undefined
): Promise<string> {
  try {
    // Validate inputs using domain-specific validation
    const validation = validateEssentialOilsQueryParams({
      therapeuticProperty: therapeutic_property,
      healthConcern: health_concern,
      additionalContext: additional_context || undefined
    });

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Build essential oils specific query using domain utilities
    const queryResult = buildEssentialOilsQuery({
      therapeuticProperty: therapeutic_property,
      healthConcern: health_concern,
      additionalContext: additional_context || undefined,
      language: 'portuguese'
    });

    // Log query construction for debugging
    logQueryConstruction({
      therapeuticProperty: therapeutic_property,
      healthConcern: health_concern,
      additionalContext: additional_context || undefined,
      language: 'portuguese'
    }, queryResult);

    // Perform the vector search using the generic Pinecone service
    const searchResult = await performVectorSearch({
      queryText: queryResult.primaryQuery,
      maxResults: max_results,
      embeddingModel: embedding_model || undefined
    });

    // Format the result for the create-recipe workflow's specific output format
    return JSON.stringify({
      search_query: searchResult.queryUsedForEmbedding,
      therapeutic_property,
      health_concern,
      results: searchResult.results.map(result => ({
        text: result.text,
        score: result.score
      })),
      total_results: searchResult.totalResults,
      source: searchResult.source,
      embedding_model_used: searchResult.embeddingModelUsed,
      alternative_queries: queryResult.alternativeQueries
    }, null, 2);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ searchSuggestedOils failed:', message);
    throw new Error(`Suggested oils search failed: ${message}`);
  }
}

/**
 * OpenAI Agents JS tool for essential oils recommendation in create-recipe workflow
 *
 * This tool performs semantic similarity search using:
 * 1. OpenAI embeddings to convert search query to vector
 * 2. Pinecone vector database to find similar essential oils
 * 3. Returns ranked list of oils with relevance scores
 */
export const suggestedOilsSearchTool = tool({
  name: 'get_recommended_essential_oils',
  description: `Search for essential oils that possess specific therapeutic properties using vector similarity search.
  
  This tool finds oils that are semantically similar to the given therapeutic property and health concern.
  Use this tool multiple times with different query variations to get comprehensive results.
  
  Examples:
  - Search for "Anti-inflammatory" + "headache" 
  - Search for "Muscle relaxant" + "back pain"
  - Search for "Calming" + "anxiety"`,
  
  parameters: SuggestedOilsSearchParams,
  
  execute: async (args, _context) => {
    try {
      const { therapeutic_property, health_concern, additional_context, max_results, embedding_model } = args;

      console.log(`🔍 [SUGGESTED OILS SEARCH TOOL] Vector search: ${therapeutic_property} for ${health_concern}`);
      if (embedding_model) {
        console.log(`🔍 Using custom embedding model: ${embedding_model}`);
      }
      console.log(`🔍 [SUGGESTED OILS SEARCH TOOL] Args:`, JSON.stringify(args, null, 2));

      // Use the domain-specific search function
      return await searchSuggestedOils(therapeutic_property, health_concern, additional_context, max_results, embedding_model);

    } catch (error) {
      console.error('❌ Suggested oils search error:', error);

      return JSON.stringify({
        error: true,
        message: `Suggested oils search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        therapeutic_property: args.therapeutic_property,
        health_concern: args.health_concern
      }, null, 2);
    }
  },

  errorFunction: (_context, error) => {
    console.error('🚨 Suggested oils search tool execution failed:', error);
    return `Suggested oils search tool encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with different search parameters.`;
  }
});

/**
 * Health check tool for vector search infrastructure used by suggested oils feature
 */
export const suggestedOilsHealthCheckTool = tool({
  name: 'check_vector_search_health',
  description: 'Check if vector search infrastructure (Pinecone + OpenAI embeddings) is working correctly for suggested oils feature',

  parameters: z.object({}),

  execute: async (_args, _context) => {
    try {
      console.log('🏥 Checking vector search health for suggested oils...');
      
      const healthResult = await checkVectorSearchHealth();
      return JSON.stringify(healthResult, null, 2);

    } catch (error) {
      return JSON.stringify({
        overall_status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2);
    }
  }
});

/**
 * Export all suggested oils search tools for easy import by agents
 */
export const suggestedOilsSearchTools = [
  suggestedOilsSearchTool,
  suggestedOilsHealthCheckTool
];

// Legacy exports for backward compatibility (can be removed in future versions)
export const vectorSearchTool = suggestedOilsSearchTool;
export const vectorSearchHealthCheckTool = suggestedOilsHealthCheckTool;
export const vectorSearchTools = suggestedOilsSearchTools;
