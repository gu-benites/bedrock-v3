/**
 * @fileoverview Parallel execution tool for running multiple oil selection agents concurrently
 */

import { tool, run } from '@openai/agents';
import { z } from 'zod';
import { createOilSelectionAgent, createOilSelectionInput, type OilSelectionContext } from '../agents/oil-selection-agent';

/**
 * Parallel oil selection parameters schema
 */
const ParallelOilSelectionParams = z.object({
  therapeutic_properties: z.array(z.object({
    property_id: z.string(),
    property_name_localized: z.string(),
    property_name_english: z.string(),
    description_contextual_localized: z.string()
  })).min(1).max(10).describe('List of therapeutic properties to find oils for'),
  
  health_concern: z.string().describe('The primary health concern'),
  
  user_demographics: z.object({
    gender: z.string(),
    age_category: z.string(),
    age_specific: z.string()
  }).describe('User demographic information'),
  
  selected_causes: z.array(z.object({
    cause_id: z.string(),
    name_localized: z.string(),
    explanation_localized: z.string()
  })).describe('Selected causes from previous steps'),
  
  selected_symptoms: z.array(z.object({
    symptom_id: z.string(),
    name_localized: z.string(),
    explanation_localized: z.string()
  })).describe('Selected symptoms from previous steps'),
  
  user_language: z.string().default('PT_BR').describe('User language for localized responses')
});

/**
 * Parallel Oil Selection Tool
 * 
 * This tool orchestrates multiple specialized oil selection agents running in parallel.
 * Each agent focuses on finding oils for a single therapeutic property.
 * Results are collected and combined into a unified response.
 */
export const parallelOilSelectionTool = tool({
  name: 'find_oils_for_all_properties',
  description: `Execute parallel oil selection for multiple therapeutic properties.
  
  This tool runs specialized oil selection agents concurrently, with each agent focusing on 
  finding essential oils for a single therapeutic property. The parallel execution improves 
  performance and allows for specialized analysis per property.
  
  Use this tool when you have multiple therapeutic properties and need to find relevant 
  essential oils for each one based on the user's health concern and context.`,
  
  parameters: ParallelOilSelectionParams,
  
  execute: async (args, context) => {
    try {
      const { 
        therapeutic_properties, 
        health_concern, 
        user_demographics, 
        selected_causes, 
        selected_symptoms, 
        user_language 
      } = args;
      
      console.log(`🚀 Starting parallel oil selection for ${therapeutic_properties.length} properties`);
      
      // Create context for oil selection agents
      const oilSelectionContext: OilSelectionContext = {
        health_concern,
        user_demographics,
        selected_causes,
        selected_symptoms,
        user_language
      };
      
      // Create agent instance (will be reused for all properties)
      const oilSelectionAgent = createOilSelectionAgent();
      
      // Prepare parallel execution promises
      const parallelPromises = therapeutic_properties.map(async (property, index) => {
        try {
          console.log(`🔄 Starting agent ${index + 1}/${therapeutic_properties.length}: ${property.property_name_english}`);
          
          // Create input for this specific property
          const agentInput = createOilSelectionInput(property, {
            health_concern,
            user_demographics,
            selected_causes,
            selected_symptoms,
            user_language
          });
          
          // Run the specialized agent for this property
          const result = await run(oilSelectionAgent, agentInput, {
            context: oilSelectionContext,
            maxTurns: 5, // Allow multiple tool calls for comprehensive search
            stream: false // We'll handle streaming at the orchestrator level
          });
          
          console.log(`✅ Completed agent ${index + 1}/${therapeutic_properties.length}: ${property.property_name_english}`);
          
          return {
            property_id: property.property_id,
            property_name: property.property_name_english,
            success: true,
            result: result.finalOutput,
            execution_time: Date.now()
          };
          
        } catch (error) {
          console.error(`❌ Agent ${index + 1} failed for ${property.property_name_english}:`, error);
          
          return {
            property_id: property.property_id,
            property_name: property.property_name_english,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            execution_time: Date.now()
          };
        }
      });
      
      // Execute all agents in parallel
      console.log(`⚡ Executing ${parallelPromises.length} agents in parallel...`);
      const startTime = Date.now();
      
      const results = await Promise.all(parallelPromises);
      
      const endTime = Date.now();
      const totalExecutionTime = endTime - startTime;
      
      // Separate successful and failed results
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      console.log(`🎯 Parallel execution completed: ${successfulResults.length}/${results.length} successful`);
      console.log(`⏱️ Total execution time: ${totalExecutionTime}ms`);
      
      // Combine successful results into unified response
      const combinedData = {
        property_oil_suggestions: successfulResults.map(result => {
          if (result.result && typeof result.result === 'object' && 'data' in result.result) {
            return {
              therapeutic_property_context: result.result.data.therapeutic_property_context,
              suggested_oils: result.result.data.suggested_oils
            };
          }
          return null;
        }).filter(Boolean)
      };
      
      // Create unified response
      const unifiedResponse = {
        meta: {
          step_name: "Parallel Oil Selection",
          request_id: crypto.randomUUID(),
          timestamp_utc: new Date().toISOString(),
          version: "1.0.0",
          user_language,
          status: successfulResults.length > 0 ? "success" : "partial_failure",
          message: `Successfully processed ${successfulResults.length}/${results.length} therapeutic properties`
        },
        data: combinedData,
        execution_metadata: {
          total_properties: therapeutic_properties.length,
          successful_properties: successfulResults.length,
          failed_properties: failedResults.length,
          total_execution_time_ms: totalExecutionTime,
          parallel_execution: true,
          failed_property_ids: failedResults.map(r => r.property_id)
        },
        echo: {
          health_concern_input: health_concern,
          user_info_input: {
            gender: user_demographics.gender,
            age_category: user_demographics.age_category,
            age_specific: user_demographics.age_specific,
            age_unit: "years"
          },
          selected_cause_ids: selected_causes.map(c => c.cause_id),
          selected_symptom_ids: selected_symptoms.map(s => s.symptom_id),
          therapeutic_property_ids: therapeutic_properties.map(p => p.property_id)
        }
      };
      
      return JSON.stringify(unifiedResponse, null, 2);
      
    } catch (error) {
      console.error('🚨 Parallel oil selection tool failed:', error);
      
      return JSON.stringify({
        meta: {
          step_name: "Parallel Oil Selection",
          request_id: crypto.randomUUID(),
          timestamp_utc: new Date().toISOString(),
          version: "1.0.0",
          user_language: args.user_language,
          status: "error",
          message: `Parallel execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        data: {
          property_oil_suggestions: []
        },
        error: {
          type: "parallel_execution_error",
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }, null, 2);
    }
  },
  
  errorFunction: (context, error) => {
    console.error('🚨 Parallel oil selection tool execution failed:', error);
    return `Parallel oil selection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the therapeutic properties data and try again.`;
  }
});

/**
 * Export parallel execution tools
 */
export const parallelExecutionTools = [
  parallelOilSelectionTool
];
