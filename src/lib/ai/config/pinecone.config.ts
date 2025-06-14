/**
 * @fileoverview Pinecone vector database configuration for essential oils similarity search
 */

import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Pinecone configuration interface
 */
export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  dimension: number;
  metric: string;
}

/**
 * Default Pinecone configuration
 */
const DEFAULT_CONFIG: Omit<PineconeConfig, 'apiKey'> = {
  environment: 'us-east-1-aws',
  indexName: 'essential-oils-index',
  dimension: 1536, // OpenAI text-embedding-ada-002 dimension
  metric: 'cosine'
};

/**
 * Get Pinecone configuration from environment variables
 */
export function getPineconeConfig(): PineconeConfig {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  return {
    apiKey,
    environment: process.env.PINECONE_ENVIRONMENT || DEFAULT_CONFIG.environment,
    indexName: process.env.PINECONE_INDEX_NAME || DEFAULT_CONFIG.indexName,
    dimension: parseInt(process.env.PINECONE_DIMENSION || DEFAULT_CONFIG.dimension.toString()),
    metric: process.env.PINECONE_METRIC || DEFAULT_CONFIG.metric
  };
}

/**
 * Initialize Pinecone client
 */
export function createPineconeClient(): Pinecone {
  const config = getPineconeConfig();
  
  return new Pinecone({
    apiKey: config.apiKey,
    environment: config.environment
  });
}

/**
 * Essential oil vector metadata interface
 */
export interface OilVectorMetadata {
  oil_id: string;
  name_english: string;
  name_botanical: string;
  name_localized: string;
  therapeutic_properties: string[];
  health_concerns: string[];
  description: string;
  safety_notes?: string;
  contraindications?: string[];
}

/**
 * Vector search query interface
 */
export interface VectorSearchQuery {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeMetadata: boolean;
}

/**
 * Vector search result interface
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: OilVectorMetadata;
}

/**
 * Pinecone service class for essential oils vector operations
 */
export class PineconeOilsService {
  private client: Pinecone;
  private config: PineconeConfig;

  constructor() {
    this.config = getPineconeConfig();
    this.client = createPineconeClient();
  }

  /**
   * Get the Pinecone index for essential oils
   */
  private getIndex() {
    return this.client.index(this.config.indexName);
  }

  /**
   * Search for similar essential oils based on therapeutic property and health concern
   */
  async searchSimilarOils(
    queryVector: number[],
    therapeuticProperty: string,
    healthConcern: string,
    topK: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      const index = this.getIndex();
      
      const searchQuery: VectorSearchQuery = {
        vector: queryVector,
        topK,
        filter: {
          therapeutic_properties: { $in: [therapeuticProperty] },
          health_concerns: { $in: [healthConcern] }
        },
        includeMetadata: true
      };

      const searchResponse = await index.query(searchQuery);
      
      return searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as OilVectorMetadata
      })) || [];

    } catch (error) {
      console.error('Error searching similar oils:', error);
      throw new Error(`Failed to search similar oils: ${error}`);
    }
  }

  /**
   * Search oils by therapeutic property only (broader search)
   */
  async searchOilsByProperty(
    queryVector: number[],
    therapeuticProperty: string,
    topK: number = 15
  ): Promise<VectorSearchResult[]> {
    try {
      const index = this.getIndex();
      
      const searchQuery: VectorSearchQuery = {
        vector: queryVector,
        topK,
        filter: {
          therapeutic_properties: { $in: [therapeuticProperty] }
        },
        includeMetadata: true
      };

      const searchResponse = await index.query(searchQuery);
      
      return searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as OilVectorMetadata
      })) || [];

    } catch (error) {
      console.error('Error searching oils by property:', error);
      throw new Error(`Failed to search oils by property: ${error}`);
    }
  }

  /**
   * Health check for Pinecone connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const index = this.getIndex();
      await index.describeIndexStats();
      return true;
    } catch (error) {
      console.error('Pinecone health check failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance of PineconeOilsService
 */
let pineconeOilsService: PineconeOilsService | null = null;

/**
 * Get singleton instance of PineconeOilsService
 */
export function getPineconeOilsService(): PineconeOilsService {
  if (!pineconeOilsService) {
    pineconeOilsService = new PineconeOilsService();
  }
  return pineconeOilsService;
}

/**
 * Validate Pinecone environment configuration
 */
export function validatePineconeConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.PINECONE_API_KEY) {
    errors.push('PINECONE_API_KEY environment variable is required');
  }

  if (!process.env.PINECONE_ENVIRONMENT) {
    errors.push('PINECONE_ENVIRONMENT environment variable is recommended');
  }

  if (!process.env.PINECONE_INDEX_NAME) {
    errors.push('PINECONE_INDEX_NAME environment variable is recommended');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
