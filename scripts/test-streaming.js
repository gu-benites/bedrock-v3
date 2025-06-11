#!/usr/bin/env node

/**
 * @fileoverview Streaming API Test Script
 * Demonstrates the /api/ai/streaming endpoint with real-time response display
 * 
 * Usage:
 *   node scripts/test-streaming.js
 *   npm run test:streaming
 *   npm run test:streaming -- --health-concern "I have chronic headaches"
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  endpoint: '/api/ai/streaming',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

// Test data scenarios
const testScenarios = {
  'chronic-anxiety': {
    healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.',
    demographics: {
      gender: 'female',
      ageCategory: 'adult',
      specificAge: 32,
      language: 'en'
    }
  },
  'digestive-issues': {
    healthConcern: 'I have frequent digestive problems including bloating, stomach pain, and irregular bowel movements.',
    demographics: {
      gender: 'male',
      ageCategory: 'adult',
      specificAge: 28,
      language: 'en'
    }
  },
  'chronic-headaches': {
    healthConcern: 'I suffer from chronic headaches and migraines that occur several times per week.',
    demographics: {
      gender: 'female',
      ageCategory: 'adult',
      specificAge: 45,
      language: 'en'
    }
  },
  'sleep-problems': {
    healthConcern: 'I have trouble falling asleep and staying asleep, often waking up feeling tired.',
    demographics: {
      gender: 'male',
      ageCategory: 'senior',
      specificAge: 65,
      language: 'en'
    }
  }
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    healthConcern: null,
    scenario: 'chronic-anxiety',
    verbose: false,
    help: false,
    streamingMode: 'auto' // 'auto', 'text', 'hybrid', 'structured'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--health-concern':
      case '-h':
        options.healthConcern = args[++i];
        break;
      case '--scenario':
      case '-s':
        options.scenario = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--streaming-mode':
      case '-m':
        options.streamingMode = args[++i];
        break;
      case '--help':
        options.help = true;
        break;
      case '--list-scenarios':
        console.log('\nAvailable test scenarios:');
        Object.keys(testScenarios).forEach(key => {
          console.log(`  ${colors.cyan}${key}${colors.reset}: ${testScenarios[key].healthConcern}`);
        });
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}Streaming API Test Script${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node scripts/test-streaming.js [options]
  npm run test:streaming [-- options]

${colors.yellow}Options:${colors.reset}
  -h, --health-concern <text>    Custom health concern text
  -s, --scenario <name>          Use predefined scenario (default: chronic-anxiety)
  -v, --verbose                  Show detailed request/response information
  -m, --streaming-mode <mode>    Streaming mode: auto, text, hybrid, structured (default: auto)
  --list-scenarios               List all available test scenarios
  --help                         Show this help message

${colors.yellow}Examples:${colors.reset}
  npm run test:streaming
  npm run test:streaming -- --scenario digestive-issues
  npm run test:streaming -- --health-concern "I have joint pain"
  npm run test:streaming -- --verbose

${colors.yellow}Available Scenarios:${colors.reset}
${Object.keys(testScenarios).map(key => 
  `  ${colors.cyan}${key}${colors.reset}: ${testScenarios[key].healthConcern.substring(0, 60)}...`
).join('\n')}
`);
}

/**
 * Create animated typing indicator
 */
function createTypingIndicator() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  
  return setInterval(() => {
    process.stdout.write(`\r${colors.blue}${frames[frameIndex]} Analyzing...${colors.reset}`);
    frameIndex = (frameIndex + 1) % frames.length;
  }, 100);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Log with timestamp and color
 */
