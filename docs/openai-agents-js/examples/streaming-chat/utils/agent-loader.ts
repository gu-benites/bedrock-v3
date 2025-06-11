import { Agent } from '@openai/agents';
import * as prompts from '../prompts';
import * as tools from '../tools';

// Type definitions for configuration
interface AgentConfig {
  name: string;
  model: string;
  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  description?: string;
  tools?: string[];
  handoffs?: string[];
  promptFile: string;
  context?: Record<string, any>;
}

interface AgentsConfig {
  agents: Record<string, AgentConfig>;
  settings: {
    defaultModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    tracingEnabled: boolean;
    apiType: string;
  };
}

// Agent registry to store created agents
const agentRegistry = new Map<string, Agent>();

/**
 * Load agent configuration from JSON
 */
export async function loadAgentConfig(configPath: string): Promise<AgentsConfig> {
  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading agent config:', error);
    throw error;
  }
}

/**
 * Get prompt by file name
 */
function getPrompt(promptFile: string): string {
  const promptMap: Record<string, any> = {
    'customer-service': prompts.customerServicePrompts.main,
    'weather': prompts.weatherPrompts.main,
    'research': prompts.researchPrompts.main,
    'triage': prompts.triagePrompts.main,
  };

  const prompt = promptMap[promptFile];
  if (!prompt) {
    throw new Error(`Prompt file not found: ${promptFile}`);
  }
  return prompt;
}

/**
 * Get tools by name
 */
function getTools(toolNames: string[]) {
  const toolMap: Record<string, any> = {
    'lookup_customer': tools.lookupCustomerTool,
    'create_ticket': tools.createTicketTool,
    'get_weather': tools.getWeatherTool,
    'get_forecast': tools.getForecastTool,
    'web_search': tools.webSearchTool,
    'analyze_data': tools.analyzeDataTool,
  };

  return toolNames.map(name => {
    const tool = toolMap[name];
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  });
}

/**
 * Create an agent from configuration
 */
export function createAgentFromConfig(
  agentId: string, 
  config: AgentConfig, 
  globalSettings: AgentsConfig['settings']
): Agent {
  const instructions = getPrompt(config.promptFile);
  const agentTools = config.tools ? getTools(config.tools) : [];

  const agent = new Agent({
    name: config.name,
    model: config.model || globalSettings.defaultModel,
    instructions,
    tools: agentTools,
    modelSettings: {
      temperature: config.modelSettings?.temperature ?? globalSettings.defaultTemperature,
      maxTokens: config.modelSettings?.maxTokens ?? globalSettings.defaultMaxTokens,
      ...config.modelSettings,
    },
  });

  // Store in registry
  agentRegistry.set(agentId, agent);
  
  return agent;
}

/**
 * Load all agents from configuration
 */
export async function loadAllAgents(configPath: string = '/config/agents.json'): Promise<Map<string, Agent>> {
  const config = await loadAgentConfig(configPath);
  
  // First pass: create all agents without handoffs
  for (const [agentId, agentConfig] of Object.entries(config.agents)) {
    if (!agentConfig.handoffs) {
      createAgentFromConfig(agentId, agentConfig, config.settings);
    }
  }
  
  // Second pass: create agents with handoffs (they can reference other agents)
  for (const [agentId, agentConfig] of Object.entries(config.agents)) {
    if (agentConfig.handoffs) {
      const handoffAgents = agentConfig.handoffs.map(handoffId => {
        const handoffAgent = agentRegistry.get(handoffId);
        if (!handoffAgent) {
          throw new Error(`Handoff agent not found: ${handoffId}`);
        }
        return handoffAgent;
      });

      const instructions = getPrompt(agentConfig.promptFile);
      
      const agent = Agent.create({
        name: agentConfig.name,
        model: agentConfig.model || config.settings.defaultModel,
        instructions,
        handoffs: handoffAgents,
        modelSettings: {
          temperature: agentConfig.modelSettings?.temperature ?? config.settings.defaultTemperature,
          maxTokens: agentConfig.modelSettings?.maxTokens ?? config.settings.defaultMaxTokens,
          ...agentConfig.modelSettings,
        },
      });

      agentRegistry.set(agentId, agent);
    }
  }
  
  return agentRegistry;
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return agentRegistry.get(agentId);
}

/**
 * List all available agents
 */
export function listAgents(): string[] {
  return Array.from(agentRegistry.keys());
}
