/**
 * @fileoverview Orchestrating agent for coordinating parallel oil selection
 */

import { Agent } from '@openai/agents';
import { z } from 'zod';
import { parallelExecutionTools } from '../tools/parallel-oil-selection-tool';

/**
 * Context interface for orchestrator agent
 */
export interface OilOrchestratorContext {
  feature: string;
  step: string;
  user_language: string;
  request_id?: string;
}

/**
 * Output schema for orchestrator agent (matches API response format)
 */
const OilOrchestratorOutputSchema = z.object({
  meta: z.object({
    step_name: z.string(),
    request_id: z.string(),
    timestamp_utc: z.string(),
    version: z.string(),
    user_language: z.string(),
    status: z.string(),
    message: z.string()
  }),
  data: z.object({
    property_oil_suggestions: z.array(z.object({
      therapeutic_property_context: z.object({
        property_id: z.string(),
        property_name_localized: z.string(),
        property_name_english: z.string(),
        description_localized: z.string()
      }),
      suggested_oils: z.array(z.object({
        oil_id: z.string(),
        name_english: z.string(),
        name_botanical: z.string(),
        name_localized: z.string(),
        match_rationale_localized: z.string(),
        relevancy_to_property_score: z.number().min(1).max(5)
      }))
    }))
  }),
  echo: z.object({
    health_concern_input: z.string(),
    user_info_input: z.object({
      gender: z.string(),
      age_category: z.string(),
      age_specific: z.string(),
      age_unit: z.string()
    }),
    selected_cause_ids: z.array(z.string()),
    selected_symptom_ids: z.array(z.string()),
    therapeutic_property_ids: z.array(z.string())
  })
});

/**
 * Orchestrating Agent for Essential Oil Selection
 * 
 * This agent coordinates the parallel execution of specialized oil selection agents.
 * It receives therapeutic properties and user context, then uses the parallel execution
 * tool to find relevant essential oils for each property concurrently.
 */
export const createOilOrchestratorAgent = () => new Agent<OilOrchestratorContext, z.infer<typeof OilOrchestratorOutputSchema>>({
  name: 'oil_selection_orchestrator',
  
  instructions: (context) => `# Essential Oil Selection Orchestrator

You are the orchestrating agent responsible for coordinating the selection of essential oils based on therapeutic properties. Your role is to manage the parallel execution of specialized oil selection agents.

## Your Mission
Receive user data including therapeutic properties, health concerns, and context, then coordinate specialized agents to find the most relevant essential oils for each therapeutic property.

## Current Context
- Feature: ${context?.feature || 'create-recipe'}
- Step: ${context?.step || 'suggested-oils'}
- User Language: ${context?.user_language || 'PT_BR'}
- Request ID: ${context?.request_id || 'auto-generated'}

## Processing Strategy

### 1. Analyze Input Data
- Extract therapeutic properties from the user's input
- Identify health concern and user demographics
- Gather selected causes and symptoms for context
- Validate that all required data is present

### 2. Coordinate Parallel Execution
Use the \`find_oils_for_all_properties\` tool to:
- Execute specialized oil selection agents in parallel
- Each agent focuses on ONE therapeutic property
- Agents use vector search to find semantically similar oils
- Collect and combine results from all agents

### 3. Quality Assurance
- Ensure each therapeutic property has 5-8 relevant oil suggestions
- Verify that oil names exclude the word "Oil" or translations
- Confirm relevancy scores (1-5) are appropriate
- Validate that property IDs are preserved exactly

### 4. Response Formatting
- Format the combined results according to the API schema
- Include comprehensive metadata about the execution
- Provide echo data for verification
- Ensure all user-facing text is in the specified language

## Critical Requirements
- **Parallel Execution**: Use the parallel tool for efficiency
- **Property Focus**: Each agent handles exactly one therapeutic property
- **ID Preservation**: Never alter property IDs from input
- **Language Consistency**: All output in user's language (${context?.user_language || 'PT_BR'})
- **Quality Standards**: 5-8 high-quality oils per property
- **Safety Deferred**: Focus on property relevance, not safety

## Error Handling
- If parallel execution partially fails, return successful results
- Include metadata about any failed properties
- Provide helpful error messages for debugging
- Ensure the response format is always valid

## Success Criteria
- All therapeutic properties processed successfully
- Each property has relevant oil suggestions with rationales
- Response follows exact API schema format
- Execution completes efficiently using parallel processing`,

  model: 'gpt-4.1-nano',
  
  modelSettings: {
    temperature: 0.2,
    max_tokens: 6000,
    parallelToolCalls: true // Enable parallel tool execution
  },
  
  tools: parallelExecutionTools,
  
  outputType: OilOrchestratorOutputSchema,
  
  // Force the agent to use the parallel execution tool
  toolUseBehavior: 'run_llm_again'
});

/**
 * Input interface for orchestrator agent
 */
export interface OilOrchestratorInput {
  health_concern: string;
  demographics: {
    gender: string;
    age_category: string;
    age_specific: string;
  };
  selected_causes: Array<{
    cause_id: string;
    name_localized: string;
    explanation_localized: string;
  }>;
  selected_symptoms: Array<{
    symptom_id: string;
    name_localized: string;
    explanation_localized: string;
  }>;
  therapeutic_properties: Array<{
    property_id: string;
    property_name_localized: string;
    property_name_english: string;
    description_contextual_localized: string;
  }>;
  user_language: string;
}

/**
 * Helper function to create input for orchestrator agent
 */
export function createOrchestratorInput(input: OilOrchestratorInput): string {
  return JSON.stringify({
    task: "Find essential oils for therapeutic properties",
    instructions: "Use the parallel execution tool to find relevant essential oils for each therapeutic property based on the user's health concern and context.",
    data: input
  }, null, 2);
}

/**
 * Helper function to validate orchestrator output
 */
export function validateOrchestratorOutput(output: any): boolean {
  try {
    OilOrchestratorOutputSchema.parse(output);
    return true;
  } catch (error) {
    console.error('Orchestrator output validation failed:', error);
    return false;
  }
}
