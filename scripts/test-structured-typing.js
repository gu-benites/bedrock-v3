#!/usr/bin/env node

/**
 * @file Structured Streaming Test
 * Simple test script for the /api/ai/streaming endpoint with structured output
 */

const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  endpoint: '/api/ai/streaming',
  timeout: 30000, // 30 seconds
};

// Single test case
const testCase = {
  feature: 'recipe-wizard',
  step: 'potential-causes',
  data: {
    healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.',
    demographics: {
      gender: 'female',
      ageCategory: 'adult',
      specificAge: 32,
      language: 'en'
    },
    streaming_mode: 'structured',
  }
};

// Track received data
let buffer = '';
let eventCount = 0;

console.log('Starting streaming test...\n');
console.log('Sending request to:', `${config.baseUrl}${config.endpoint}`);

// Make the streaming request
const url = new URL(config.endpoint, config.baseUrl);
const req = http.request({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  timeout: config.timeout,
  path: url.pathname,
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80)
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('--- Response Stream ---\n');

  res.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text); // Stream output directly
    buffer += text;
    
    // Process complete events
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep incomplete event in buffer
    
    events.forEach(event => {
      eventCount++;
      const lines = event.split('\n');
      const eventData = lines.find(line => line.startsWith('data: '));
      
      if (eventData) {
        try {
          const data = JSON.parse(eventData.substring(6).trim());
          if (data.event === 'structured_complete') {
            console.log('\n\n--- Stream Complete ---');
            console.log(`Total events: ${eventCount}`);
            process.exit(0);
          }
        } catch (e) {
          console.error('Error parsing event:', e);
        }
      }
    });
  });

  res.on('end', () => {
    console.log('\n--- End of Stream ---');
    process.exit(0);
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

// Send the request body
console.log('Sending request with data:', JSON.stringify(testCase, null, 2));
req.write(JSON.stringify(testCase));
req.end();

// Removed unnecessary code blocks
      process.exit(0);
    }
  }

  // If health concern is provided, use it instead of scenario
  if (options.healthConcern) {
    return {
      ...options,
      demographics: {
        gender: 'unknown',
        ageCategory: 'adult',
      },
      symptoms: {
        primary: 'custom',
        secondary: [],
        duration: 'unknown',
        severity: 'unknown',
      },
    };
  }

  // Otherwise use the selected scenario
  const scenario = testScenarios[options.scenario] || testScenarios.anxiety;
  return {
    ...options,
    healthConcern: scenario.healthConcern,
    demographics: scenario.demographics,
    symptoms: scenario.symptoms,
  };
}

// Show help information
function showHelp() {
  console.log(`\n${chalk.bold('Structured Typing Demo')}\n`);
  console.log('Usage:');
  console.log('  npm run demo:typing [options]');
  console.log('\nOptions:');
  console.log('  -s, --scenario <name>    Use a predefined test scenario');
  console.log('  -h, --health-concern <text>  Use a custom health concern');
  console.log('  -v, --verbose          Show verbose output');
  console.log('  --help                 Show this help message');
  console.log('\nAvailable scenarios:');
  Object.keys(testScenarios).forEach(key => {
    console.log(`  ${chalk.cyan(key.padEnd(10))} ${testScenarios[key].healthConcern}`);
  });
  console.log('');
}

// Clear the current line
function clearLine() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

// Type text with a typing effect
async function typeText(text, speed = config.typingSpeed) {
  if (!text) return '';
  
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text[i]);
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  return text;
}

// Format a field value with appropriate styling
function formatFieldValue(field, value) {
  if (!value) return '';
  
  const color = state.fieldColors[field] || 'white';
  const icon = state.fieldIcons[field] || '•';
  const title = state.fieldTitles[field] || field;
  
  // Format the field with appropriate indentation and wrapping
  const lines = value.split('\n');
  const formattedLines = lines.map((line, i) => {
    const prefix = i === 0 
      ? `${chalk[color].bold(icon)} ${chalk[color].bold(title + ':')} `
      : ' '.repeat(icon.length + title.length + 2);
    
    return prefix + line;
  });
  
  return formattedLines.join('\n');
}

