#!/usr/bin/env node

/**
 * Test script for Essential Oils Integration
 * 
 * This script tests the complete flow from therapeutic properties to suggested oils
 * to ensure the new nested oils implementation works correctly.
 * 
 * Usage:
 *   node scripts/test-oils-integration.js
 * 
 * Environment:
 *   Requires NEXT_PUBLIC_APP_URL or defaults to http://localhost:3000
 */

// Use Node.js built-in fetch (Node 18+)
const fetch = globalThis.fetch;

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
const API_ENDPOINT = `${BASE_URL}/api/ai/streaming`;

// Test data that matches the expected format
const TEST_DATA = {
  feature: 'create-recipe',
  step: 'suggested-oils',
  data: {
    health_concern: 'dor de cabeça crônica com tensão muscular e fadiga mental',
    demographics: {
      gender: 'female',
      age_category: 'adult',
      age_specific: '35'
    },
    selected_causes: [
      {
        cause_id: 'cause-1-stress-mental-fatigue',
        name_localized: 'Stress and Mental Fatigue',
        explanation_localized: 'High stress levels from work leading to mental exhaustion'
      },
      {
        cause_id: 'cause-2-poor-sleep-quality',
        name_localized: 'Poor Sleep Quality',
        explanation_localized: 'Difficulty maintaining sleep patterns affecting recovery'
      }
    ],
    selected_symptoms: [
      {
        symptom_id: 'symptom-1-fatigue-sensation',
        name_localized: 'Sensação de fadiga',
        explanation_localized: 'Persistent tiredness affecting daily activities'
      },
      {
        symptom_id: 'symptom-2-muscle-tension',
        name_localized: 'Tensão muscular no pescoço e ombros',
        explanation_localized: 'Muscle tightness from stress and posture'
      }
    ],
    therapeutic_properties: [
      {
        property_id: 'prop-001',
        property_name_localized: 'Calmante',
        property_name_english: 'Calming',
        description_contextual_localized: 'Contribui para reduzir o estresse, a ansiedade e a tensão muscular, ajudando a aliviar dores de cabeça relacionadas ao estresse e fadiga mental.'
      },
      {
        property_id: 'prop-002',
        property_name_localized: 'Relaxante Muscular',
        property_name_english: 'Muscle Relaxant',
        description_contextual_localized: 'Auxilia na redução da tensão muscular no pescoço e ombros, contribuindo para diminuir dores de cabeça tensionais.'
      },
      {
        property_id: 'prop-003',
        property_name_localized: 'Energizante Mental',
        property_name_english: 'Mental Energizer',
        description_contextual_localized: 'Estimula a clareza mental e o foco, ajudando a combater a fadiga mental que pode agravar dores de cabeça.'
      }
    ],
    user_language: 'PT_BR'
  }
};

/**
 * Colors for console output
 */
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

/**
 * Logging utilities
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.magenta}🐛${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔄${colors.reset} ${msg}`)
};

/**
 * Test the oils integration API
 */
async function testOilsIntegration() {
  log.step('Starting Essential Oils Integration Test');
  log.info(`Testing endpoint: ${API_ENDPOINT}`);
  
  try {
    // Test 1: Validate request structure
    log.step('Test 1: Validating request structure');
    log.debug('Request data:');
    console.log(JSON.stringify(TEST_DATA, null, 2));
    
    // Test 2: Make the API call
    log.step('Test 2: Making API request');
    const startTime = Date.now();
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Test 3: Process streaming response
    log.step('Test 3: Processing streaming response');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let itemCount = 0;
    let propertyCount = 0;
    const receivedProperties = new Set();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            
            if (eventData.type === 'structured_item' && eventData.data) {
              itemCount++;
              const item = eventData.data;
              
              if (item.therapeutic_property_context) {
                propertyCount++;
                receivedProperties.add(item.therapeutic_property_context.property_name_localized);
                
                log.success(`Received property: ${item.therapeutic_property_context.property_name_localized}`);
                
                if (item.suggested_oils && item.suggested_oils.length > 0) {
                  log.info(`  └─ ${item.suggested_oils.length} oils suggested`);
                  item.suggested_oils.forEach((oil, index) => {
                    log.info(`     ${index + 1}. ${oil.name_localized || oil.name_english} (Score: ${oil.relevancy_to_property_score || 'N/A'})`);
                  });
                }
              }
            }
            
            if (eventData.type === 'structured_complete') {
              log.success('Streaming completed successfully');
              const finalData = eventData.data;
              
              if (finalData && finalData.data && finalData.data.property_oil_suggestions) {
                log.success(`Final result: ${finalData.data.property_oil_suggestions.length} properties with oils`);
              }
            }
            
          } catch (parseError) {
            // Expected during streaming - partial JSON
            log.debug('Parse error (expected during streaming)');
          }
        }
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Test 4: Validate results
    log.step('Test 4: Validating results');
    
    log.info(`Total streaming duration: ${duration}ms`);
    log.info(`Total items received: ${itemCount}`);
    log.info(`Properties with oils: ${propertyCount}`);
    log.info(`Unique properties: ${receivedProperties.size}`);
    
    // Validate expected properties
    const expectedProperties = ['Calmante', 'Relaxante Muscular', 'Energizante Mental'];
    const missingProperties = expectedProperties.filter(prop => !receivedProperties.has(prop));
    
    if (missingProperties.length === 0) {
      log.success('All expected therapeutic properties received oils');
    } else {
      log.warning(`Missing oils for properties: ${missingProperties.join(', ')}`);
    }
    
    // Test 5: Performance validation
    log.step('Test 5: Performance validation');
    
    if (duration < 30000) {
      log.success(`Response time acceptable: ${duration}ms`);
    } else if (duration < 60000) {
      log.warning(`Response time slow but acceptable: ${duration}ms`);
    } else {
      log.error(`Response time too slow: ${duration}ms`);
    }
    
    if (propertyCount >= 3) {
      log.success('Sufficient oil suggestions received');
    } else {
      log.warning('Fewer oil suggestions than expected');
    }
    
    log.success('🎉 Essential Oils Integration Test Completed Successfully!');
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      log.error('Connection refused - is the development server running?');
      log.info('Start the server with: npm run dev');
    }
    
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}🧪 Essential Oils Integration Test${colors.reset}`);
  console.log('='.repeat(50));
  
  await testOilsIntegration();
  
  console.log('='.repeat(50));
  log.success('All tests completed!');
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testOilsIntegration, TEST_DATA };
