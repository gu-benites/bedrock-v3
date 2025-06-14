#!/usr/bin/env node

/**
 * Interactive Pinecone Vector Search Test
 *
 * This script allows you to test the Pinecone vector search functionality
 * by searching for essential oils using natural language queries.
 *
 * Usage:
 *   node scripts/test-pinecone-search.js
 *
 * Requirements:
 *   - OPENAI_API_KEY environment variable
 *   - PINECONE_API_KEY environment variable
 *   - PINECONE_ENVIRONMENT environment variable
 *   - PINECONE_INDEX_NAME environment variable
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.magenta}🐛${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔄${colors.reset} ${msg}`)
};

/**
 * Initialize OpenAI client
 */
async function initializeOpenAI() {
  try {
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    log.success('OpenAI client initialized');
    return openai;
  } catch (error) {
    log.error(`Failed to initialize OpenAI: ${error.message}`);
    throw error;
  }
}

/**
 * Initialize Pinecone client
 */
async function initializePinecone() {
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME environment variable is required');
    }
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = pinecone.index(indexName);
    
    log.success(`Pinecone client initialized with index: ${indexName}`);
    return { pinecone, index, indexName };
  } catch (error) {
    log.error(`Failed to initialize Pinecone: ${error.message}`);
    throw error;
  }
}

/**
 * Generate embedding for a text query
 */
async function generateEmbedding(openai, text) {
  try {
    log.step(`Generating embedding for: "${text}"`);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    
    const embedding = response.data[0].embedding;
    log.success(`Embedding generated (${embedding.length} dimensions)`);
    
    return embedding;
  } catch (error) {
    log.error(`Failed to generate embedding: ${error.message}`);
    throw error;
  }
}

/**
 * Search Pinecone for similar vectors
 */
async function searchPinecone(index, embedding, topK = 10) {
  try {
    log.step(`Searching Pinecone for ${topK} most similar results...`);

    // Try searching in different namespaces
    const namespaces = ['', 'russell', 'research_papers']; // Empty string for default namespace
    let allResults = [];

    for (const namespace of namespaces) {
      try {
        log.debug(`Searching in namespace: ${namespace || 'default'}`);

        const queryParams = {
          vector: embedding,
          topK: topK,
          includeMetadata: true,
          includeValues: false
        };

        // Use namespace method for non-default namespaces
        let searchResponse;
        if (namespace) {
          searchResponse = await index.namespace(namespace).query(queryParams);
        } else {
          searchResponse = await index.query(queryParams);
        }

        if (searchResponse.matches.length > 0) {
          log.info(`Found ${searchResponse.matches.length} results in namespace: ${namespace || 'default'}`);
          allResults.push(...searchResponse.matches.map(match => ({
            ...match,
            namespace: namespace || 'default'
          })));
        }
      } catch (nsError) {
        log.warning(`Search failed in namespace ${namespace || 'default'}: ${nsError.message}`);
      }
    }

    // Sort by score and limit results
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    const finalResults = allResults.slice(0, topK);

    log.success(`Found ${finalResults.length} total results across all namespaces`);
    return finalResults;
  } catch (error) {
    log.error(`Pinecone search failed: ${error.message}`);
    throw error;
  }
}

/**
 * Display search results with raw data and similarity analysis
 */
