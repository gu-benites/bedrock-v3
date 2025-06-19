#!/usr/bin/env node

/**
 * Navigation Performance Testing Script
 * Tests create-recipe workflow navigation timing to ensure under 2 seconds
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  NAVIGATION_MAX_TIME: 2000, // 2 seconds
  ACCEPTABLE_TIME: 1000, // 1 second (good performance)
  EXCELLENT_TIME: 500, // 0.5 seconds (excellent performance)
};

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:9002',
  headless: false, // Set to true for CI
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
};

// Navigation test scenarios
const NAVIGATION_SCENARIOS = [
  {
    name: 'Health Concern → Demographics',
    from: '/dashboard/create-recipe/health-concern',
    to: '/dashboard/create-recipe/demographics',
    action: 'fillHealthConcern',
  },
  {
    name: 'Demographics → Causes',
    from: '/dashboard/create-recipe/demographics',
    to: '/dashboard/create-recipe/causes',
    action: 'fillDemographics',
  },
  {
    name: 'Causes → Symptoms',
    from: '/dashboard/create-recipe/causes',
    to: '/dashboard/create-recipe/symptoms',
    action: 'selectCauses',
  },
  {
    name: 'Symptoms → Properties',
    from: '/dashboard/create-recipe/symptoms',
    to: '/dashboard/create-recipe/properties',
    action: 'selectSymptoms',
  },
];

/**
 * Test actions for each step
 */
const TEST_ACTIONS = {
  async fillHealthConcern(page) {
    await page.waitForSelector('input[name="healthConcern"]', { timeout: 5000 });
    await page.type('input[name="healthConcern"]', 'chronic anxiety');
    await page.click('button[type="submit"]');
  },

  async fillDemographics(page) {
    await page.waitForSelector('select[name="gender"]', { timeout: 5000 });
    await page.select('select[name="gender"]', 'female');
    await page.select('select[name="ageCategory"]', 'adult');
    await page.type('input[name="specificAge"]', '28');
    
    // Wait for form to be valid and click continue
    await page.waitForSelector('button:not([disabled])', { timeout: 5000 });
    await page.click('button[type="submit"]');
  },

  async selectCauses(page) {
    // Wait for causes to load
    await page.waitForSelector('[data-testid="cause-item"]', { timeout: 10000 });
    
    // Select first few causes
    const causes = await page.$$('[data-testid="cause-item"] input[type="checkbox"]');
    for (let i = 0; i < Math.min(3, causes.length); i++) {
      await causes[i].click();
    }
    
    await page.click('button[type="submit"]');
  },

  async selectSymptoms(page) {
    // Wait for symptoms to load
    await page.waitForSelector('[data-testid="symptom-item"]', { timeout: 10000 });
    
    // Select first few symptoms
    const symptoms = await page.$$('[data-testid="symptom-item"] input[type="checkbox"]');
    for (let i = 0; i < Math.min(3, symptoms.length); i++) {
      await symptoms[i].click();
    }
    
    await page.click('button[type="submit"]');
  },
};

/**
 * Measure navigation timing
 */
async function measureNavigationTiming(page, scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  
  // Navigate to starting page
  await page.goto(`${TEST_CONFIG.baseUrl}${scenario.from}`, { 
    waitUntil: 'networkidle0',
    timeout: TEST_CONFIG.timeout 
  });

  // Start timing
  const startTime = Date.now();
  
  // Perform the action that triggers navigation
  await TEST_ACTIONS[scenario.action](page);
  
  // Wait for navigation to complete
  await page.waitForURL(`${TEST_CONFIG.baseUrl}${scenario.to}`, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  // End timing
  const endTime = Date.now();
  const navigationTime = endTime - startTime;
  
  // Evaluate performance
  let performance = 'POOR';
  if (navigationTime <= PERFORMANCE_THRESHOLDS.EXCELLENT_TIME) {
    performance = 'EXCELLENT';
  } else if (navigationTime <= PERFORMANCE_THRESHOLDS.ACCEPTABLE_TIME) {
    performance = 'GOOD';
  } else if (navigationTime <= PERFORMANCE_THRESHOLDS.NAVIGATION_MAX_TIME) {
    performance = 'ACCEPTABLE';
  }
  
  const result = {
    scenario: scenario.name,
    navigationTime,
    performance,
    passed: navigationTime <= PERFORMANCE_THRESHOLDS.NAVIGATION_MAX_TIME,
    timestamp: new Date().toISOString(),
  };
  
  console.log(`⏱️  Navigation Time: ${navigationTime}ms (${performance})`);
  console.log(`${result.passed ? '✅' : '❌'} ${result.passed ? 'PASSED' : 'FAILED'}`);
  
  return result;
}

/**
 * Run all navigation performance tests
 */
async function runNavigationTests() {
  console.log('🚀 Starting Navigation Performance Tests');
  console.log(`📊 Performance Thresholds:`);
  console.log(`   Excellent: ≤ ${PERFORMANCE_THRESHOLDS.EXCELLENT_TIME}ms`);
  console.log(`   Good: ≤ ${PERFORMANCE_THRESHOLDS.ACCEPTABLE_TIME}ms`);
  console.log(`   Acceptable: ≤ ${PERFORMANCE_THRESHOLDS.NAVIGATION_MAX_TIME}ms`);
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    defaultViewport: TEST_CONFIG.viewport,
  });
  
  const page = await browser.newPage();
  const results = [];
  
  try {
    // Run each navigation scenario
    for (const scenario of NAVIGATION_SCENARIOS) {
      try {
        const result = await measureNavigationTiming(page, scenario);
        results.push(result);
        
        // Small delay between tests
        await page.waitForTimeout(1000);
      } catch (error) {
        console.error(`❌ Test failed for ${scenario.name}:`, error.message);
        results.push({
          scenario: scenario.name,
          navigationTime: null,
          performance: 'ERROR',
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } finally {
    await browser.close();
  }
  
  // Generate report
  generatePerformanceReport(results);
  
  return results;
}

/**
 * Generate performance report
 */
function generatePerformanceReport(results) {
  console.log('\n📊 NAVIGATION PERFORMANCE REPORT');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log(`Overall: ${passed}/${total} tests passed (${passRate}%)`);
  
  // Calculate statistics
  const validTimes = results.filter(r => r.navigationTime !== null).map(r => r.navigationTime);
  if (validTimes.length > 0) {
    const avgTime = (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(0);
    const maxTime = Math.max(...validTimes);
    const minTime = Math.min(...validTimes);
    
    console.log(`Average Navigation Time: ${avgTime}ms`);
    console.log(`Fastest Navigation: ${minTime}ms`);
    console.log(`Slowest Navigation: ${maxTime}ms`);
  }
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const time = result.navigationTime ? `${result.navigationTime}ms` : 'ERROR';
    console.log(`${status} ${result.scenario}: ${time} (${result.performance})`);
  });
  
  // Save results to file
  const reportPath = path.join(__dirname, '../reports/navigation-performance.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    console.log('\n❌ Some navigation tests failed. Performance optimization needed.');
    process.exit(1);
  } else {
    console.log('\n✅ All navigation tests passed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  runNavigationTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runNavigationTests, PERFORMANCE_THRESHOLDS };
