import { Agent } from '@openai/agents';
import { triagePrompts } from '../prompts/triage';
import { customerServiceAgent } from './customer-service';
import { weatherAgent } from './weather';
import { researchAgent } from './research';

// Triage Agent - Routes to appropriate specialist
export const triageAgent = Agent.create({
  name: 'Triage Agent',
  model: 'gpt-4o',
  instructions: triagePrompts.main,
  handoffs: [customerServiceAgent, weatherAgent, researchAgent],
  modelSettings: {
    temperature: 0.1, // Very consistent routing decisions
    maxTokens: 500,
  },
});
