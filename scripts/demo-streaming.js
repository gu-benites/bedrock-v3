#!/usr/bin/env node

/**
 * @fileoverview Streaming API Demo Script
 * Demonstrates multiple streaming scenarios in sequence
 * 
 * Usage:
 *   node scripts/demo-streaming.js
 *   npm run demo:streaming
 */

const { makeStreamingRequest, testScenarios, config } = require('./test-streaming');

// ANSI color codes
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

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display demo header
 */
function showDemoHeader() {
  console.log(`\n${colors.bright}${colors.blue}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                    🎬 STREAMING API DEMO                     ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║              Demonstrating Real-time AI Analysis             ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.dim}This demo will showcase our streaming API with multiple health scenarios.${colors.reset}`);
  console.log(`${colors.dim}Each scenario demonstrates real-time AI analysis for potential causes.${colors.reset}\n`);
}

/**
 * Display scenario header
 */
function showScenarioHeader(scenarioName, scenarioData, index, total) {
  console.log(`\n${colors.bright}${colors.magenta}┌─ Scenario ${index}/${total}: ${scenarioName.toUpperCase().replace('-', ' ')} ─┐${colors.reset}`);
  console.log(`${colors.cyan}Health Concern:${colors.reset} "${scenarioData.healthConcern}"`);
  console.log(`${colors.cyan}Demographics:${colors.reset} ${scenarioData.demographics.gender}, ${scenarioData.demographics.ageCategory} (${scenarioData.demographics.specificAge})`);
  console.log(`${colors.bright}${colors.magenta}└${'─'.repeat(60)}┘${colors.reset}\n`);
}

/**
 * Display scenario results summary
 */
function showScenarioResults(result, scenarioName) {
  console.log(`\n${colors.bright}${colors.green}📊 Results Summary for ${scenarioName}:${colors.reset}`);
  
  if (result.finalData && Array.isArray(result.finalData)) {
    console.log(`   ${colors.green}✓${colors.reset} Found ${colors.yellow}${result.finalData.length}${colors.reset} potential causes`);
    console.log(`   ${colors.green}✓${colors.reset} Streaming completed in ${colors.yellow}${(result.stats.streamingDuration / 1000).toFixed(1)}s${colors.reset}`);
    console.log(`   ${colors.green}✓${colors.reset} Received ${colors.yellow}${result.stats.chunkCount}${colors.reset} chunks (${colors.yellow}${result.stats.totalBytes}${colors.reset} bytes)`);
    
    console.log(`\n   ${colors.bright}Top Potential Causes:${colors.reset}`);
    result.finalData.slice(0, 3).forEach((cause, index) => {
      console.log(`   ${index + 1}. ${colors.cyan}${cause.name_localized || cause.name}${colors.reset}`);
    });
  } else {
    console.log(`   ${colors.yellow}⚠${colors.reset} Unexpected response format`);
  }
}

/**
 * Run demo for a single scenario
 */
async function runScenarioDemo(scenarioName, scenarioData, index, total) {
  showScenarioHeader(scenarioName, scenarioData, index, total);

  const requestData = {
    feature: 'recipe-wizard',
    step: 'potential-causes',
    data: scenarioData
  };

  try {
    console.log(`${colors.blue}🔗 Connecting to streaming API...${colors.reset}`);
    const result = await makeStreamingRequest(requestData, { verbose: false });
    showScenarioResults(result, scenarioName);
    return true;
  } catch (error) {
    console.log(`\n${colors.red}❌ Scenario failed:${colors.reset}`);
    console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);

    // Show more detailed error information
    if (error.message.includes('ECONNREFUSED')) {
      console.log(`   ${colors.yellow}💡 Tip: Make sure the development server is running with 'npm run dev'${colors.reset}`);
    } else if (error.message.includes('API key')) {
      console.log(`   ${colors.yellow}💡 Tip: Set OPENAI_API_KEY in your .env.local file${colors.reset}`);
    } else if (error.message.includes('timeout')) {
      console.log(`   ${colors.yellow}💡 Tip: The request timed out. Try again or check your internet connection${colors.reset}`);
    } else if (error.message.includes('404') || error.message.includes('500')) {
      console.log(`   ${colors.yellow}💡 Tip: Check if the /api/ai/streaming endpoint exists and is working${colors.reset}`);
    }

    console.log(`   ${colors.dim}Full error: ${error.stack || error.toString()}${colors.reset}`);
    return false;
  }
}

