#!/usr/bin/env node

/**
 * Simple API health check script
 */

// Use Node.js built-in fetch (Node 18+)
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:9002';

async function testApiHealth() {
  console.log('🏥 Testing API Health...');
  
  try {
    // Test 1: Basic health check
    console.log('🔄 Test 1: GET /api/ai/streaming');
    const healthResponse = await fetch(`${BASE_URL}/api/ai/streaming`);
    console.log('Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed');
      const errorText = await healthResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 2: Simple streaming request
    console.log('\n🔄 Test 2: Simple streaming request');
    const simpleRequest = {
      feature: 'create-recipe',
      step: 'potential-causes', // Try a simpler step first
      data: {
        health_concern: 'headache',
        demographics: {
          gender: 'female',
          age_category: 'adult',
          age_specific: '30'
        }
      }
    };
    
    console.log('Request:', JSON.stringify(simpleRequest, null, 2));
    
    const streamResponse = await fetch(`${BASE_URL}/api/ai/streaming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleRequest)
    });
    
    console.log('Stream response status:', streamResponse.status);
    
    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.log('❌ Stream request failed:', errorText);
    } else {
      console.log('✅ Stream request started successfully');
      
      // Read a few chunks to test streaming
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;
      
      while (chunkCount < 5) { // Read first 5 chunks
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Chunk ${chunkCount + 1}:`, chunk.substring(0, 100) + '...');
        chunkCount++;
      }
      
      reader.releaseLock();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the development server is running: npm run dev');
    }
  }
}

// Run the test
testApiHealth().catch(console.error);
