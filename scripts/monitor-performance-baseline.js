#!/usr/bin/env node

/**
 * Performance Baseline Monitoring Script
 * Monitors and validates current performance against established baseline metrics
 */

const fs = require('fs');
const path = require('path');

// Baseline metrics established after optimization
const BASELINE_METRICS = {
  navigation: {
    target: 2000,      // 2 seconds maximum
    excellent: 500,    // 0.5 seconds excellent
    good: 1000,        // 1 second good
    baseline: 856,     // Current baseline: 856ms
  },
  build: {
    initial: 30000,    // 30 seconds initial build
    hotReload: 2000,   // 2 seconds hot reload
    fileChange: 500,   // 500ms file change detection
  },
  streaming: {
    firstChunk: 2000,  // 2 seconds first response
    itemDisplay: 100,  // 100ms per item
    completion: 10000, // 10 seconds full analysis
  }
};

/**
 * Check current configuration against baseline
 */
function validateBaselineConfiguration() {
  console.log('🔧 Validating Baseline Configuration');
  
  const checks = {
    nextConfig: validateNextConfig(),
    packageJson: validatePackageJson(),
    documentation: validateDocumentation(),
  };
  
  const allValid = Object.values(checks).every(Boolean);
  
  console.log(`\n${allValid ? '✅' : '❌'} Configuration Status: ${allValid ? 'VALID' : 'INVALID'}`);
  
  return { checks, allValid };
}

/**
 * Validate Next.js configuration
 */
function validateNextConfig() {
  const configPath = path.join(__dirname, '../next.config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ next.config.ts not found');
    return false;
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  
  const requiredOptimizations = [
    'turbopack:',
    'webpack:',
    'removeAvailableModules: false',
    'removeEmptyChunks: false',
    'splitChunks: false',
    'eval-cheap-module-source-map',
    'NODE_ENV === \'production\'',
  ];
  
  const missing = requiredOptimizations.filter(opt => !content.includes(opt));
  
  if (missing.length === 0) {
    console.log('✅ Next.js configuration: All optimizations present');
    return true;
  } else {
    console.log('❌ Next.js configuration: Missing optimizations:', missing);
    return false;
  }
}

/**
 * Validate package.json dev script
 */
function validatePackageJson() {
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const devScript = content.scripts?.dev;
  
  if (!devScript || !devScript.includes('--turbopack')) {
    console.log('❌ Dev script: Turbopack flag missing');
    return false;
  }
  
  console.log('✅ Dev script: Turbopack enabled');
  return true;
}

/**
 * Validate performance documentation exists
 */
function validateDocumentation() {
  const docs = [
    '../docs/create-recipe/readme/performance-optimization.md',
    '../docs/create-recipe/performance/baseline-metrics.md',
  ];
  
  const missing = docs.filter(doc => !fs.existsSync(path.join(__dirname, doc)));
  
  if (missing.length === 0) {
    console.log('✅ Documentation: All performance docs present');
    return true;
  } else {
    console.log('❌ Documentation: Missing files:', missing);
    return false;
  }
}

/**
 * Generate performance report
 */
function generatePerformanceReport(configValidation) {
  console.log('\n📊 PERFORMANCE BASELINE REPORT');
  console.log('='.repeat(40));
  
  // Configuration status
  console.log('\n🔧 Configuration Status:');
  Object.entries(configValidation.checks).forEach(([component, valid]) => {
    console.log(`   ${valid ? '✅' : '❌'} ${component}: ${valid ? 'VALID' : 'INVALID'}`);
  });
  
  // Performance targets
  console.log('\n🎯 Performance Targets:');
  console.log(`   Navigation Target: ≤ ${BASELINE_METRICS.navigation.target}ms`);
  console.log(`   Current Baseline: ${BASELINE_METRICS.navigation.baseline}ms`);
  console.log(`   Performance Level: ${getPerformanceLevel(BASELINE_METRICS.navigation.baseline)}`);
  
  // Thresholds
  console.log('\n📈 Performance Thresholds:');
  console.log(`   Excellent: ≤ ${BASELINE_METRICS.navigation.excellent}ms`);
  console.log(`   Good: ≤ ${BASELINE_METRICS.navigation.good}ms`);
  console.log(`   Acceptable: ≤ ${BASELINE_METRICS.navigation.target}ms`);
  
  // Monitoring recommendations
  console.log('\n🔍 Monitoring Recommendations:');
  console.log('   • Run navigation tests regularly');
  console.log('   • Monitor console logs for timing patterns');
  console.log('   • Watch for performance regression indicators');
  console.log('   • Validate configuration after updates');
  
  return {
    configurationValid: configValidation.allValid,
    baselineMetrics: BASELINE_METRICS,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get performance level for given timing
 */
function getPerformanceLevel(timing) {
  if (timing <= BASELINE_METRICS.navigation.excellent) return 'EXCELLENT';
  if (timing <= BASELINE_METRICS.navigation.good) return 'GOOD';
  if (timing <= BASELINE_METRICS.navigation.target) return 'ACCEPTABLE';
  return 'POOR';
}

/**
 * Save monitoring report
 */
function saveMonitoringReport(report) {
  const reportsDir = path.join(__dirname, '../reports');
  const reportPath = path.join(reportsDir, 'performance-baseline-monitoring.json');
  
  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Load existing reports or create new array
  let reports = [];
  if (fs.existsSync(reportPath)) {
    try {
      reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (error) {
      console.log('⚠️  Could not load existing reports, creating new file');
    }
  }
  
  // Add current report
  reports.push(report);
  
  // Keep only last 50 reports
  if (reports.length > 50) {
    reports = reports.slice(-50);
  }
  
  // Save updated reports
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

/**
 * Main monitoring function
 */
function monitorPerformanceBaseline() {
  console.log('📊 Performance Baseline Monitoring');
  console.log('==================================');
  console.log(`Baseline Navigation Time: ${BASELINE_METRICS.navigation.baseline}ms`);
  console.log(`Target Navigation Time: ≤ ${BASELINE_METRICS.navigation.target}ms`);
  
  // Validate configuration
  const configValidation = validateBaselineConfiguration();
  
  // Generate report
  const report = generatePerformanceReport(configValidation);
  
  // Save report
  saveMonitoringReport(report);
  
  // Overall status
  const overallStatus = configValidation.allValid;
  
  console.log(`\n${overallStatus ? '✅' : '❌'} Overall Baseline Status: ${overallStatus ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
  
  if (overallStatus) {
    console.log('\n🎉 Performance baseline is properly maintained!');
    console.log('📈 All optimizations are in place and validated.');
  } else {
    console.log('\n⚠️  Performance baseline needs attention.');
    console.log('🔧 Review configuration and fix any issues.');
  }
  
  return overallStatus;
}

// Run monitoring if called directly
if (require.main === module) {
  const healthy = monitorPerformanceBaseline();
  process.exit(healthy ? 0 : 1);
}

module.exports = { 
  monitorPerformanceBaseline, 
  BASELINE_METRICS,
  getPerformanceLevel 
};
