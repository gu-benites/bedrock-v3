/**
 * @fileoverview Generic Pinecone vector search service
 * 
 * This module provides reusable Pinecone vector search functionality that can be used
 * across different contexts without being tied to specific domain logic.
 * It handles embedding generation and Pinecone querying based on generic inputs.
 */

import { getEmbeddingsService } from '@/lib/ai/services/embeddings.service';
import { 
  PineconeConfig, 
  getPineconeIndex, 
  validatePineconeConfig,
  getDefaultPineconeConfig 
} from './config';

/**
 * Parameters for vector search operations
 */
export interface VectorSearchParams {
  queryText: string;
  maxResults: number;
  embeddingModel?: string;
  namespace?: string;
  config?: PineconeConfig;
}

/**
 * Result structure for vector search operations
 */
export interface VectorSearchResult {
  queryUsedForEmbedding: string;
  embeddingModelUsed: string;
  results: Array<{
    text: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  totalResults: number;
  source: 'pinecone';
}

/**
 * Health check result structure
 */
export interface VectorSearchHealthResult {
  overall_status: 'healthy' | 'unhealthy';
  services: {
    pinecone: 'healthy' | 'unhealthy';
    openai_embeddings: 'healthy' | 'unhealthy';
  };
  index_stats?: {
    total_vectors: number;
    dimensions: number;
    namespaces: string[];
  };
  error?: string;
  timestamp: string;
}

/**
 * Performs a vector search using Pinecone vector database
 * 
 * This function is generic and can be used across different domains.
 * It handles embedding generation and Pinecone querying based on the provided parameters.
 * 
 * @param params - The parameters for the vector search
 * @returns A promise that resolves to the search results
 * 
 * @example
 * ```typescript
 * const result = await performVectorSearch({
 *   queryText: "propriedades anti-inflamatórias para dor de cabeça",
 *   maxResults: 10,
 *   embeddingModel: "text-embedding-ada-002"
 * });
 * ```
 */
export async function performVectorSearch(
  params: VectorSearchParams
): Promise<VectorSearchResult> {
  const {
    queryText,
    maxResults,
    embeddingModel,
    namespace,
    config
  } = params;

  // Use provided config or get default from environment
  const pineconeConfig = config || getDefaultPineconeConfig();
  const validation = validatePineconeConfig(pineconeConfig);
  
  if (!validation.isValid) {
    throw new Error(`Pinecone configuration error: ${validation.errors.join(', ')}`);
  }

  const validConfig = validation.validConfig!;
  let embedding: number[];
  let embeddingModelUsed: string;

  // Phase 1: Embedding Generation
  try {
    console.log(`🔄 Generating embedding for query: "${queryText}"...`);
    const embeddingsService = getEmbeddingsService();

    const embeddingResponse = await embeddingsService.createEmbedding({
      text: queryText,
      model: embeddingModel,
    });

    embedding = embeddingResponse.embedding;
    embeddingModelUsed = embeddingResponse.model;
    console.log(`✅ Embedding generated (${embedding.length} dimensions) using model: ${embeddingModelUsed}`);

  } catch (embeddingError) {
    const message = embeddingError instanceof Error ? embeddingError.message : String(embeddingError);
    console.error('❌ performVectorSearch: Embedding Generation Phase Failed:', message);
    throw new Error(`Embedding Generation Failed: ${message}`);
  }

  // Phase 2: Pinecone Query
  try {
    console.log('🔄 Initializing Pinecone and querying...');
    const index = getPineconeIndex(validConfig);

    // Build query options
    const queryOptions: any = {
      vector: embedding,
      topK: maxResults,
      includeMetadata: true,
      includeValues: false,
    };

    // Add namespace if specified (either from params or config)
    const targetNamespace = namespace || validConfig.namespace;
    if (targetNamespace) {
      queryOptions.namespace = targetNamespace;
    }

    const pineconeSearchResponse = await index.query(queryOptions);

    console.log(`✅ Found ${pineconeSearchResponse.matches.length} results from Pinecone`);

    const searchResults = pineconeSearchResponse.matches.map(match => ({
      text: (match.metadata?.['text'] as string) || '',
      score: match.score || 0,
      metadata: match.metadata || {}
    }));

    return {
      queryUsedForEmbedding: queryText,
      embeddingModelUsed,
      results: searchResults,
      totalResults: searchResults.length,
      source: 'pinecone'
    };

  } catch (pineconeError) {
    const message = pineconeError instanceof Error ? pineconeError.message : String(pineconeError);
    console.error('❌ performVectorSearch: Pinecone Operation Phase Failed:', message);
    throw new Error(`Pinecone Operation Failed: ${message}`);
  }
}

/**
 * Health check for Pinecone vector search infrastructure
 * 
 * @param config - Optional Pinecone configuration (uses environment defaults if not provided)
 * @returns Promise that resolves to health check result
 */
export async function checkVectorSearchHealth(
  config?: PineconeConfig
): Promise<VectorSearchHealthResult> {
  try {
    // Use provided config or get default from environment
    const pineconeConfig = config || getDefaultPineconeConfig();
    const validation = validatePineconeConfig(pineconeConfig);
    
    if (!validation.isValid) {
      return {
        overall_status: 'unhealthy',
        services: {
          pinecone: 'unhealthy',
          openai_embeddings: 'unknown'
        },
        error: `Configuration error: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    const validConfig = validation.validConfig!;
    const index = getPineconeIndex(validConfig);
    const stats = await index.describeIndexStats();

    return {
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
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      overall_status: 'unhealthy',
      services: {
        pinecone: 'unhealthy',
        openai_embeddings: 'healthy' // Assume embeddings service is healthy if Pinecone fails
      },
      error: message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch vector search for multiple queries
 * 
 * @param queries - Array of query texts to search
 * @param params - Common parameters for all searches
 * @returns Promise that resolves to array of search results
 */
export async function performBatchVectorSearch(
  queries: string[],
  params: Omit<VectorSearchParams, 'queryText'>
): Promise<VectorSearchResult[]> {
  const results = await Promise.all(
    queries.map(queryText => 
      performVectorSearch({ ...params, queryText })
    )
  );
  
  return results;
}
