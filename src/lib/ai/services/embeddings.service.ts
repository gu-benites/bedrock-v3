/**
 * @fileoverview OpenAI embeddings service for semantic similarity search
 */

import OpenAI from 'openai';

/**
 * Embedding configuration interface
 */
export interface EmbeddingConfig {
  model: string;
  dimensions?: number; // Keep dimensions as it's a valid OpenAI API parameter
}

/**
 * Default embedding configuration
 */
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-ada-002'
  // dimensions can be added here if there's a sensible default, or left out
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
 * @class OpenAIEmbeddingsService
 * @description Service for creating vector embeddings using the OpenAI API.
 * Handles API client initialization, embedding generation, and basic configuration.
 */
export class OpenAIEmbeddingsService {
  private client: OpenAI;
  private config: EmbeddingConfig;

  /**
   * Creates an instance of OpenAIEmbeddingsService.
   * @param {Partial<EmbeddingConfig>} [config={}] - Optional configuration to override default settings (e.g., model, dimensions). Example: `{ model: "text-embedding-3-small", dimensions: 1024 }`.
   * @throws {Error} If OPENAI_API_KEY environment variable is not set.
   */
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
   * Generates a vector embedding for a single text input using the OpenAI API.
   * @param {EmbeddingRequest} request - The request object containing the text and an optional model override.
   * @returns {Promise<EmbeddingResponse>} A promise that resolves to an object containing the embedding vector, model used, and token usage.
   * @throws {Error} If the text input is empty, if OpenAI API returns an error, or if no embedding data is received. Errors are prefixed with "EmbeddingService:".
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const { text, model = this.config.model } = request;

      // Validate input length
      if (text.length === 0) {
        throw new Error('EmbeddingService: Text input cannot be empty');
      }

      // Text truncation logic removed. Caller is responsible for ensuring text length is
      // appropriate for the chosen model and OpenAI API limits.
      const params: OpenAI.EmbeddingCreateParams = {
        model, // This is the effective model string
        input: text,
        encoding_format: 'float',
      };

      // Add dimensions if specified in the service's configuration
      if (this.config.dimensions) {
        params.dimensions = this.config.dimensions;
      }

      const response = await this.client.embeddings.create(params);

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        usage: response.usage
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EmbeddingService: Error creating embedding:', errorMessage);
      // Prepend "EmbeddingService:" to identify the source of the error easily.
      throw new Error(`EmbeddingService: Failed to create embedding. Details: ${errorMessage}`);
    }
  }

  /**
   * Performs a simple health check by attempting to create an embedding for a test string.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the test embedding is created successfully, `false` otherwise.
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
}

/**
 * Singleton instance of OpenAIEmbeddingsService
 */
let embeddingsService: OpenAIEmbeddingsService | null = null;

/**
 * Retrieves a singleton instance of the `OpenAIEmbeddingsService`.
 * Initializes the service on first call.
 * @returns {OpenAIEmbeddingsService} The singleton instance of the embedding service.
 */
export function getEmbeddingsService(): OpenAIEmbeddingsService {
  if (!embeddingsService) {
    embeddingsService = new OpenAIEmbeddingsService();
  }
  return embeddingsService;
}
