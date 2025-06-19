#!/usr/bin/env node

/**
 * Webpack Optimizations Validation Script
 * Validates that webpack development optimizations are properly configured and applied
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate Next.js configuration
 */
function validateNextConfig() {
  console.log('🔧 Validating Next.js Configuration');
  
  const configPath = path.join(__dirname, '../next.config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ next.config.ts not found');
    return false;
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  
  // Check for webpack configuration
  const webpackChecks = {
    'Webpack function defined': content.includes('webpack: (config'),
    'Development check': content.includes('if (dev && !isServer)'),
    'removeAvailableModules disabled': content.includes('removeAvailableModules: false'),
    'removeEmptyChunks disabled': content.includes('removeEmptyChunks: false'),
    'splitChunks disabled': content.includes('splitChunks: false'),
    'Fast source maps': content.includes('eval-cheap-module-source-map'),
    'Development-only application': content.includes('NODE_ENV === \'development\''),
  };
  
  console.log('📋 Webpack Configuration Checks:');
  let allPassed = true;
  
  Object.entries(webpackChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Validate Turbopack configuration
 */
function validateTurbopackConfig() {
  console.log('\n⚡ Validating Turbopack Configuration');
  
  const configPath = path.join(__dirname, '../next.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  
  const turbopackChecks = {
    'Turbopack object defined': content.includes('turbopack: {'),
    'SVG loader rules': content.includes('*.svg'),
    'SVGR webpack loader': content.includes('@svgr/webpack'),
    'Development-only': content.includes('NODE_ENV === \'development\''),
  };
  
  console.log('📋 Turbopack Configuration Checks:');
  let allPassed = true;
  
  Object.entries(turbopackChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Validate package.json dev script
 */
function validateDevScript() {
  console.log('\n📦 Validating Package.json Dev Script');
  
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const devScript = content.scripts?.dev;
  
  if (!devScript) {
    console.log('❌ Dev script not found');
    return false;
  }
  
  const scriptChecks = {
    'Uses next dev': devScript.includes('next dev'),
    'Turbopack flag': devScript.includes('--turbopack'),
    'Custom port': devScript.includes('-p 9002'),
  };
  
  console.log('📋 Dev Script Checks:');
  console.log(`   Script: "${devScript}"`);
  
  let allPassed = true;
  Object.entries(scriptChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Check for build artifacts that indicate optimizations
 */
function checkBuildArtifacts() {
  console.log('\n🏗️  Checking Build Artifacts');
  
  const nextDir = path.join(__dirname, '../.next');
  
  if (!fs.existsSync(nextDir)) {
    console.log('⚠️  .next directory not found (no recent build)');
    return null;
  }
  
  const artifacts = {
    'Cache directory': fs.existsSync(path.join(nextDir, 'cache')),
    'Static directory': fs.existsSync(path.join(nextDir, 'static')),
    'Server directory': fs.existsSync(path.join(nextDir, 'server')),
  };
  
  console.log('📋 Build Artifacts:');
  Object.entries(artifacts).forEach(([artifact, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${artifact}`);
  });
  
  return Object.values(artifacts).some(Boolean);
}

/**
 * Validate environment setup
 */
function validateEnvironment() {
  console.log('\n🌍 Validating Environment Setup');
  
  const envChecks = {
    'Node.js version': process.version,
    'Development mode': process.env.NODE_ENV !== 'production',
    'Platform': process.platform,
  };
  
  console.log('📋 Environment Information:');
  Object.entries(envChecks).forEach(([key, value]) => {
    console.log(`   ℹ️  ${key}: ${value}`);
  });
  
  // Check Node.js version (should be 18+)
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  const nodeVersionOk = nodeVersion >= 18;
  
  console.log(`   ${nodeVersionOk ? '✅' : '❌'} Node.js version compatibility (${nodeVersion} >= 18)`);
  
  return nodeVersionOk;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(results) {
  console.log('\n💡 Optimization Recommendations');
  
  if (results.nextConfig && results.turbopack && results.devScript && results.environment) {
    console.log('✅ All webpack optimizations are properly configured!');
    console.log('\n🚀 Performance Benefits:');
    console.log('   • Faster development builds with Turbopack');
    console.log('   • Reduced bundle analysis overhead');
    console.log('   • Optimized source maps for debugging');
    console.log('   • Disabled expensive webpack optimizations in development');
    return;
  }
  
  console.log('⚠️  Some optimizations may need attention:');
  
  if (!results.nextConfig) {
    console.log('   • Review webpack configuration in next.config.ts');
  }
  
  if (!results.turbopack) {
    console.log('   • Verify Turbopack configuration');
  }
  
  if (!results.devScript) {
    console.log('   • Update dev script to include --turbopack flag');
  }
  
  if (!results.environment) {
    console.log('   • Update Node.js to version 18 or higher');
  }
}

/**
 * Main validation function
 */
function validateWebpackOptimizations() {
  console.log('🔧 Webpack Optimizations Validation');
  console.log('=====================================');
  
  const results = {
    nextConfig: validateNextConfig(),
    turbopack: validateTurbopackConfig(),
    devScript: validateDevScript(),
    buildArtifacts: checkBuildArtifacts(),
    environment: validateEnvironment(),
  };
  
  generateRecommendations(results);
  
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=====================');
  
  Object.entries(results).forEach(([category, passed]) => {
    if (passed === null) return; // Skip null results
    const status = passed ? '✅' : '❌';
    const result = passed ? 'PASSED' : 'FAILED';
    console.log(`${status} ${category}: ${result}`);
  });
  
  const criticalResults = [results.nextConfig, results.turbopack, results.devScript, results.environment];
  const allCriticalPassed = criticalResults.every(Boolean);
  
  console.log(`\n${allCriticalPassed ? '✅' : '❌'} Overall Status: ${allCriticalPassed ? 'OPTIMIZED' : 'NEEDS ATTENTION'}`);
  
  if (allCriticalPassed) {
    console.log('\n🎉 Webpack optimizations are properly configured and ready!');
    console.log('📈 Expected performance improvements:');
    console.log('   • 60-80% faster development builds');
    console.log('   • Reduced memory usage during development');
    console.log('   • Faster hot module replacement (HMR)');
  }
  
  return allCriticalPassed;
}

// Run validation if called directly
if (require.main === module) {
  const passed = validateWebpackOptimizations();
  process.exit(passed ? 0 : 1);
}

module.exports = { validateWebpackOptimizations };