// Update the display with new data
async function updateDisplay(data) {
  if (!data || !data.data) return;
  
  const now = Date.now();
  const cause = data.data;
  const causeId = cause.cause_id || 'unknown';
  
  // Initialize cause if it doesn't exist
  if (!state.causes[causeId]) {
    state.causes[causeId] = {
      id: causeId,
      name_localized: '',
      suggestion_localized: '',
      explanation_localized: '',
      lastUpdated: 0,
    };
  }
  
  // Update fields that have new data
  let hasUpdates = false;
  for (const field of state.fieldOrder) {
    if (cause[field] && cause[field] !== state.causes[causeId][field]) {
      // Only update if the new value is longer than the current one
      if (cause[field].length > (state.causes[causeId][field] || '').length) {
        state.causes[causeId][field] = cause[field];
        state.causes[causeId].lastUpdated = now;
        hasUpdates = true;
      }
    }
  }
  
  // If no updates, skip redrawing
  if (!hasUpdates) return;
  
  // Clear the display
  console.clear();
  console.log(chalk.bold('\n🔮 Recipe Wizard - AI Analysis\n'));
  
  // Display each cause with its fields
  const causes = Object.values(state.causes);
  
  for (const cause of causes) {
    console.log(chalk.magenta.bold(`\n📋 Potential Cause ${cause.id}:`));
    
    for (const field of state.fieldOrder) {
      if (cause[field]) {
        const value = formatFieldValue(field, cause[field]);
        console.log(`   ${value}`);
      }
    }
    
    // Add a separator between causes
    console.log('\n' + '─'.repeat(process.stdout.columns || 80) + '\n');
  }
  
  // Show a typing indicator if we're still waiting for more data
  if (data.type === 'structured_data') {
    console.log(chalk.dim('Analyzing...'));
  }
}

// Make a streaming request to the API
function makeStreamingRequest(requestData) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.endpoint, config.baseUrl);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(url, options, (res) => {
      let buffer = '';
      let eventData = null;
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Process each complete SSE event
        while (true) {
          const boundary = buffer.indexOf('\n\n');
          if (boundary === -1) break;
          
          const event = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);
          
          // Parse the SSE event
          const lines = event.split('\n');
          const eventObj = {};
          
          for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const field = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            if (value.startsWith(':')) value = value.substring(1);
            
            if (field === 'data') {
              try {
                eventObj.data = JSON.parse(value);
              } catch (e) {
                console.error('Error parsing event data:', e);
              }
            } else {
              eventObj[field] = value;
            }
          }
          
          // Process the event
          if (eventObj.event === 'structured_data') {
            updateDisplay(eventObj);
          } else if (eventObj.event === 'structured_complete') {
            console.log(chalk.green.bold('\n✅ Analysis complete!\n'));
            resolve(eventObj);
            return;
          } else if (eventObj.event === 'error') {
            console.error(chalk.red.bold('\n❌ Error:'), eventObj.data || 'Unknown error');
            reject(new Error(eventObj.data || 'Unknown error'));
            return;
          }
        }
      });
      
      res.on('end', () => {
        if (buffer.trim()) {
          console.log('Unexpected end of stream with remaining data:', buffer);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(chalk.red.bold('\n❌ Request error:'), error.message);
      reject(error);
    });
    
    // Set a timeout
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${config.timeout}ms`));
    });
    
    // Send the request
    req.write(JSON.stringify({
      ...requestData,
      streaming_mode: 'structured',
    }));
    
    req.end();
  });
}

// Main function
async function main() {
  console.clear();
  
  // Parse command line arguments
  const options = parseArgs();
  
  // Show help if requested
  if (options.help) {
    showHelp();
    return;
  }
  
  // Prepare request data
  const requestData = {
    feature: 'recipe-wizard',
    healthConcern: options.healthConcern,
    demographics: options.demographics,
    symptoms: options.symptoms,
  };
  
  // Show initial message
  console.log(chalk.bold('\n🔮 Recipe Wizard - AI Analysis\n'));
  console.log(chalk.dim('Analyzing your health concern...\n'));
  
  try {
    // Make the streaming request
    await makeStreamingRequest(requestData);
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

// Initialize and run the application
(async () => {
  try {
    // Import ESM modules
    const chalkModule = await import('chalk');
    const oraModule = await import('ora');
    
    // Set global variables
    chalk = chalkModule.default;
    ora = oraModule.default;
    
    // Start the main function
    await main();
  } catch (error) {
    console.error('Failed to load required modules:', error);
    process.exit(1);
  }
})();
