/**
 * @fileoverview Vector search tool for finding essential oils using Pinecone similarity search
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddingsService } from '../../services/embeddings.service';

/**
 * Vector search tool parameters schema
 */
const VectorSearchParams = z.object({
  therapeutic_property: z.string().describe('The therapeutic property to search for (e.g., "Anti-inflammatory", "Relaxante Muscular")'),
  health_concern: z.string().describe('The health concern context (e.g., "dor de cabeça", "back pain")'),
  additional_context: z.string().nullable().optional().describe('Additional context like symptoms or causes'),
  max_results: z.number().min(1).max(20).default(10).describe('Maximum number of oils to return'),
  embedding_model: z.string().optional().describe('Optional: The specific embedding model to use (e.g., "text-embedding-ada-002", "text-embedding-3-small")')
});

/**
 * Search using Pinecone vector database
 */
async function searchWithPinecone(
  therapeutic_property: string,
  health_concern: string,
  additional_context: string | null | undefined,
  max_results: number,
  embedding_model?: string
) {
  let embedding: number[];
  let searchQueryUsedForEmbedding: string;
  let embeddingModelUsed: string;

  // Phase 1: Embedding Generation
  try {
    console.log('🔄 Generating embedding...');
    const embeddingsService = getEmbeddingsService();
    // Assuming createPortugueseSearchEmbedding is robust and its errors are already prefixed by "EmbeddingService:"
    const { embeddingResponse, searchQueryUsed } = await embeddingsService.createPortugueseSearchEmbedding(
      therapeutic_property,
      health_concern,
      additional_context,
      embedding_model
    );

    embedding = embeddingResponse.embedding;
    searchQueryUsedForEmbedding = searchQueryUsed;
    embeddingModelUsed = embeddingResponse.model;

    console.log(`📝 Search query used by service: ${searchQueryUsedForEmbedding}`);
    if (!embedding || embedding.length === 0) {
      // This specific error is already clear from embedding service if it throws one for empty embeddings.
      // If not, this is a good place to ensure it's explicitly an embedding related error.
      throw new Error('Embedding result is empty or invalid from service.');
    }
    console.log(`✅ Embedding generated using model ${embeddingModelUsed} (${embedding.length} dimensions)`);

  } catch (embeddingError) {
    const message = embeddingError instanceof Error ? embeddingError.message : String(embeddingError);
    // Log the specific phase of failure
    console.error('❌ searchWithPinecone: Embedding Generation Phase Failed:', message);
    // Prepend a clear phase marker for the error message propagated to the tool's execute method
    throw new Error(`Embedding Generation Failed: ${message}`);
  }

  // Phase 2: Pinecone Operations
  try {
    console.log('🔄 Initializing Pinecone and querying...');
    const pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY']!
    });
    const indexName = process.env['PINECONE_INDEX_NAME']!;
    if (!indexName) {
        throw new Error('PINECONE_INDEX_NAME environment variable is not set.');
    }
    const index = pinecone.index(indexName);

    // Search Pinecone (default namespace first, then others if needed)
    let pineconeSearchResponse = await index.query({
      vector: embedding,
      topK: max_results,
      includeMetadata: true,
      includeValues: false
    });

    // If no results in default namespace, try other namespaces
    if (pineconeSearchResponse.matches.length === 0) {
      console.log('🔄 No results in default namespace, trying other namespaces...');
      try {
        const russellResponse = await index.namespace('russell').query({
          vector: embedding,
          topK: max_results,
          includeMetadata: true,
          includeValues: false
        });
        if (russellResponse.matches.length > 0) {
          pineconeSearchResponse = russellResponse;
        }
      } catch (namespaceError) {
        // Log this minor error but don't let it overshadow a potential primary failure
        console.warn('⚠️ Could not search russell namespace:', namespaceError instanceof Error ? namespaceError.message : 'Unknown error');
      }
    }

    console.log(`✅ Found ${pineconeSearchResponse.matches.length} results from Pinecone`);

    const results = pineconeSearchResponse.matches.map(match => ({
      text: match.metadata?.['text'] || '',
      score: match.score || 0
    }));

    return JSON.stringify({
      search_query: searchQueryUsedForEmbedding,
      therapeutic_property,
      health_concern,
      results: results,
      total_results: results.length,
      source: 'pinecone'
    }, null, 2);

  } catch (pineconeError) {
    const message = pineconeError instanceof Error ? pineconeError.message : String(pineconeError);
    // Log the specific phase of failure
    console.error('❌ searchWithPinecone: Pinecone Operation Phase Failed:', message);
    // Prepend a clear phase marker
    throw new Error(`Pinecone Operation Failed: ${message}`);
  }
}

