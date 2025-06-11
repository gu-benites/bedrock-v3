#!/usr/bin/env node

/**
 * Backward Compatibility Integration Test
 * Tests that both original and streaming AI services work independently
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test configuration
const TEST_CONFIG = {
  originalEndpoint: 'http://localhost:9002/api/recipe-wizard',
  streamingEndpoint: 'http://localhost:9002/api/ai/streaming',
  healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.',
  demographics: {
    gender: 'female',
    ageCategory: 'adult',
    specificAge: 32,
    language: 'en'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset, prefix = '') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix}${color}${message}${colors.reset}`);
}

/**
 * Test the original AI service (non-streaming)
 */
async function testOriginalAIService() {
  console.log(`\n${colors.bright}🔄 Testing Original AI Service (Non-Streaming)${colors.reset}`);
  console.log(`Endpoint: ${colors.cyan}${TEST_CONFIG.originalEndpoint}${colors.reset}\n`);

  return new Promise((resolve, reject) => {
    try {
      const requestData = {
        healthConcern: { healthConcern: TEST_CONFIG.healthConcern },
        demographics: TEST_CONFIG.demographics
      };

      console.log(`Request data:`, JSON.stringify(requestData, null, 2));

      const url = new URL(TEST_CONFIG.originalEndpoint);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const startTime = Date.now();
      
      const req = client.request(requestOptions, (res) => {
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(responseData);
            const duration = Date.now() - startTime;

            console.log(`\n${colors.green}✅ Original AI Service Response:${colors.reset}`);
            console.log(`   Duration: ${colors.yellow}${duration}ms${colors.reset}`);
            console.log(`   Success: ${colors.yellow}${data.success}${colors.reset}`);
            console.log(`   Potential Causes: ${colors.yellow}${data.data?.length || 0}${colors.reset}`);

            if (data.success && data.data && Array.isArray(data.data)) {
              console.log(`\n${colors.bright}📋 Original Service Results:${colors.reset}`);
              data.data.forEach((cause, index) => {
                console.log(`   ${index + 1}. ${cause.name_localized}`);
                console.log(`      ${colors.dim}${cause.suggestion_localized}${colors.reset}`);
              });

              resolve({
                success: true,
                service: 'original',
                duration,
                causesCount: data.data.length,
                data: data.data
              });
            } else {
              reject(new Error('Invalid response format from original service'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });

        res.on('error', (error) => {
          reject(new Error(`Response error: ${error.message}`));
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.write(JSON.stringify(requestData));
      req.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Test the streaming AI service
 */
async function testStreamingAIService() {
  console.log(`\n${colors.bright}🚀 Testing Streaming AI Service${colors.reset}`);
  console.log(`Endpoint: ${colors.cyan}${TEST_CONFIG.streamingEndpoint}${colors.reset}\n`);

  return new Promise((resolve, reject) => {
    try {
      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: TEST_CONFIG.healthConcern,
          demographics: TEST_CONFIG.demographics
        },
        streamingMode: 'structured'
      };

      console.log(`Request data:`, JSON.stringify(requestData, null, 2));

      const url = new URL(TEST_CONFIG.streamingEndpoint);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const startTime = Date.now();
      let firstChunkTime = 0;
      let potentialCauses = [];
      
      const req = client.request(requestOptions, (res) => {
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        res.on('data', (chunk) => {
          if (firstChunkTime === 0) {
            firstChunkTime = Date.now();
          }

          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.type === 'structured_data' && data.field === 'potential_causes') {
                  potentialCauses.push(data.data);
                } else if (data.type === 'structured_complete') {
                  const duration = Date.now() - startTime;
                  const streamingDuration = Date.now() - firstChunkTime;

                  console.log(`\n${colors.green}✅ Streaming AI Service Response:${colors.reset}`);
                  console.log(`   Total Duration: ${colors.yellow}${duration}ms${colors.reset}`);
                  console.log(`   Streaming Duration: ${colors.yellow}${streamingDuration}ms${colors.reset}`);
                  console.log(`   Potential Causes: ${colors.yellow}${potentialCauses.length}${colors.reset}`);

                  console.log(`\n${colors.bright}📋 Streaming Service Results:${colors.reset}`);
                  potentialCauses.forEach((cause, index) => {
                    console.log(`   ${index + 1}. ${cause.name_localized}`);
                    console.log(`      ${colors.dim}${cause.suggestion_localized}${colors.reset}`);
                  });

                  resolve({
                    success: true,
                    service: 'streaming',
                    duration,
                    streamingDuration,
                    causesCount: potentialCauses.length,
                    data: potentialCauses
                  });
                } else if (data.type === 'error') {
                  reject(new Error(`Streaming error: ${data.error}`));
                }
              } catch (parseError) {
                // Expected during streaming
              }
            }
          }
        });

        res.on('end', () => {
          if (potentialCauses.length === 0) {
            reject(new Error('No potential causes received from streaming service'));
          }
        });

        res.on('error', (error) => {
          reject(new Error(`Response error: ${error.message}`));
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.write(JSON.stringify(requestData));
      req.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Compare results from both services
 */
function compareResults(originalResult, streamingResult) {
  console.log(`\n${colors.bright}🔍 Comparing Results${colors.reset}`);
  
  const comparison = {
    bothSuccessful: originalResult.success && streamingResult.success,
    causesCountMatch: originalResult.causesCount === streamingResult.causesCount,
    performanceComparison: {
      original: originalResult.duration,
      streaming: streamingResult.duration,
      streamingAdvantage: streamingResult.streamingDuration
    }
  };

  console.log(`   Both Successful: ${comparison.bothSuccessful ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  console.log(`   Causes Count Match: ${comparison.causesCountMatch ? colors.green + '✅' : colors.yellow + '⚠️'}${colors.reset}`);
  console.log(`   Original Duration: ${colors.cyan}${comparison.performanceComparison.original}ms${colors.reset}`);
  console.log(`   Streaming Total: ${colors.cyan}${comparison.performanceComparison.streaming}ms${colors.reset}`);
  console.log(`   Streaming Advantage: ${colors.cyan}${comparison.performanceComparison.streamingAdvantage}ms real-time${colors.reset}`);

  // Check data structure compatibility
  if (originalResult.data && streamingResult.data && originalResult.data.length > 0 && streamingResult.data.length > 0) {
    const originalCause = originalResult.data[0];
    const streamingCause = streamingResult.data[0];
    
    const structureMatch = 
      originalCause.cause_id && streamingCause.cause_id &&
      originalCause.name_localized && streamingCause.name_localized &&
      originalCause.suggestion_localized && streamingCause.suggestion_localized &&
      originalCause.explanation_localized && streamingCause.explanation_localized;

    console.log(`   Data Structure Match: ${structureMatch ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
    comparison.structureMatch = structureMatch;
  }

  return comparison;
}

/**
 * Main test execution
 */
async function main() {
  console.log(`\n${colors.bright}🧪 Backward Compatibility Integration Test${colors.reset}`);
  console.log(`Testing both original and streaming AI services\n`);

  try {
    // Test original service
    const originalResult = await testOriginalAIService();
    
    // Test streaming service
    const streamingResult = await testStreamingAIService();
    
    // Compare results
    const comparison = compareResults(originalResult, streamingResult);
    
    console.log(`\n${colors.bright}📊 Final Assessment:${colors.reset}`);
    
    if (comparison.bothSuccessful && comparison.structureMatch) {
      console.log(`${colors.green}✅ BACKWARD COMPATIBILITY: PERFECT!${colors.reset}`);
      console.log(`   - Original service: Working ✅`);
      console.log(`   - Streaming service: Working ✅`);
      console.log(`   - Data compatibility: Perfect ✅`);
      console.log(`   - No conflicts detected ✅`);
      
      if (comparison.causesCountMatch) {
        console.log(`   - Results consistency: Excellent ✅`);
      } else {
        console.log(`   - Results consistency: Good (different AI responses) ⚠️`);
      }
      
      console.log(`\n${colors.bright}🎉 Both services are working independently and correctly!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ BACKWARD COMPATIBILITY: ISSUES DETECTED${colors.reset}`);
      if (!comparison.bothSuccessful) {
        console.log(`   - Service failures detected`);
      }
      if (!comparison.structureMatch) {
        console.log(`   - Data structure incompatibility`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Backward compatibility test failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the test
main();