/**
 * Display demo summary
 */
function showDemoSummary(results) {
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n${colors.bright}${colors.blue}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                      📈 DEMO SUMMARY                         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.bright}Overall Results:${colors.reset}`);
  console.log(`   Scenarios Completed: ${colors.green}${successful}${colors.reset}/${colors.yellow}${total}${colors.reset}`);
  console.log(`   Success Rate: ${colors.green}${Math.round((successful / total) * 100)}%${colors.reset}`);
  
  console.log(`\n${colors.bright}Scenario Details:${colors.reset}`);
  results.forEach((result, index) => {
    const status = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const duration = result.duration ? `${colors.dim}(${(result.duration / 1000).toFixed(1)}s)${colors.reset}` : '';
    console.log(`   ${status} ${result.scenario} ${duration}`);
  });
  
  if (successful === total) {
    console.log(`\n${colors.green}🎉 All scenarios completed successfully!${colors.reset}`);
    console.log(`${colors.dim}The streaming API is working correctly across all test cases.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some scenarios failed.${colors.reset}`);
    console.log(`${colors.dim}Check the error messages above for troubleshooting.${colors.reset}`);
  }
}

/**
 * Main demo execution
 */
async function runDemo() {
  showDemoHeader();
  
  // Check if server is running
  console.log(`${colors.blue}🔍 Checking server availability...${colors.reset}`);
  try {
    await makeStreamingRequest({
      feature: 'recipe-wizard',
      step: 'potential-causes',
      data: {
        healthConcern: 'test',
        demographics: { gender: 'female', ageCategory: 'adult', specificAge: 30, language: 'en' }
      }
    }, { verbose: false });
  } catch (error) {
    console.log(`${colors.red}❌ Server connectivity check failed${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}Please make sure the Next.js development server is running:${colors.reset}`);
      console.log(`${colors.cyan}npm run dev${colors.reset}`);
    } else if (error.message.includes('API key')) {
      console.log(`${colors.yellow}Please set your OpenAI API key in .env.local:${colors.reset}`);
      console.log(`${colors.cyan}OPENAI_API_KEY=your_key_here${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Unexpected error. Full details:${colors.reset}`);
      console.log(`${colors.dim}${error.stack || error.toString()}${colors.reset}`);
    }

    console.log(`\n${colors.yellow}You can also run a single test to debug:${colors.reset}`);
    console.log(`${colors.cyan}npm run test:streaming -- --verbose${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Server is responding${colors.reset}\n`);
  
  const scenarios = Object.keys(testScenarios);
  const results = [];
  
  console.log(`${colors.bright}Running ${scenarios.length} streaming scenarios...${colors.reset}\n`);
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenarioName = scenarios[i];
    const scenarioData = testScenarios[scenarioName];
    
    console.log(`${colors.dim}${'═'.repeat(70)}${colors.reset}`);
    
    const startTime = Date.now();
    const success = await runScenarioDemo(scenarioName, scenarioData, i + 1, scenarios.length);
    const duration = Date.now() - startTime;
    
    results.push({
      scenario: scenarioName,
      success,
      duration
    });
    
    // Add delay between scenarios for better readability
    if (i < scenarios.length - 1) {
      console.log(`\n${colors.dim}Waiting 2 seconds before next scenario...${colors.reset}`);
      await sleep(2000);
    }
  }
  
  console.log(`${colors.dim}${'═'.repeat(70)}${colors.reset}`);
  
  showDemoSummary(results);
  
  console.log(`\n${colors.bright}${colors.blue}Demo completed!${colors.reset}`);
  console.log(`${colors.dim}You can run individual scenarios with:${colors.reset}`);
  console.log(`${colors.cyan}npm run test:streaming -- --scenario <scenario-name>${colors.reset}\n`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}⚠️  Demo interrupted by user${colors.reset}`);
  process.exit(0);
});

// Run the demo
if (require.main === module) {
  runDemo().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = { runDemo };
