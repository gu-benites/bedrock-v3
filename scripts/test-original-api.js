#!/usr/bin/env node

/**
 * Simple test for the original API endpoint
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test configuration
const TEST_CONFIG = {
  endpoint: 'http://localhost:9002/api/recipe-wizard',
  healthConcern: 'I have chronic anxiety and stress affecting my daily life',
  demographics: {
    gender: 'female',
    ageCategory: 'adult',
    specificAge: 32,
    language: 'EN_US'
  }
};

async function testOriginalAPI() {
  console.log('🧪 Testing Original Recipe Wizard API');
  console.log(`Endpoint: ${TEST_CONFIG.endpoint}\n`);

  // First test GET (health check)
  console.log('1. Testing GET (health check)...');
  
  return new Promise((resolve, reject) => {
    const url = new URL(TEST_CONFIG.endpoint);
    const getOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const getReq = http.request(getOptions, (res) => {
      console.log(`GET Response status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('GET Response:', JSON.stringify(parsed, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ GET request successful\n');
            
            // Now test POST
            console.log('2. Testing POST (AI analysis)...');
            testPOST().then(resolve).catch(reject);
          } else {
            reject(new Error(`GET failed with status ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse GET response: ${error.message}`));
        }
      });
    });

    getReq.on('error', (error) => {
      reject(new Error(`GET request error: ${error.message}`));
    });

    getReq.end();
  });
}

function testPOST() {
  return new Promise((resolve, reject) => {
    const requestData = {
      healthConcern: { healthConcern: TEST_CONFIG.healthConcern },
      demographics: TEST_CONFIG.demographics
    };

    console.log('POST Request data:', JSON.stringify(requestData, null, 2));

    const url = new URL(TEST_CONFIG.endpoint);
    const postOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData))
      }
    };

    const startTime = Date.now();
    const postReq = http.request(postOptions, (res) => {
      console.log(`POST Response status: ${res.statusCode}`);
      console.log(`POST Response headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log(`✅ POST request successful (${duration}ms)`);
            console.log('Response structure:', {
              success: parsed.success,
              dataType: Array.isArray(parsed.data) ? 'array' : typeof parsed.data,
              dataLength: parsed.data?.length || 0,
              hasMeta: !!parsed.meta
            });
            
            if (parsed.success && parsed.data && Array.isArray(parsed.data)) {
              console.log('\n📋 Potential Causes:');
              parsed.data.forEach((cause, index) => {
                console.log(`   ${index + 1}. ${cause.name_localized || cause.cause_name || 'Unknown'}`);
              });
            }
            
            resolve({
              success: true,
              duration,
              causesCount: parsed.data?.length || 0,
              response: parsed
            });
          } else {
            console.log('❌ POST request failed');
            console.log('Response body:', data);
            reject(new Error(`POST failed with status ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          console.log('❌ Failed to parse POST response');
          console.log('Raw response:', data);
          reject(new Error(`Failed to parse POST response: ${error.message}`));
        }
      });
    });

    postReq.on('error', (error) => {
      reject(new Error(`POST request error: ${error.message}`));
    });

    postReq.write(JSON.stringify(requestData));
    postReq.end();
  });
}

async function main() {
  try {
    const result = await testOriginalAPI();
    console.log('\n🎉 Original API test completed successfully!');
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Causes found: ${result.causesCount}`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Original API test failed:', error.message);
    process.exit(1);
  }
}

main();
