/**
 * @fileoverview Pinecone configuration and connection management
 * 
 * This module handles Pinecone-specific configuration, environment variables,
 * and connection setup. It provides a centralized way to manage Pinecone
 * connections across the application.
 */

import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Pinecone configuration interface
 */
export interface PineconeConfig {
  apiKey: string;
  indexName: string;
  namespace?: string;
  environment?: string;
}

/**
 * Default Pinecone configuration from environment variables
 */
export const getDefaultPineconeConfig = (): Partial<PineconeConfig> => {
  return {
    apiKey: process.env['PINECONE_API_KEY'],
    indexName: process.env['PINECONE_INDEX_NAME'],
    namespace: process.env['PINECONE_NAMESPACE'],
    environment: process.env['PINECONE_ENVIRONMENT']
  };
};

/**
 * Validates Pinecone configuration
 * 
 * @param config - Partial Pinecone configuration to validate
 * @returns Validation result with any error messages
 */
export function validatePineconeConfig(config: Partial<PineconeConfig>): {
  isValid: boolean;
  errors: string[];
  validConfig?: PineconeConfig;
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('PINECONE_API_KEY is required');
  }

  if (!config.indexName) {
    errors.push('PINECONE_INDEX_NAME is required');
  }

  if (errors.length === 0) {
    return {
      isValid: true,
      errors: [],
      validConfig: {
        apiKey: config.apiKey!,
        indexName: config.indexName!,
        namespace: config.namespace,
        environment: config.environment
      }
    };
  }

  return {
    isValid: false,
    errors
  };
}

/**
 * Creates a Pinecone client instance
 * 
 * @param config - Pinecone configuration
 * @returns Configured Pinecone client
 */
export function createPineconeClient(config: PineconeConfig): Pinecone {
  return new Pinecone({
    apiKey: config.apiKey
  });
}

/**
 * Gets a Pinecone index instance
 * 
 * @param config - Pinecone configuration
 * @returns Pinecone index instance
 */
export function getPineconeIndex(config: PineconeConfig) {
  const client = createPineconeClient(config);
  return client.index(config.indexName);
}

/**
 * Validates environment variables and returns a ready-to-use Pinecone configuration
 * 
 * @returns Promise that resolves to validated Pinecone configuration
 * @throws Error if configuration is invalid
 */
export async function getValidatedPineconeConfig(): Promise<PineconeConfig> {
  const defaultConfig = getDefaultPineconeConfig();
  const validation = validatePineconeConfig(defaultConfig);

  if (!validation.isValid) {
    throw new Error(`Pinecone configuration error: ${validation.errors.join(', ')}`);
  }

  return validation.validConfig!;
}

/**
 * Connection test utility
 * 
 * @param config - Pinecone configuration to test
 * @returns Promise that resolves to connection test result
 */
export async function testPineconeConnection(config: PineconeConfig): Promise<{
  success: boolean;
  error?: string;
  indexStats?: {
    totalVectors: number;
    dimensions: number;
    namespaces: string[];
  };
}> {
  try {
    const index = getPineconeIndex(config);
    const stats = await index.describeIndexStats();

    return {
      success: true,
      indexStats: {
        totalVectors: stats.totalRecordCount || 0,
        dimensions: stats.dimension || 1536,
        namespaces: Object.keys(stats.namespaces || {})
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}
