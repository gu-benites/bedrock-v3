import { run } from '@openai/agents';
import { loadAllAgents, getAgent } from './utils/agent-loader';

// Example: Using the organized agent structure
async function main() {
  try {
    // Load all agents from configuration
    console.log('🔄 Loading agents from configuration...');
    const agents = await loadAllAgents('./config/agents.json');
    
    console.log('✅ Loaded agents:', Array.from(agents.keys()));
    
    // Get the triage agent (main entry point)
    const triageAgent = getAgent('triage');
    if (!triageAgent) {
      throw new Error('Triage agent not found');
    }
    
    // Example conversations
    const conversations = [
      "What's the weather like in Tokyo?",
      "I can't access my account",
      "Tell me about artificial intelligence",
      "My bill seems incorrect this month",
      "Will it rain tomorrow?",
    ];
    
    for (const message of conversations) {
      console.log(`\n👤 User: ${message}`);
      console.log('🤖 Agent: Processing...');
      
      try {
        const result = await run(triageAgent, message);
        console.log(`🤖 Response: ${result.finalOutput}`);
        
        // Show which agent handled the final response
        if (result.finalAgent) {
          console.log(`📍 Handled by: ${result.finalAgent.name}`);
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to load agents:', error);
  }
}

// Example: Using specific agents directly
async function useSpecificAgent() {
  const agents = await loadAllAgents('./config/agents.json');
  
  // Use weather agent directly
  const weatherAgent = getAgent('weather');
  if (weatherAgent) {
    const result = await run(weatherAgent, "What's the forecast for this weekend in Paris?");
    console.log('Weather response:', result.finalOutput);
  }
  
  // Use research agent directly
  const researchAgent = getAgent('research');
  if (researchAgent) {
    const result = await run(researchAgent, "Research the benefits of renewable energy");
    console.log('Research response:', result.finalOutput);
  }
}

// Example: Dynamic agent creation
async function createCustomAgent() {
  const customConfig = {
    name: "Custom Assistant",
    model: "gpt-4o-mini",
    modelSettings: {
      temperature: 0.5,
      maxTokens: 1200,
    },
    promptFile: "custom-prompt",
    tools: ["get_weather"],
  };
  
  // This would require extending the agent loader to handle custom prompts
  console.log('Custom agent config:', customConfig);
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
}