function log(message, color = colors.reset, prefix = '') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${prefix}${color}${message}${colors.reset}`);
}

/**
 * Make streaming request to the API
 */
function makeStreamingRequest(requestData, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.endpoint, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const postData = JSON.stringify(requestData);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      timeout: config.timeout
    };

    if (options.verbose) {
      log(`Making request to: ${url.toString()}`, colors.blue);
      log(`Request data: ${JSON.stringify(requestData, null, 2)}`, colors.dim);
    }

    const startTime = Date.now();
    let firstChunkTime = null;
    let chunkCount = 0;
    let totalBytes = 0;
    let streamingText = '';
    let typingIndicator = null;

    const req = httpModule.request(requestOptions, (res) => {
      if (options.verbose) {
        log(`Response status: ${res.statusCode}`, colors.blue);
        log(`Response headers: ${JSON.stringify(res.headers, null, 2)}`, colors.dim);
      }

      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          try {
            const error = JSON.parse(errorData);
            reject(new Error(`API Error (${res.statusCode}): ${error.error || error.message || 'Unknown error'}`));
          } catch {
            reject(new Error(`HTTP Error ${res.statusCode}: ${errorData || res.statusMessage}`));
          }
        });
        return;
      }

      // Start typing indicator
      typingIndicator = createTypingIndicator();

      res.on('data', (chunk) => {
        if (!firstChunkTime) {
          firstChunkTime = Date.now();
          clearInterval(typingIndicator);
          process.stdout.write('\r' + ' '.repeat(20) + '\r'); // Clear typing indicator
          log('Streaming started', colors.green, '🚀 ');
        }

        chunkCount++;
        totalBytes += chunk.length;
        
        const chunkStr = chunk.toString();
        
        if (options.verbose) {
          log(`Chunk ${chunkCount} (${chunk.length} bytes): ${chunkStr.substring(0, 100)}...`, colors.dim);
        }

        // Parse SSE data
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'text_chunk' && data.content) {
                streamingText += data.content;
                // Display streaming text with word wrapping (only in hybrid/text modes)
                if (options.streamingMode !== 'structured') {
                  process.stdout.write(colors.cyan + data.content + colors.reset);
                }
              } else if (data.type === 'structured_data' && data.field === 'potential_causes') {
                // Handle bulletproof structured streaming - show individual potential causes with all fields
                process.stdout.write(`\n${colors.green}📋 Potential Cause ${data.index + 1}:${colors.reset} `);
                process.stdout.write(`${colors.bright}${data.data.name_localized || data.data.name}${colors.reset}\n`);

                // Show suggestion if available
                if (data.data.suggestion_localized) {
                  process.stdout.write(`   ${colors.cyan}💡 Suggestion:${colors.reset} ${colors.dim}${data.data.suggestion_localized}${colors.reset}\n`);
                }

                // Show explanation if available
                if (data.data.explanation_localized) {
                  process.stdout.write(`   ${colors.yellow}📖 Explanation:${colors.reset} ${colors.dim}${data.data.explanation_localized}${colors.reset}\n`);
                }

                // Show all available fields in verbose mode
                if (options.verbose) {
                  process.stdout.write(`   ${colors.dim}[ID: ${data.data.cause_id}]${colors.reset}\n`);
                  if (data.timestamp) {
                    process.stdout.write(`   ${colors.dim}[${data.timestamp}]${colors.reset}\n`);
                  }
                }
              } else if (data.type === 'structured_complete' && data.data) {
                process.stdout.write('\n\n');
                log('Bulletproof structured streaming completed', colors.green, '✅ ');

                const endTime = Date.now();
                const totalDuration = endTime - startTime;
                const streamingDuration = endTime - firstChunkTime;

                console.log(`\n${colors.bright}📊 Bulletproof Streaming Statistics:${colors.reset}`);
                console.log(`   Total Duration: ${colors.yellow}${formatDuration(totalDuration)}${colors.reset}`);
                console.log(`   Streaming Duration: ${colors.yellow}${formatDuration(streamingDuration)}${colors.reset}`);
                console.log(`   Time to First Chunk: ${colors.yellow}${formatDuration(firstChunkTime - startTime)}${colors.reset}`);
                console.log(`   Chunks Received: ${colors.yellow}${chunkCount}${colors.reset}`);
                console.log(`   Total Bytes: ${colors.yellow}${totalBytes}${colors.reset}`);
                console.log(`   Average Chunk Size: ${colors.yellow}${Math.round(totalBytes / chunkCount)} bytes${colors.reset}`);

                // Show server-side stats if available
                if (data.stats) {
                  console.log(`\n${colors.bright}📈 Server-Side Statistics:${colors.reset}`);
                  if (data.stats.totalChunksProcessed) {
                    console.log(`   Server Chunks Processed: ${colors.cyan}${data.stats.totalChunksProcessed}${colors.reset}`);
                  }
                  if (data.stats.totalItemsSent) {
                    console.log(`   Structured Items Sent: ${colors.cyan}${data.stats.totalItemsSent}${colors.reset}`);
                  }
                  if (data.stats.finalTextLength) {
                    console.log(`   Final Text Length: ${colors.cyan}${data.stats.finalTextLength} chars${colors.reset}`);
                  }
                }

                resolve({
                  streamingText,
                  finalData: data.data.data?.potential_causes || data.data,
                  stats: {
                    totalDuration,
                    streamingDuration,
                    timeToFirstChunk: firstChunkTime - startTime,
                    chunkCount,
                    totalBytes,
                    serverStats: data.stats
                  }
                });
              } else if (data.type === 'completion' && data.final_data) {
                process.stdout.write('\n\n');
                log('Streaming completed', colors.green, '✅ ');
                
                const endTime = Date.now();
                const totalDuration = endTime - startTime;
                const streamingDuration = endTime - firstChunkTime;
                
                console.log(`\n${colors.bright}📊 Streaming Statistics:${colors.reset}`);
                console.log(`   Total Duration: ${colors.yellow}${formatDuration(totalDuration)}${colors.reset}`);
                console.log(`   Streaming Duration: ${colors.yellow}${formatDuration(streamingDuration)}${colors.reset}`);
                console.log(`   Time to First Chunk: ${colors.yellow}${formatDuration(firstChunkTime - startTime)}${colors.reset}`);
                console.log(`   Chunks Received: ${colors.yellow}${chunkCount}${colors.reset}`);
                console.log(`   Total Bytes: ${colors.yellow}${totalBytes}${colors.reset}`);
                console.log(`   Average Chunk Size: ${colors.yellow}${Math.round(totalBytes / chunkCount)} bytes${colors.reset}`);
                
                resolve({
                  streamingText,
                  finalData: data.final_data,
                  stats: {
                    totalDuration,
                    streamingDuration,
                    timeToFirstChunk: firstChunkTime - startTime,
                    chunkCount,
                    totalBytes
                  }
                });
              } else if (data.type === 'error') {
                process.stdout.write('\n');

                // Enhanced error reporting
                let errorMessage = `Streaming error: ${data.error}`;
                if (data.mode) {
                  errorMessage += ` (Mode: ${data.mode})`;
                }
                if (data.traceId) {
                  errorMessage += ` (Trace: ${data.traceId})`;
                }
                if (data.recovery) {
                  errorMessage += `\n   Recovery: ${data.recovery}`;
                }

                reject(new Error(errorMessage));
              }
            } catch (parseError) {
              if (options.verbose) {
                log(`Failed to parse SSE data: ${line}`, colors.yellow);
              }
            }
          }
        }
      });

      res.on('end', () => {
        if (typingIndicator) {
          clearInterval(typingIndicator);
          process.stdout.write('\r' + ' '.repeat(20) + '\r');
        }
        
        if (!firstChunkTime) {
          reject(new Error('No streaming data received'));
        }
      });

      res.on('error', (error) => {
        if (typingIndicator) {
          clearInterval(typingIndicator);
          process.stdout.write('\r' + ' '.repeat(20) + '\r');
        }
        reject(error);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  console.log(`\n${colors.bright}🧪 Streaming API Test${colors.reset}`);
  console.log(`${colors.dim}Testing endpoint: ${config.baseUrl}${config.endpoint}${colors.reset}\n`);

  // Prepare test data
  let testData;
  if (options.healthConcern) {
    testData = {
      healthConcern: options.healthConcern,
      demographics: testScenarios['chronic-anxiety'].demographics // Use default demographics
    };
  } else {
    if (!testScenarios[options.scenario]) {
      console.error(`${colors.red}Error: Unknown scenario "${options.scenario}"${colors.reset}`);
      console.log('Use --list-scenarios to see available options');
      process.exit(1);
    }
    testData = testScenarios[options.scenario];
  }

  const requestData = {
    feature: 'recipe-wizard',
    step: 'potential-causes',
    data: testData,
    streamingMode: options.streamingMode
  };

  // Display test information
  console.log(`${colors.bright}📋 Test Configuration:${colors.reset}`);
  console.log(`   Health Concern: ${colors.cyan}"${testData.healthConcern}"${colors.reset}`);
  console.log(`   Demographics: ${colors.dim}${testData.demographics.gender}, ${testData.demographics.ageCategory} (${testData.demographics.specificAge})${colors.reset}`);
  console.log(`   Language: ${colors.dim}${testData.demographics.language}${colors.reset}`);
  console.log(`   Streaming Mode: ${colors.yellow}${options.streamingMode}${colors.reset}\n`);

  // Make the streaming request
  try {
    log('Connecting to streaming API...', colors.blue, '🔗 ');
    
    const result = await makeStreamingRequest(requestData, options);
    
    console.log(`\n${colors.bright}🎯 Final Results:${colors.reset}`);
    if (result.finalData && Array.isArray(result.finalData)) {
      console.log(`   Potential Causes Found: ${colors.green}${result.finalData.length}${colors.reset}`);
      result.finalData.forEach((cause, index) => {
        console.log(`   ${index + 1}. ${colors.cyan}${cause.name_localized || cause.name}${colors.reset}`);
        if (cause.suggestion_localized || cause.description) {
          console.log(`      ${colors.dim}${cause.suggestion_localized || cause.description}${colors.reset}`);
        }
      });
    } else {
      console.log(`   Raw Response: ${colors.dim}${JSON.stringify(result.finalData, null, 2)}${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✅ Test completed successfully!${colors.reset}\n`);
    
  } catch (error) {
    console.log(`\n${colors.red}❌ Test failed:${colors.reset}`);
    console.log(`   ${colors.red}${error.message}${colors.reset}\n`);
    
    if (options.verbose) {
      console.log(`${colors.dim}Stack trace:${colors.reset}`);
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}⚠️  Test interrupted by user${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n\n${colors.yellow}⚠️  Test terminated${colors.reset}`);
  process.exit(0);
});

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = { makeStreamingRequest, testScenarios, config };
