#!/usr/bin/env node

/**
 * @fileoverview Streaming Script Validation
 * Validates that the streaming test script is properly configured
 * 
 * Usage:
 *   node scripts/validate-streaming.js
 *   npm run validate:streaming
 */

const fs = require('fs');
const path = require('path');
const { testScenarios, config } = require('./test-streaming');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if Node.js modules are available
 */
function checkNodeModules() {
  const requiredModules = ['https', 'http', 'url'];
  const results = [];
  
  for (const module of requiredModules) {
    try {
      require(module);
      results.push({ module, available: true });
    } catch {
      results.push({ module, available: false });
    }
  }
  
  return results;
}

/**
 * Validate test scenarios
 */
function validateTestScenarios() {
  const results = [];
  
  for (const [scenarioName, scenarioData] of Object.entries(testScenarios)) {
    const issues = [];
    
    // Check required fields
    if (!scenarioData.healthConcern || typeof scenarioData.healthConcern !== 'string') {
      issues.push('Missing or invalid healthConcern');
    }
    
    if (!scenarioData.demographics || typeof scenarioData.demographics !== 'object') {
      issues.push('Missing or invalid demographics');
    } else {
      const demo = scenarioData.demographics;
      if (!demo.gender) issues.push('Missing demographics.gender');
      if (!demo.ageCategory) issues.push('Missing demographics.ageCategory');
      if (!demo.specificAge) issues.push('Missing demographics.specificAge');
      if (!demo.language) issues.push('Missing demographics.language');
    }
    
    results.push({
      scenario: scenarioName,
      valid: issues.length === 0,
      issues
    });
  }
  
  return results;
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  const checks = [
    {
      name: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY,
      required: true,
      description: 'Required for OpenAI API calls'
    },
    {
      name: 'NEXT_PUBLIC_APP_URL',
      value: process.env.NEXT_PUBLIC_APP_URL || config.baseUrl,
      required: false,
      description: 'API base URL (defaults to localhost:9002)'
    }
  ];
  
  return checks.map(check => ({
    ...check,
    present: !!check.value,
    masked: check.name.includes('KEY') && check.value ? 
      check.value.substring(0, 8) + '...' : check.value
  }));
}

/**
 * Display validation results
 */
function displayResults() {
  console.log(`\n${colors.bright}${colors.blue}🔍 Streaming Script Validation${colors.reset}\n`);
  
  // Check file existence
  console.log(`${colors.bright}📁 File Checks:${colors.reset}`);
  const files = [
    'scripts/test-streaming.js',
    'scripts/demo-streaming.js',
    'scripts/test-streaming.sh',
    'scripts/test-streaming.bat',
    'package.json'
  ];
  
  let allFilesExist = true;
  for (const file of files) {
    const exists = fileExists(file);
    const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`   ${status} ${file}`);
    if (!exists) allFilesExist = false;
  }
  
  // Check Node.js modules
  console.log(`\n${colors.bright}📦 Node.js Modules:${colors.reset}`);
  const moduleResults = checkNodeModules();
  let allModulesAvailable = true;
  for (const result of moduleResults) {
    const status = result.available ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`   ${status} ${result.module}`);
    if (!result.available) allModulesAvailable = false;
  }
  
  // Check environment variables
  console.log(`\n${colors.bright}🌍 Environment Variables:${colors.reset}`);
  const envResults = checkEnvironment();
  let envConfigured = true;
  for (const env of envResults) {
    const status = env.present ? `${colors.green}✓${colors.reset}` : 
      env.required ? `${colors.red}✗${colors.reset}` : `${colors.yellow}⚠${colors.reset}`;
    const value = env.present ? `${colors.dim}(${env.masked})${colors.reset}` : '';
    console.log(`   ${status} ${env.name} ${value}`);
    console.log(`      ${colors.dim}${env.description}${colors.reset}`);
    if (env.required && !env.present) envConfigured = false;
  }
  
  // Check test scenarios
  console.log(`\n${colors.bright}🧪 Test Scenarios:${colors.reset}`);
  const scenarioResults = validateTestScenarios();
  let allScenariosValid = true;
  for (const result of scenarioResults) {
    const status = result.valid ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`   ${status} ${result.scenario}`);
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        console.log(`      ${colors.red}• ${issue}${colors.reset}`);
      }
      allScenariosValid = false;
    }
  }
  
  // Check configuration
  console.log(`\n${colors.bright}⚙️  Configuration:${colors.reset}`);
  console.log(`   Base URL: ${colors.cyan}${config.baseUrl}${colors.reset}`);
  console.log(`   Endpoint: ${colors.cyan}${config.endpoint}${colors.reset}`);
  console.log(`   Timeout: ${colors.cyan}${config.timeout}ms${colors.reset}`);
  console.log(`   Retry Attempts: ${colors.cyan}${config.retryAttempts}${colors.reset}`);
  
  // Overall status
  console.log(`\n${colors.bright}📊 Overall Status:${colors.reset}`);
  const allValid = allFilesExist && allModulesAvailable && envConfigured && allScenariosValid;
  
  if (allValid) {
    console.log(`   ${colors.green}✅ All checks passed!${colors.reset}`);
    console.log(`   ${colors.dim}The streaming test script is ready to use.${colors.reset}`);
    console.log(`\n${colors.bright}🚀 Next Steps:${colors.reset}`);
    console.log(`   1. Start the development server: ${colors.cyan}npm run dev${colors.reset}`);
    console.log(`   2. Run a test: ${colors.cyan}npm run test:streaming${colors.reset}`);
    console.log(`   3. Run the demo: ${colors.cyan}npm run demo:streaming${colors.reset}`);
  } else {
    console.log(`   ${colors.red}❌ Some checks failed.${colors.reset}`);
    console.log(`   ${colors.dim}Please fix the issues above before running the streaming tests.${colors.reset}`);
    
    if (!envConfigured) {
      console.log(`\n${colors.bright}🔧 Environment Setup:${colors.reset}`);
      console.log(`   Create a ${colors.cyan}.env.local${colors.reset} file with:`);
      console.log(`   ${colors.dim}OPENAI_API_KEY=your_openai_api_key_here${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.bright}📚 Documentation:${colors.reset}`);
  console.log(`   See ${colors.cyan}scripts/README.md${colors.reset} for detailed usage instructions.`);
  
  return allValid;
}

/**
 * Main validation function
 */
function main() {
  const isValid = displayResults();
  process.exit(isValid ? 0 : 1);
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { 
  checkNodeModules, 
  validateTestScenarios, 
  checkEnvironment, 
  fileExists 
};
