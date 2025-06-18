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
 * @class OpenAIEmbeddingsService
 * @description Service for creating vector embeddings using the OpenAI API.
 * Handles API client initialization, embedding generation, and basic configuration.
 */
export class OpenAIEmbeddingsService {
  private client: OpenAI;
  private config: EmbeddingConfig;

  /**
   * Creates an instance of OpenAIEmbeddingsService.
   * @param {Partial<EmbeddingConfig>} [config={}] - Optional configuration to override default settings.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EmbeddingService: Error creating embedding:', errorMessage);
      // Prepend "EmbeddingService:" to identify the source of the error easily.
      throw new Error(`EmbeddingService: Failed to create embedding. Details: ${errorMessage}`);
    }
  }

  /**
   * Generates vector embeddings for an array of text inputs.
   * Processes texts in batches to manage API rate limits.
   * @param {string[]} texts - An array of strings to embed.
   * @param {string} [model] - Optional. The embedding model to use for all texts. If not provided, uses the service's default or the model specified in individual `createEmbedding` calls.
   * @returns {Promise<EmbeddingResponse[]>} A promise that resolves to an array of EmbeddingResponse objects.
   * @throws {Error} If any underlying `createEmbedding` call fails.
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
   * Creates an embedding for a search query constructed from a therapeutic property, health concern, and additional context.
   * Uses the service's default embedding model.
   * @param {string} therapeuticProperty - The therapeutic property.
   * @param {string} healthConcern - The related health concern.
   * @param {string} [additionalContext] - Optional additional context.
   * @returns {Promise<number[]>} A promise that resolves to the embedding vector.
   * @throws {Error} If embedding generation fails.
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
   * Creates an embedding for a comprehensive description of an essential oil, including its name, botanical name, properties, and description.
   * Uses the service's default embedding model.
   * @param {string} oilName - The common name of the oil.
   * @param {string} botanicalName - The botanical name of the oil.
   * @param {string[]} therapeuticProperties - An array of therapeutic properties.
   * @param {string} description - A textual description of the oil.
   * @returns {Promise<number[]>} A promise that resolves to the embedding vector.
   * @throws {Error} If embedding generation fails.
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
   * Calculates the cosine similarity between two embedding vectors.
   * @static
   * @param {number[]} embedding1 - The first embedding vector.
   * @param {number[]} embedding2 - The second embedding vector.
   * @returns {number} The cosine similarity score (between -1 and 1).
   * @throws {Error} If the embeddings do not have the same dimension.
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

  /**
   * Returns a copy of the current service configuration.
   * @returns {EmbeddingConfig} The current embedding configuration (model, maxTokens, dimensions).
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Creates an embedding for a Portuguese search query tailored for health and therapeutic property contexts.
   * This method encapsulates specific query construction logic (e.g., for the `vector-search-tool`).
   * It allows for model override.
   * @param {string} therapeuticProperty - The therapeutic property in Portuguese.
   * @param {string} healthConcern - The health concern in Portuguese.
   * @param {string | null} [additionalContext] - Optional additional context in Portuguese.
   * @param {string} [embeddingModel] - Optional. The embedding model to use. If not provided, uses the service's default.
   * @returns {Promise<{ embeddingResponse: EmbeddingResponse; searchQueryUsed: string }>} A promise that resolves to an object containing the full embedding response and the actual search query string used for embedding.
   * @throws {Error} If embedding generation fails. Errors are prefixed with "EmbeddingService:".
   */
  async createPortugueseSearchEmbedding(
    therapeuticProperty: string,
    healthConcern: string,
    additionalContext?: string | null,
    embeddingModel?: string
  ): Promise<{ embeddingResponse: EmbeddingResponse; searchQueryUsed: string }> {
    try {
      const lowerTherapeuticProperty = therapeuticProperty.toLowerCase();
      const lowerHealthConcern = healthConcern.toLowerCase();

      const searchQueries = [
        `propriedades ${lowerTherapeuticProperty} para ${lowerHealthConcern}`,
        `óleos essenciais ${lowerTherapeuticProperty}`,
        `óleos para ${lowerHealthConcern}`,
        additionalContext ? `${lowerTherapeuticProperty} ${additionalContext.toLowerCase()}` : null,
      ].filter(Boolean) as string[];

      // Use the primary query for embedding, or a sensible default if array is empty
      const searchQuery = searchQueries[0] || `${lowerTherapeuticProperty} ${lowerHealthConcern}`;

      const embeddingResp = await this.createEmbedding({
        text: searchQuery,
        model: embeddingModel, // Relies on createEmbedding's logic to use service default if undefined
      });

      return {
        embeddingResponse: embeddingResp,
        searchQueryUsed: searchQuery,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EmbeddingService: Error creating Portuguese search embedding:', errorMessage);
      // Prepend "EmbeddingService:" to identify the source of the error easily.
      throw new Error(`EmbeddingService: Failed to create Portuguese search embedding. Details: ${errorMessage}`);
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

/**
 * Validates the essential configuration for the embeddings service, primarily checking for the OpenAI API key.
 * @returns {{ isValid: boolean; errors: string[] }} An object indicating if the configuration is valid, and an array of error messages if not.
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
