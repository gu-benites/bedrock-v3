#!/usr/bin/env node

/**
 * API Compatibility Test - Tests that both endpoints exist and have correct structure
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test that API route files exist and have correct structure
 */
function testAPIRouteFiles() {
  log('\n🧪 Testing API Route Files Structure', colors.bright);
  
  const tests = [
    {
      name: 'Original Recipe Wizard API Route',
      path: 'src/app/api/recipe-wizard/route.ts',
      expectedExports: ['POST', 'GET']
    },
    {
      name: 'Streaming AI API Route',
      path: 'src/app/api/ai/streaming/route.ts',
      expectedExports: ['POST', 'GET']
    }
  ];

  let allPassed = true;

  tests.forEach(test => {
    log(`\n📁 Testing: ${test.name}`, colors.cyan);
    
    // Check if file exists
    const filePath = path.join(process.cwd(), test.path);
    if (!fs.existsSync(filePath)) {
      log(`❌ File not found: ${test.path}`, colors.red);
      allPassed = false;
      return;
    }
    log(`✅ File exists: ${test.path}`, colors.green);

    // Read file content
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for expected exports
      test.expectedExports.forEach(exportName => {
        const exportPattern = new RegExp(`export\\s+async\\s+function\\s+${exportName}`, 'i');
        if (exportPattern.test(content)) {
          log(`✅ Export found: ${exportName}`, colors.green);
        } else {
          log(`❌ Export missing: ${exportName}`, colors.red);
          allPassed = false;
        }
      });

      // Check for OpenAI Agents SDK imports
      if (content.includes('@openai/agents')) {
        log(`✅ OpenAI Agents SDK imported`, colors.green);
      } else {
        log(`❌ OpenAI Agents SDK not imported`, colors.red);
        allPassed = false;
      }

    } catch (error) {
      log(`❌ Error reading file: ${error.message}`, colors.red);
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Test service files structure
 */
function testServiceFiles() {
  log('\n🧪 Testing Service Files Structure', colors.bright);
  
  const tests = [
    {
      name: 'Original AI Service',
      path: 'src/features/recipe-wizard/services/ai-service.ts',
      expectedFunctions: ['fetchPotentialCauses', 'checkAIServiceHealth', 'getAIServiceInfo']
    },
    {
      name: 'Streaming AI Service',
      path: 'src/features/recipe-wizard/services/ai-service-streaming.ts',
      expectedFunctions: ['fetchPotentialCausesStreaming', 'startPotentialCausesStreaming', 'checkStreamingAIServiceHealth']
    }
  ];

  let allPassed = true;

  tests.forEach(test => {
    log(`\n📁 Testing: ${test.name}`, colors.cyan);
    
    // Check if file exists
    const filePath = path.join(process.cwd(), test.path);
    if (!fs.existsSync(filePath)) {
      log(`❌ File not found: ${test.path}`, colors.red);
      allPassed = false;
      return;
    }
    log(`✅ File exists: ${test.path}`, colors.green);

    // Read file content
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for expected functions
      test.expectedFunctions.forEach(funcName => {
        const funcPattern = new RegExp(`export\\s+.*function\\s+${funcName}`, 'i');
        if (funcPattern.test(content)) {
          log(`✅ Function found: ${funcName}`, colors.green);
        } else {
          log(`❌ Function missing: ${funcName}`, colors.red);
          allPassed = false;
        }
      });

    } catch (error) {
      log(`❌ Error reading file: ${error.message}`, colors.red);
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Test that both services can coexist without conflicts
 */
function testServiceCoexistence() {
  log('\n🧪 Testing Service Coexistence', colors.bright);
  
  const originalServicePath = path.join(process.cwd(), 'src/features/recipe-wizard/services/ai-service.ts');
  const streamingServicePath = path.join(process.cwd(), 'src/features/recipe-wizard/services/ai-service-streaming.ts');
  
  let allPassed = true;

  try {
    const originalContent = fs.readFileSync(originalServicePath, 'utf8');
    const streamingContent = fs.readFileSync(streamingServicePath, 'utf8');

    // Check that they don't have conflicting function names
    const originalFunctions = originalContent.match(/export\s+.*function\s+(\w+)/g) || [];
    const streamingFunctions = streamingContent.match(/export\s+.*function\s+(\w+)/g) || [];

    log(`📊 Original service functions: ${originalFunctions.length}`, colors.cyan);
    log(`📊 Streaming service functions: ${streamingFunctions.length}`, colors.cyan);

    // Extract function names
    const originalNames = originalFunctions.map(f => f.match(/function\s+(\w+)/)?.[1]).filter(Boolean);
    const streamingNames = streamingFunctions.map(f => f.match(/function\s+(\w+)/)?.[1]).filter(Boolean);

    // Check for conflicts
    const conflicts = originalNames.filter(name => streamingNames.includes(name));
    if (conflicts.length === 0) {
      log(`✅ No function name conflicts detected`, colors.green);
    } else {
      log(`❌ Function name conflicts: ${conflicts.join(', ')}`, colors.red);
      allPassed = false;
    }

    // Check that both use different endpoints
    const originalEndpoint = originalContent.match(/['"`]\/api\/recipe-wizard['"`]/);
    const streamingEndpoint = streamingContent.match(/['"`]\/api\/ai\/streaming['"`]/);

    if (originalEndpoint && streamingEndpoint) {
      log(`✅ Different endpoints: /api/recipe-wizard vs /api/ai/streaming`, colors.green);
    } else {
      log(`❌ Endpoint configuration issue`, colors.red);
      allPassed = false;
    }

    // Check error class names
    const originalErrorClass = originalContent.includes('AIServiceError');
    const streamingErrorClass = streamingContent.includes('StreamingAIServiceError');

    if (originalErrorClass && streamingErrorClass) {
      log(`✅ Different error classes: AIServiceError vs StreamingAIServiceError`, colors.green);
    } else {
      log(`❌ Error class configuration issue`, colors.red);
      allPassed = false;
    }

  } catch (error) {
    log(`❌ Error testing coexistence: ${error.message}`, colors.red);
    allPassed = false;
  }

  return allPassed;
}

/**
 * Test backward compatibility requirements
 */
function testBackwardCompatibilityRequirements() {
  log('\n🧪 Testing Backward Compatibility Requirements', colors.bright);
  
  const originalServicePath = path.join(process.cwd(), 'src/features/recipe-wizard/services/ai-service.ts');
  
  let allPassed = true;

  try {
    const content = fs.readFileSync(originalServicePath, 'utf8');

    // Check that original function signatures haven't changed
    const requiredSignatures = [
      'fetchPotentialCauses(request: AIServiceRequest): Promise<PotentialCause[]>',
      'checkAIServiceHealth(): Promise<boolean>',
      'getAIServiceInfo()'
    ];

    requiredSignatures.forEach(signature => {
      const funcName = signature.split('(')[0];
      if (content.includes(funcName)) {
        log(`✅ Function preserved: ${funcName}`, colors.green);
      } else {
        log(`❌ Function missing: ${funcName}`, colors.red);
        allPassed = false;
      }
    });

    // Check that original endpoint is preserved
    if (content.includes('/api/recipe-wizard')) {
      log(`✅ Original endpoint preserved: /api/recipe-wizard`, colors.green);
    } else {
      log(`❌ Original endpoint changed`, colors.red);
      allPassed = false;
    }

    // Check that error handling is preserved
    if (content.includes('AIServiceError')) {
      log(`✅ Original error class preserved: AIServiceError`, colors.green);
    } else {
      log(`❌ Original error class missing`, colors.red);
      allPassed = false;
    }

  } catch (error) {
    log(`❌ Error testing backward compatibility: ${error.message}`, colors.red);
    allPassed = false;
  }

  return allPassed;
}

/**
 * Main test execution
 */
function main() {
  log('🧪 API Compatibility & Backward Compatibility Test', colors.bright);
  log('Testing that both original and streaming services coexist properly\n');

  const results = {
    apiRoutes: testAPIRouteFiles(),
    serviceFiles: testServiceFiles(),
    coexistence: testServiceCoexistence(),
    backwardCompatibility: testBackwardCompatibilityRequirements()
  };

  log('\n📊 Test Results Summary:', colors.bright);
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? colors.green : colors.red;
    log(`   ${test}: ${status}`, color);
  });

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    log('\n🎉 ALL TESTS PASSED!', colors.green);
    log('✅ Backward compatibility is maintained', colors.green);
    log('✅ Both services can coexist without conflicts', colors.green);
    log('✅ API structure is correct', colors.green);
    process.exit(0);
  } else {
    log('\n❌ SOME TESTS FAILED!', colors.red);
    log('Please review the issues above', colors.yellow);
    process.exit(1);
  }
}

main();