function displayResults(results, query) {
  console.log(`\n${colors.bright}🔍 Search Results for: "${query}"${colors.reset}`);
  console.log('='.repeat(80));

  if (results.length === 0) {
    log.warning('No results found');
    return;
  }

  results.forEach((result, index) => {
    const score = (result.score * 100).toFixed(1);
    const metadata = result.metadata || {};

    console.log(`\n${colors.cyan}${index + 1}.${colors.reset} ${colors.bright}Similarity: ${score}%${colors.reset}`);
    console.log(`   ${colors.blue}ID:${colors.reset} ${result.id}`);
    console.log(`   ${colors.blue}Namespace:${colors.reset} ${result.namespace || 'default'}`);
    console.log(`   ${colors.blue}Raw Score:${colors.reset} ${result.score}`);

    // Display all metadata in a structured way
    console.log(`   ${colors.magenta}📋 Raw Metadata:${colors.reset}`);
    Object.entries(metadata).forEach(([key, value]) => {
      const displayValue = typeof value === 'string' && value.length > 100
        ? value.substring(0, 100) + '...'
        : value;
      console.log(`      ${colors.yellow}${key}:${colors.reset} ${displayValue}`);
    });

    // Show full text content if available (truncated)
    if (metadata.text) {
      console.log(`   ${colors.magenta}📄 Content Preview:${colors.reset}`);
      const textPreview = String(metadata.text).substring(0, 300);
      console.log(`      ${colors.cyan}"${textPreview}..."${colors.reset}`);
    }

    // Show title prominently if available
    if (metadata.title) {
      console.log(`   ${colors.magenta}📝 Title:${colors.reset} ${colors.bright}${metadata.title}${colors.reset}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  // Summary analysis
  console.log(`\n${colors.bright}📊 Data Analysis Summary:${colors.reset}`);

  // Analyze metadata patterns
  const allKeys = new Set();
  const titlePatterns = new Set();
  const scoreRange = { min: 1, max: 0 };

  results.forEach(result => {
    Object.keys(result.metadata || {}).forEach(key => allKeys.add(key));
    if (result.metadata?.title) {
      titlePatterns.add(String(result.metadata.title));
    }
    if (result.score) {
      scoreRange.min = Math.min(scoreRange.min, result.score);
      scoreRange.max = Math.max(scoreRange.max, result.score);
    }
  });

  console.log(`   ${colors.blue}Available metadata fields:${colors.reset} ${Array.from(allKeys).join(', ')}`);
  console.log(`   ${colors.blue}Score range:${colors.reset} ${(scoreRange.min * 100).toFixed(1)}% - ${(scoreRange.max * 100).toFixed(1)}%`);
  console.log(`   ${colors.blue}Total results:${colors.reset} ${results.length}`);

  // Suggest better queries based on content
  console.log(`\n${colors.bright}💡 Query Optimization Suggestions:${colors.reset}`);
  console.log(`   ${colors.green}Current query:${colors.reset} "${query}"`);

  if (results.some(r => r.metadata?.title?.includes('Óleo Essencial'))) {
    console.log(`   ${colors.green}Try specific oil names:${colors.reset} "óleo essencial de lavanda", "lavanda propriedades"`);
  }

  if (results.some(r => r.metadata?.text?.includes('propriedades'))) {
    console.log(`   ${colors.green}Try therapeutic properties:${colors.reset} "propriedades calmantes", "efeitos relaxantes"`);
  }

  if (results.some(r => r.metadata?.text?.includes('dor de cabeça'))) {
    console.log(`   ${colors.green}Try health conditions:${colors.reset} "dor de cabeça", "enxaqueca", "tensão muscular"`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Run predefined test queries to analyze data patterns
 */
async function runTestQueries(openai, index) {
  const testQueries = [
    // Basic oil names
    'lavanda',
    'lavender',
    'óleo essencial de lavanda',

    // Therapeutic properties in Portuguese
    'propriedades calmantes',
    'efeitos relaxantes',
    'anti-inflamatório',
    'relaxante muscular',

    // Health conditions
    'dor de cabeça',
    'enxaqueca',
    'tensão muscular',
    'estresse',
    'ansiedade',

    // Mixed queries
    'lavanda para dor de cabeça',
    'óleos calmantes para ansiedade',
    'propriedades terapêuticas lavanda'
  ];

  log.info(`Running ${testQueries.length} predefined test queries...`);

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];

    console.log(`\n${colors.bright}📋 Test Query ${i + 1}/${testQueries.length}: "${query}"${colors.reset}`);

    try {
      // Generate embedding
      const embedding = await generateEmbedding(openai, query);

      // Search Pinecone
      const results = await searchPinecone(index, embedding, 5); // Fewer results for testing

      // Show top result only for quick analysis
      if (results.length > 0) {
        const topResult = results[0];
        const score = (topResult.score * 100).toFixed(1);
        const title = topResult.metadata?.title || 'No title';

        console.log(`   ${colors.green}✅ Top result (${score}%):${colors.reset} ${title}`);

        // Show relevant metadata
        if (topResult.metadata?.text) {
          const textPreview = String(topResult.metadata.text).substring(0, 150);
          console.log(`   ${colors.cyan}📄 Content:${colors.reset} "${textPreview}..."`);
        }
      } else {
        console.log(`   ${colors.red}❌ No results found${colors.reset}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`   ${colors.red}❌ Error:${colors.reset} ${error.message}`);
    }
  }

  console.log(`\n${colors.bright}📊 Test completed! Use individual queries above for detailed analysis.${colors.reset}\n`);
}

/**
 * Test Pinecone index health
 */
async function testIndexHealth(index, indexName) {
  try {
    log.step('Testing Pinecone index health...');
    
    const stats = await index.describeIndexStats();
    
    log.success('Index health check passed');
    log.info(`Index: ${indexName}`);
    log.info(`Total vectors: ${stats.totalVectorCount || 0}`);
    log.info(`Dimensions: ${stats.dimension || 'Unknown'}`);
    
    if (stats.namespaces) {
      log.info(`Namespaces: ${Object.keys(stats.namespaces).join(', ') || 'default'}`);
    }
    
    return stats;
  } catch (error) {
    log.error(`Index health check failed: ${error.message}`);
    throw error;
  }
}

/**
 * Interactive search loop
 */
async function interactiveSearch(openai, index) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };
  
  console.log(`\n${colors.bright}🌿 Interactive Essential Oil Search${colors.reset}`);
  console.log('Type an essential oil name or therapeutic property to search for similar oils.');
  console.log('Examples: "lavender", "calming oils", "muscle relaxant", "headache relief"');
  console.log('Special commands:');
  console.log('  "test" - Run predefined test queries');
  console.log('  "quit" or "exit" - Stop the session');
  console.log('');
  
  while (true) {
    try {
      const query = await askQuestion(`${colors.cyan}Search query:${colors.reset} `);
      
      if (query.toLowerCase() === 'quit' || query.toLowerCase() === 'exit') {
        log.info('Goodbye!');
        break;
      }

      if (!query.trim()) {
        log.warning('Please enter a search query');
        continue;
      }

      // Handle special commands
      if (query.toLowerCase() === 'test') {
        await runTestQueries(openai, index);
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(openai, query.trim());

      // Search Pinecone
      const results = await searchPinecone(index, embedding, 10);

      // Display results
      displayResults(results, query.trim());
      
    } catch (error) {
      log.error(`Search failed: ${error.message}`);
    }
    
    console.log(); // Add spacing
  }
  
  rl.close();
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bright}🧪 Pinecone Vector Search Test${colors.reset}`);
  console.log('='.repeat(50));
  
  try {
    // Check environment variables
    log.step('Checking environment variables...');
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'PINECONE_API_KEY', 
      'PINECONE_INDEX_NAME'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      log.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }
    
    log.success('Environment variables validated');
    
    // Initialize services
    const openai = await initializeOpenAI();
    const { index, indexName } = await initializePinecone();
    
    // Test index health
    await testIndexHealth(index, indexName);
    
    // Start interactive search
    await interactiveSearch(openai, index);
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    
    if (error.message.includes('environment variable')) {
      log.info('Make sure to set the required environment variables in your .env.local file');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  initializeOpenAI, 
  initializePinecone, 
  generateEmbedding, 
  searchPinecone, 
  displayResults 
};
