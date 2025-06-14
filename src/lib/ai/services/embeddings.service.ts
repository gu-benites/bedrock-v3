/**
 * @fileoverview OpenAI embeddings service for semantic similarity search
 */

import OpenAI from 'openai';

/**
 * Embedding configuration interface
 */
export interface EmbeddingConfig {
  model: string;
  dimensions?: number;
  maxTokens: number;
}

/**
 * Default embedding configuration
 */
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-ada-002',
  maxTokens: 8191 // Max tokens for text-embedding-ada-002
};

/**
 * Embedding request interface
 */
export interface EmbeddingRequest {
  text: string;
  model?: string;
}

/**
 * Embedding response interface
 */
export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI Embeddings Service for creating vector embeddings
 */
export class OpenAIEmbeddingsService {
  private client: OpenAI;
  private config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey
    });
  }

  /**
   * Create embedding for a single text input
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const { text, model = this.config.model } = request;

      // Validate input length
      if (text.length === 0) {
        throw new Error('Text input cannot be empty');
      }

      // Truncate text if too long (rough estimation: 1 token ≈ 4 characters)
      const maxChars = this.config.maxTokens * 4;
      const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

      const response = await this.client.embeddings.create({
        model,
        input: truncatedText,
        encoding_format: 'float'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        usage: response.usage
      };

    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error(`Failed to create embedding: ${error}`);
    }
  }

  /**
   * Create embeddings for multiple text inputs
   */
  async createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      // Process in batches to avoid rate limits
      const batchSize = 100; // OpenAI allows up to 2048 inputs per request
      const results: EmbeddingResponse[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(text => this.createEmbedding({ text, model }))
        );
        results.push(...batchResults);
      }

      return results;

    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw new Error(`Failed to create embeddings: ${error}`);
    }
  }

  /**
   * Create embedding for therapeutic property search query
   */
  async createTherapeuticPropertyEmbedding(
    therapeuticProperty: string,
    healthConcern: string,
    additionalContext?: string
  ): Promise<number[]> {
    try {
      // Construct search query combining therapeutic property and health concern
      const searchQuery = [
        `Therapeutic property: ${therapeuticProperty}`,
        `Health concern: ${healthConcern}`,
        additionalContext ? `Context: ${additionalContext}` : ''
      ].filter(Boolean).join('. ');

      const response = await this.createEmbedding({
        text: searchQuery,
        model: this.config.model
      });

      return response.embedding;

    } catch (error) {
      console.error('Error creating therapeutic property embedding:', error);
      throw new Error(`Failed to create therapeutic property embedding: ${error}`);
    }
  }

  /**
   * Create embedding for essential oil description
   */
  async createOilDescriptionEmbedding(
    oilName: string,
    botanicalName: string,
    therapeuticProperties: string[],
    description: string
  ): Promise<number[]> {
    try {
      // Construct comprehensive oil description for embedding
      const oilDescription = [
        `Essential oil: ${oilName} (${botanicalName})`,
        `Therapeutic properties: ${therapeuticProperties.join(', ')}`,
        `Description: ${description}`
      ].join('. ');

      const response = await this.createEmbedding({
        text: oilDescription,
        model: this.config.model
      });

      return response.embedding;

    } catch (error) {
      console.error('Error creating oil description embedding:', error);
      throw new Error(`Failed to create oil description embedding: ${error}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Health check for OpenAI embeddings service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.createEmbedding({
        text: 'Health check test',
        model: this.config.model
      });
      return true;
    } catch (error) {
      console.error('OpenAI embeddings health check failed:', error);
      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }
}

/**
 * Singleton instance of OpenAIEmbeddingsService
 */
let embeddingsService: OpenAIEmbeddingsService | null = null;

/**
 * Get singleton instance of OpenAIEmbeddingsService
 */
export function getEmbeddingsService(): OpenAIEmbeddingsService {
  if (!embeddingsService) {
    embeddingsService = new OpenAIEmbeddingsService();
  }
  return embeddingsService;
}

/**
 * Validate embeddings service configuration
 */
export function validateEmbeddingsConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY environment variable is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
