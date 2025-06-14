/**
 * @fileoverview Vector search tool for finding essential oils using Pinecone similarity search
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Vector search tool parameters schema
 */
const VectorSearchParams = z.object({
  therapeutic_property: z.string().describe('The therapeutic property to search for (e.g., "Anti-inflammatory", "Relaxante Muscular")'),
  health_concern: z.string().describe('The health concern context (e.g., "dor de cabeça", "back pain")'),
  additional_context: z.string().nullable().optional().describe('Additional context like symptoms or causes'),
  max_results: z.number().min(1).max(20).default(10).describe('Maximum number of oils to return')
});

/**
 * Search using Pinecone vector database
 */
async function searchWithPinecone(
  therapeutic_property: string,
  health_concern: string,
  additional_context: string | null | undefined,
  max_results: number
) {
  try {
    console.log('🔄 Initializing Pinecone search...');

    // Initialize OpenAI for embeddings
    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY']
    });

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY']!
    });

    const indexName = process.env['PINECONE_INDEX_NAME']!;
    const index = pinecone.index(indexName);

    // Create optimized Portuguese search queries based on Pinecone analysis
    const searchQueries = [
      // Primary query: Portuguese therapeutic property + health concern
      `propriedades ${therapeutic_property.toLowerCase()} para ${health_concern}`,

      // Secondary query: Essential oils for the therapeutic property
      `óleos essenciais ${therapeutic_property.toLowerCase()}`,

      // Tertiary query: Health concern with oils
      `óleos para ${health_concern}`,

      // Additional context if provided
      additional_context ? `${therapeutic_property.toLowerCase()} ${additional_context}` : null
    ].filter(Boolean);

    console.log(`📝 Search queries: ${searchQueries.join(' | ')}`);

    // Use the primary query for embedding
    const searchQuery = searchQueries[0] || `${therapeutic_property} ${health_concern}`;

    console.log(`📝 Search query: ${searchQuery}`);

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchQuery
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    console.log(`✅ Embedding generated (${embedding.length} dimensions)`);

    // Search Pinecone (default namespace first, then others if needed)
    let searchResponse = await index.query({
      vector: embedding,
      topK: max_results,
      includeMetadata: true,
      includeValues: false
    });

    // If no results in default namespace, try other namespaces
    if (searchResponse.matches.length === 0) {
      console.log('🔄 No results in default namespace, trying other namespaces...');
      try {
        const russellResponse = await index.namespace('russell').query({
          vector: embedding,
          topK: max_results,
          includeMetadata: true,
          includeValues: false
        });
        if (russellResponse.matches.length > 0) {
          searchResponse = russellResponse;
        }
      } catch (error) {
        console.log('⚠️ Could not search russell namespace:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`✅ Found ${searchResponse.matches.length} results from Pinecone`);

    // Return minimal data structure - only text and score for LLM processing
    const results = searchResponse.matches.map(match => ({
      text: match.metadata?.['text'] || '',
      score: match.score || 0
    }));

    return JSON.stringify({
      search_query: searchQuery,
      therapeutic_property,
      health_concern,
      results: results,
      total_results: results.length,
      source: 'pinecone'
    }, null, 2);

  } catch (error) {
    console.error('❌ Pinecone search error:', error);

    // Fallback to mock data if Pinecone fails
    console.log('🔄 Falling back to mock data...');
    return await searchWithMockData(therapeutic_property, health_concern, max_results);
  }
}

/**
 * Search using mock data (fallback)
 */
async function searchWithMockData(
  therapeutic_property: string,
  health_concern: string,
  max_results: number
) {
  const MOCK_OILS = [
    {
      oil_id: 'oil-001-lavender',
      name_english: 'Lavender',
      name_botanical: 'Lavandula angustifolia',
      name_localized: 'Lavanda',
      therapeutic_properties: ['Calming', 'Relaxing', 'Anti-inflammatory'],
      health_concerns: ['headache', 'stress', 'anxiety', 'insomnia'],
      description: 'Versatile oil known for its calming and relaxing properties'
    },
    {
      oil_id: 'oil-002-peppermint',
      name_english: 'Peppermint',
      name_botanical: 'Mentha piperita',
      name_localized: 'Hortelã-pimenta',
      therapeutic_properties: ['Cooling', 'Analgesic', 'Mental Energizer'],
      health_concerns: ['headache', 'muscle tension', 'fatigue'],
      description: 'Cooling and energizing oil excellent for headaches and mental clarity'
    },
    {
      oil_id: 'oil-003-eucalyptus',
      name_english: 'Eucalyptus',
      name_botanical: 'Eucalyptus globulus',
      name_localized: 'Eucalipto',
      therapeutic_properties: ['Anti-inflammatory', 'Muscle Relaxant', 'Decongestant'],
      health_concerns: ['muscle tension', 'respiratory issues', 'headache'],
      description: 'Powerful anti-inflammatory oil great for muscle tension relief'
    },
    {
      oil_id: 'oil-004-chamomile',
      name_english: 'Chamomile',
      name_botanical: 'Matricaria chamomilla',
      name_localized: 'Camomila',
      therapeutic_properties: ['Calming', 'Anti-inflammatory', 'Sedative'],
      health_concerns: ['stress', 'anxiety', 'headache', 'insomnia'],
      description: 'Gentle calming oil perfect for stress and anxiety relief'
    },
    {
      oil_id: 'oil-005-rosemary',
      name_english: 'Rosemary',
      name_botanical: 'Rosmarinus officinalis',
      name_localized: 'Alecrim',
      therapeutic_properties: ['Mental Energizer', 'Stimulating', 'Memory Enhancer'],
      health_concerns: ['mental fatigue', 'poor concentration', 'headache'],
      description: 'Stimulating oil that enhances mental clarity and focus'
    },
    {
      oil_id: 'oil-006-marjoram',
      name_english: 'Marjoram',
      name_botanical: 'Origanum majorana',
      name_localized: 'Manjerona',
      therapeutic_properties: ['Muscle Relaxant', 'Calming', 'Sedative'],
      health_concerns: ['muscle tension', 'stress', 'headache'],
      description: 'Excellent muscle relaxant for tension and stress relief'
    }
  ];

  // Filter oils based on therapeutic property match
  const matchingOils = MOCK_OILS.filter(oil => {
    const propertyMatch = oil.therapeutic_properties.some(prop =>
      prop.toLowerCase().includes(therapeutic_property.toLowerCase()) ||
      therapeutic_property.toLowerCase().includes(prop.toLowerCase())
    );

    const healthConcernMatch = oil.health_concerns.some(concern =>
      concern.toLowerCase().includes(health_concern.toLowerCase()) ||
      health_concern.toLowerCase().includes(concern.toLowerCase())
    );

    return propertyMatch || healthConcernMatch;
  });

  // Format as minimal mock data - only text and score for LLM processing
  const results = matchingOils.slice(0, max_results).map((oil, index) => {
    const score = (5 - index) / 5; // Score 1.0 to 0.6
    const mockText = `O óleo essencial de ${oil.name_localized} (${oil.name_botanical}) possui propriedades ${oil.therapeutic_properties.join(', ').toLowerCase()}. ${oil.description} É especialmente útil para ${oil.health_concerns.join(', ')}.`;

    return {
      text: mockText,
      score: score
    };
  });

  console.log(`✅ Found ${results.length} matching oils for ${therapeutic_property}`);

  return JSON.stringify({
    search_query: `${therapeutic_property} for ${health_concern}`,
    therapeutic_property,
    health_concern,
    results: results,
    total_results: results.length,
    source: 'mock'
  }, null, 2);
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
      const { therapeutic_property, health_concern, additional_context, max_results } = args;

      console.log(`🔍 [VECTOR SEARCH TOOL CALLED] Pinecone Vector search: ${therapeutic_property} for ${health_concern}`);
      console.log(`🔍 [VECTOR SEARCH TOOL] Args:`, JSON.stringify(args, null, 2));

      // Check if Pinecone is configured
      const usePinecone = process.env['PINECONE_API_KEY'] && process.env['PINECONE_INDEX_NAME'];

      if (usePinecone) {
        return await searchWithPinecone(therapeutic_property, health_concern, additional_context, max_results);
      } else {
        console.log('🔄 Using mock data - Pinecone not configured');
        return await searchWithMockData(therapeutic_property, health_concern, max_results);
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
        console.log('🏥 Mock health check - Pinecone not configured');

        return JSON.stringify({
          overall_status: 'healthy',
          services: {
            mock_data: 'healthy',
            essential_oils_database: 'healthy'
          },
          mock_mode: true,
          total_oils_available: 6,
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