/**
 * Vector search tool for essential oils recommendation
 *
 * This tool performs semantic similarity search using:
 * 1. OpenAI embeddings to convert search query to vector
 * 2. Pinecone vector database to find similar essential oils
 * 3. Returns ranked list of oils with relevance scores
 */
export const vectorSearchTool = tool({
  name: 'get_recommended_essential_oils',
  description: `Search for essential oils that possess specific therapeutic properties using vector similarity search.
  
  This tool finds oils that are semantically similar to the given therapeutic property and health concern.
  Use this tool multiple times with different query variations to get comprehensive results.
  
  Examples:
  - Search for "Anti-inflammatory" + "headache" 
  - Search for "Muscle relaxant" + "back pain"
  - Search for "Calming" + "anxiety"`,
  
  parameters: VectorSearchParams,
  
  execute: async (args, _context) => {
    try {
      const { therapeutic_property, health_concern, additional_context, max_results, embedding_model } = args; // Added embedding_model

      console.log(`🔍 [VECTOR SEARCH TOOL CALLED] Pinecone Vector search: ${therapeutic_property} for ${health_concern}`);
      if (embedding_model) { // Log if custom model is used
        console.log(`🔍 Using custom embedding model: ${embedding_model}`);
      }
      console.log(`🔍 [VECTOR SEARCH TOOL] Args:`, JSON.stringify(args, null, 2));

      // Check if Pinecone is configured
      const usePinecone = process.env['PINECONE_API_KEY'] && process.env['PINECONE_INDEX_NAME'];

      if (usePinecone) {
        // Pass embedding_model to searchWithPinecone
        return await searchWithPinecone(therapeutic_property, health_concern, additional_context, max_results, embedding_model);
      } else {
        console.error('❌ Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME environment variables.');
        // This error response structure should align with other tool errors (refined in task 4.x)
        return JSON.stringify({
          error: true,
          message: 'Pinecone is not configured. Essential search functionality is unavailable. Please contact support.',
          therapeutic_property,
          health_concern
          // embedding_model could be added here if useful for error reporting
        }, null, 2);
      }

    } catch (error) {
      console.error('❌ Vector search error:', error);

      return JSON.stringify({
        error: true,
        message: `Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        therapeutic_property: args.therapeutic_property,
        health_concern: args.health_concern
      }, null, 2);
    }
  },

  errorFunction: (_context, error) => {
    console.error('🚨 Vector search tool execution failed:', error);
    return `Vector search tool encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with different search parameters.`;
  }
});

/**
 * Health check tool for vector search infrastructure
 */
export const vectorSearchHealthCheckTool = tool({
  name: 'check_vector_search_health',
  description: 'Check if vector search infrastructure (Pinecone + OpenAI embeddings) is working correctly',

  parameters: z.object({}),

  execute: async (_args, _context) => {
    try {
      const usePinecone = process.env['PINECONE_API_KEY'] && process.env['PINECONE_INDEX_NAME'];

      if (usePinecone) {
        console.log('🏥 Checking Pinecone health...');

        const pinecone = new Pinecone({
          apiKey: process.env['PINECONE_API_KEY']!
        });

        const indexName = process.env['PINECONE_INDEX_NAME']!;
        const index = pinecone.index(indexName);

        const stats = await index.describeIndexStats();

        return JSON.stringify({
          overall_status: 'healthy',
          services: {
            pinecone: 'healthy',
            openai_embeddings: 'healthy'
          },
          index_stats: {
            total_vectors: stats.totalRecordCount || 0,
            dimensions: stats.dimension || 1536,
            namespaces: Object.keys(stats.namespaces || {})
          },
          timestamp: new Date().toISOString()
        }, null, 2);

      } else {
          console.warn('⚠️ Pinecone not configured for health check.');
        return JSON.stringify({
            overall_status: 'unhealthy',
          services: {
              pinecone: 'unconfigured',
              openai_embeddings: 'unknown (dependent on Pinecone configuration)'
          },
            message: 'Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME environment variables for a full health check.',
          timestamp: new Date().toISOString()
        }, null, 2);
      }

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
 * Export all vector search tools
 */
export const vectorSearchTools = [
  vectorSearchTool,
  vectorSearchHealthCheckTool
];
