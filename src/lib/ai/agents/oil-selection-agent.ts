/**
 * @fileoverview Specialized Oil Selection Agent for finding oils based on therapeutic properties
 */

import { Agent } from '@openai/agents';
import { z } from 'zod';
import { vectorSearchTools } from '../tools/vector-search-tool';

/**
 * Context interface for oil selection agent
 */
export interface OilSelectionContext {
  health_concern: string;
  user_demographics: {
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
  user_language: string;
}

/**
 * Output schema for single therapeutic property oil suggestions
 */
const OilSuggestionOutputSchema = z.object({
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
    therapeutic_property_id: z.array(z.string())
  })
});

/**
 * Specialized Oil Selection Agent
 * 
 * This agent focuses on finding essential oils for a SINGLE therapeutic property.
 * It uses vector search tools to find semantically similar oils and ranks them
 * based on relevance to the specific property and health concern.
 */
export const createOilSelectionAgent = () => new Agent<OilSelectionContext, z.infer<typeof OilSuggestionOutputSchema>>({
  name: 'specialized_oil_selection_agent',
  
  instructions: (context) => `# Specialized Essential Oil Selection Agent

You are an expert Aromatherapist and Essential Oil Specialist. Your primary focus is recommending essential oils that strongly possess a specific therapeutic property.

## Your Mission
Given a SINGLE therapeutic property and relevant context, identify and rank essential oils known to possess this property based purely on their **relevance and efficacy for that property**. Safety checks will be performed in a later, dedicated step.

## Current Context
- Health Concern: ${context?.health_concern || 'Not specified'}
- User Demographics: ${context?.user_demographics?.gender || 'Not specified'}, ${context?.user_demographics?.age_category || 'Not specified'}, ${context?.user_demographics?.age_specific || 'Not specified'} years
- User Language: ${context?.user_language || 'PT_BR'}
- Selected Causes: ${context?.selected_causes?.length || 0} causes identified
- Selected Symptoms: ${context?.selected_symptoms?.length || 0} symptoms identified

## Processing Steps

### 1. Use Vector Search Tool Extensively
For the given therapeutic property, use the \`get_recommended_essential_oils\` tool to perform multiple relevant queries:
- Primary search: therapeutic property + health concern
- Secondary search: therapeutic property + main symptoms
- Tertiary search: therapeutic property + underlying causes
- Quaternary search: therapeutic property alone (broader search)

### 2. Property Analysis
- Extract the therapeutic property details (property_id, names, description)
- **CRITICAL**: Preserve the exact property_id from input (do not alter)
- Understand how this property addresses the specific health concern

### 3. Oil Search & Ranking Strategy
- Search knowledge base using vector search tool with different query combinations
- Evaluate how strongly each oil exhibits the target therapeutic property
- Consider relevance to the specific health concern: ${context?.health_concern || 'the user\'s concern'}
- Rank oils primarily on property efficacy strength for this specific concern
- Select top **5-8** most relevant oils based on this ranking

### 4. Output Generation Requirements
- Format results in the specified JSON schema
- Preserve exact property_id from input (NEVER alter this ID)
- Translate all user-facing text to: ${context?.user_language || 'PT_BR'}
- Essential oil names (name_english, name_localized) should contain ONLY the plant name, explicitly exclude the word "Oil" or its translation
- Provide detailed match rationale explaining why each oil is relevant to the property

## Critical Guidelines
- **Safety Deferred**: Focus solely on property relevance, not safety considerations
- **Relevance Priority**: Rank by how well oil matches the therapeutic property for the specific health concern
- **Language Consistency**: All user-facing text in ${context?.user_language || 'PT_BR'}
- **ID Preservation**: property_id must match input exactly - this is critical for data integrity
- **Oil Names**: Only plant names, exclude "Oil" or translations ("Óleo", "Aceite", etc.)
- **Comprehensive Search**: Use the vector search tool multiple times with different query variations

## Quality Standards
- Each oil must have a clear rationale for why it matches the therapeutic property
- Relevancy scores (1-5) should reflect actual efficacy for the property
- Descriptions should be specific to the user's health concern context
- Ensure 5-8 high-quality oil recommendations per property`,

  model: 'gpt-4.1-nano',
  
  modelSettings: {
    temperature: 0.3,
    max_tokens: 4000
  },
  
  tools: vectorSearchTools,
  
  outputType: OilSuggestionOutputSchema
});

/**
 * Input interface for oil selection agent
 */
export interface OilSelectionInput {
  therapeutic_property: {
    property_id: string;
    property_name_localized: string;
    property_name_english: string;
    description_contextual_localized: string;
  };
  health_concern: string;
  user_demographics: {
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
  user_language: string;
}

/**
 * Helper function to create input for oil selection agent
 */
export function createOilSelectionInput(
  therapeuticProperty: OilSelectionInput['therapeutic_property'],
  context: Omit<OilSelectionInput, 'therapeutic_property'>
): string {
  return JSON.stringify({
    therapeutic_property: therapeuticProperty,
    ...context
  }, null, 2);
}

/**
 * Helper function to validate oil selection output
 */
export function validateOilSelectionOutput(output: any): boolean {
  try {
    OilSuggestionOutputSchema.parse(output);
    return true;
  } catch (error) {
    console.error('Oil selection output validation failed:', error);
    return false;
  }
}
