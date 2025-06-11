/**
 * @fileoverview API route handler for Recipe Wizard using OpenAI Agents SDK.
 * Handles AI agent requests for analyzing health concerns and generating recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Agent,
  run,
  setDefaultOpenAIKey,
  setOpenAIAPI,
  withTrace,
  JsonSchemaDefinition
} from '@openai/agents';
import { z } from 'zod';
import { getServerLogger } from '@/lib/logger';
import { getPromptManager, PromptManagerError } from '@/features/recipe-wizard/services/prompt-manager';
import type { PotentialCause } from '@/features/recipe-wizard/types/recipe-wizard.types';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Configure OpenAI Agents SDK
if (process.env['OPENAI_API_KEY']) {
  setDefaultOpenAIKey(process.env['OPENAI_API_KEY']);
  setOpenAIAPI('responses'); // Use Responses API for structured outputs
}

const logger = getServerLogger();

// API timeout for AI requests (30 seconds)
const API_TIMEOUT = 30000;

// Tracing configuration
const TRACE_CONFIG = {
  workflowName: 'Recipe Wizard AI Analysis',
  traceIncludeSensitiveData: false, // Exclude sensitive data for privacy
  tracingDisabled: process.env['OPENAI_AGENTS_DISABLE_TRACING'] === '1'
};



/**
 * Request validation schema - matches frontend format
 */
const RequestSchema = z.object({
  healthConcern: z.object({
    healthConcern: z.string().min(10).max(500)
  }),
  demographics: z.object({
    gender: z.enum(['male', 'female']),
    ageCategory: z.enum(['child', 'teen', 'adult', 'senior']),
    specificAge: z.number().min(1).max(120),
    language: z.enum(['pt', 'en', 'es', 'fr', 'PT_BR', 'EN_US', 'ES_ES', 'FR_FR'])
  })
});

/**
 * API error response interface
 */
interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  step?: string;
}

/**
 * Creates an error response with consistent structure
 */
function createErrorResponse(
  message: string,
  status: number = 500,
  error?: string,
  step?: string
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error: error || 'Internal Server Error',
    message,
    status,
    timestamp: new Date().toISOString(),
    ...(step && { step })
  };
  
  return NextResponse.json(errorResponse, { status });
}

/**
 * Creates an AI agent for potential causes analysis with structured output
 */
async function createPotentialCausesAgent(promptConfig: any): Promise<Agent<unknown, JsonSchemaDefinition>> {
  const startTime = Date.now();

  try {
    console.log('🔧 Creating OpenAI Agents JS SDK agent...');
    console.log(`   Model: ${promptConfig.config.model || 'gpt-4o-mini'}`);
    console.log(`   Temperature: ${promptConfig.config.temperature || 0.3}`);
    console.log(`   Max Tokens: ${promptConfig.config.max_tokens || 1500}`);
    console.log(`   Template Length: ${promptConfig.template?.length || 0} chars`);
    console.log(`   Structured Output: ${!!promptConfig.schema ? 'Yes' : 'No'}`);

    logger.info('Creating AI agent for potential causes analysis', {
      operation: 'createPotentialCausesAgent',
      model: promptConfig.config.model || 'gpt-4o-mini',
      temperature: promptConfig.config.temperature || 0.3,
      maxTokens: promptConfig.config.max_tokens || 1500,
      templateLength: promptConfig.template?.length || 0,
      structuredOutput: true
    });

    // Create agent with prompt and structured output configuration
    const agent = new Agent({
      name: 'Recipe Wizard Potential Causes Agent',
      instructions: promptConfig.template,
      model: promptConfig.config.model || 'gpt-4o-mini',
      modelSettings: {
        temperature: promptConfig.config.temperature || 0.3,
        maxTokens: promptConfig.config.max_tokens || 1500,
        topP: promptConfig.config.top_p || 0.9,
        frequencyPenalty: promptConfig.config.frequency_penalty || 0.1,
        presencePenalty: promptConfig.config.presence_penalty || 0.1
      },
      outputType: promptConfig.schema as JsonSchemaDefinition // Use schema from YAML config
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Agent created successfully in ${duration}ms`);
    console.log(`   Agent Name: ${agent.name}`);
    console.log(`   Output Type: json_schema`);
    console.log(`   Schema Name: ${promptConfig.schema?.['name'] || 'potential_causes_response'}`);

    logger.info('AI agent created successfully', {
      operation: 'createPotentialCausesAgent',
      agentName: agent.name,
      duration_ms: duration,
      outputType: 'json_schema',
      schemaName: promptConfig.schema?.name || 'potential_causes_response'
    });

    return agent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to create AI agent', {
      operation: 'createPotentialCausesAgent',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration
    });
    throw error;
  }
}

/**
 * Determines which Recipe Wizard step is being requested based on request data structure.
 * Uses YAGNI principle - only implements detection for existing steps.
 *
 * @param requestData - The validated request data
 * @returns The step name for prompt loading (defaults to 'potential-causes' for backward compatibility)
 */
function determineStepFromRequest(requestData: any): string {
  // For now, we only support potential-causes step
  // Future steps can be detected by checking for specific data structures:
  // - If selectedCauses exists: 'potential-symptoms'
  // - If selectedSymptoms exists: 'therapeutic-properties'
  // - etc.

  // Default to potential-causes for backward compatibility
  return 'potential-causes';
}

/**
 * Prepares template variables for prompt processing
 */
function prepareTemplateVariables(requestData: any): Record<string, any> {
  return {
    healthConcern: requestData.healthConcern.healthConcern,
    gender: requestData.demographics.gender,
    ageCategory: requestData.demographics.ageCategory,
    specificAge: requestData.demographics.specificAge,
    language: requestData.demographics.language,
    sessionId: 'recipe-wizard-session' // Generate or use a default session ID
  };
}

/**
 * AI Response type that matches the YAML schema
 */
interface AIResponseCause {
  cause_id: string;
  cause_name: string;
  cause_description: string;
  relevancy_score: number;
  medical_context: string;
}

interface AIResponse {
  health_concern_analysis: string;
  potential_causes: AIResponseCause[];
  confidence_level: number;
  medical_disclaimer: string;
}

/**
 * Transform AI response to match frontend expectations
 * Handles the new structured output format with meta, data, and echo sections
 * Prepared for future steps while maintaining backward compatibility
 *
 * @param aiResponse - The AI response from OpenAI Agents SDK
 * @param stepName - The step name for step-specific transformation (future use)
 * @returns Transformed data for the frontend
 */
function transformAIResponse(aiResponse: any, stepName: string = 'potential-causes'): PotentialCause[] {
  // For now, only handle potential-causes step (YAGNI principle)
  // Future steps can add their own transformation logic here
  if (stepName === 'potential-causes') {
    return transformPotentialCausesResponse(aiResponse);
  }

  // Fallback to potential-causes for unknown steps (backward compatibility)
  console.log(`⚠️  Unknown step "${stepName}", falling back to potential-causes transformation`);
  return transformPotentialCausesResponse(aiResponse);
}

/**
 * Transform potential causes response specifically
 * Separated for clarity and future maintainability
 */
function transformPotentialCausesResponse(aiResponse: any): PotentialCause[] {
  // Handle the new structured output format
  if (aiResponse?.data?.potential_causes) {
    console.log('🔄 Using new structured output format (data.potential_causes)');
    return aiResponse.data.potential_causes.map((cause: any) => ({
      cause_id: cause.cause_id,
      name_localized: cause.name_localized,
      suggestion_localized: cause.suggestion_localized,
      explanation_localized: cause.explanation_localized
    }));
  }

  // Fallback to old format for backward compatibility
  if (aiResponse?.potential_causes) {
    console.log('🔄 Using legacy format (potential_causes)');
    return aiResponse.potential_causes.map((cause: any) => ({
      cause_id: cause.cause_id,
      name_localized: cause.cause_name || cause.name_localized,
      suggestion_localized: cause.cause_description || cause.suggestion_localized,
      explanation_localized: cause.medical_context || cause.explanation_localized
    }));
  }

  console.log('❌ No potential_causes found in AI response');
  console.log('📋 Available keys:', Object.keys(aiResponse || {}));
  throw new Error('Invalid AI response format: missing potential_causes data');
}

/**
 * POST handler for recipe wizard AI analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartTime = Date.now();

  // Generate unique trace ID for this request
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  return withTrace(
    TRACE_CONFIG.workflowName,
    async () => {
      try {
        // Validate API key
        if (!process.env['OPENAI_API_KEY']) {
          logger.error('OpenAI API key not configured', {
            operation: 'POST /api/recipe-wizard',
            traceId
          });
          return NextResponse.json(
            { error: 'OpenAI API key not configured' },
            { status: 500 }
          );
        }

        console.log('\n📥 STEP 1: Request Received & Validation');
        console.log(`🔑 API Key: ${process.env['OPENAI_API_KEY'] ? '✅ Configured' : '❌ Missing'}`);
        console.log(`🔍 Tracing: ${!TRACE_CONFIG.tracingDisabled ? '✅ Enabled' : '❌ Disabled'}`);

        logger.info('Recipe Wizard AI request started', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          timestamp: new Date().toISOString(),
          tracingEnabled: !TRACE_CONFIG.tracingDisabled
        });

        // Parse and validate request body
        console.log('📋 Parsing request body...');
        const body = await request.json();
        console.log('📋 Raw request body:', JSON.stringify(body, null, 2));

        console.log('✅ Validating request schema...');
        const validatedData = RequestSchema.parse(body);

        console.log('\n📊 VALIDATED REQUEST DATA:');
        console.log(`🏥 Health Concern: "${validatedData.healthConcern.healthConcern}" (${validatedData.healthConcern.healthConcern.length} chars)`);
        console.log(`👤 Demographics:`);
        console.log(`   - Gender: ${validatedData.demographics.gender}`);
        console.log(`   - Age Category: ${validatedData.demographics.ageCategory}`);
        console.log(`   - Specific Age: ${validatedData.demographics.specificAge}`);
        console.log(`   - Language: ${validatedData.demographics.language}`);
        console.log(`🆔 Trace ID: ${traceId}`);

        logger.info('Request validation completed', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          healthConcernLength: validatedData.healthConcern.healthConcern.length,
          demographics: {
            gender: validatedData.demographics.gender,
            ageCategory: validatedData.demographics.ageCategory,
            language: validatedData.demographics.language
          }
        });

        // Get prompt manager and load configuration
        console.log('\n🔧 STEP 2: Loading Prompt Configuration');
        const promptLoadStartTime = Date.now();
        console.log('📁 Initializing prompt manager...');
        const promptManager = getPromptManager();

        console.log('🔄 Preparing template variables...');
        const templateVariables = prepareTemplateVariables(validatedData);
        console.log('📝 Template variables:', JSON.stringify(templateVariables, null, 2));

        // Determine which step is being requested (dynamic for future extensibility)
        const stepName = determineStepFromRequest(validatedData);
        console.log(`🎯 Detected step: "${stepName}"`);

        // Load and process the prompt for the detected step
        console.log(`📋 Loading "${stepName}" prompt configuration...`);
        const { config: promptConfig } = await promptManager.getProcessedPrompt(
          stepName,
          templateVariables
        );

        const promptLoadDuration = Date.now() - promptLoadStartTime;
        console.log('\n✅ PROMPT CONFIGURATION LOADED:');
        console.log(`⏱️  Load Duration: ${promptLoadDuration}ms`);
        console.log(`🤖 Model: ${promptConfig.config.model || 'gpt-4o-mini'}`);
        console.log(`🌡️  Temperature: ${promptConfig.config.temperature || 0.3}`);
        console.log(`📏 Max Tokens: ${promptConfig.config.max_tokens || 1500}`);
        console.log(`📊 Schema Type: ${promptConfig.schema?.['type'] || 'unknown'}`);
        console.log(`📋 Schema Name: ${promptConfig.schema?.['name'] || 'unknown'}`);
        console.log(`📝 Template Length: ${promptConfig.template?.length || 0} chars`);

        logger.info('Prompt configuration loaded', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          promptLoadDuration_ms: promptLoadDuration,
          model: promptConfig.config.model,
          temperature: promptConfig.config.temperature
        });

        // Create AI agent for the detected step
        console.log('\n🤖 STEP 3: Creating AI Agent');
        const agentCreationStartTime = Date.now();
        console.log('⚙️  Creating OpenAI Agents JS SDK agent...');
        console.log(`🎯 Step: "${stepName}"`);
        const agent = await createPotentialCausesAgent(promptConfig);
        const agentCreationDuration = Date.now() - agentCreationStartTime;

        console.log('\n✅ AI AGENT CREATED:');
        console.log(`⏱️  Creation Duration: ${agentCreationDuration}ms`);
        console.log(`🏷️  Agent Name: ${agent.name}`);
        console.log(`🔧 Agent Model: ${promptConfig.config.model || 'gpt-4o-mini'}`);

        // Create input message for the agent
        console.log('\n📝 STEP 4: Preparing Agent Input');
        const agentInput = `Please analyze the following information and provide your response according to the instructions:

Health Concern: ${validatedData.healthConcern.healthConcern}
Demographics: ${validatedData.demographics.gender}, ${validatedData.demographics.ageCategory}, age ${validatedData.demographics.specificAge}
Language: ${validatedData.demographics.language}

Please provide a comprehensive analysis identifying 4-6 potential causes that could contribute to this health concern, focusing on factors that can be addressed with aromatherapy approaches.`;

        console.log('\n📋 AGENT INPUT MESSAGE:');
        console.log('─'.repeat(80));
        console.log(agentInput);
        console.log('─'.repeat(80));
        console.log(`📏 Input Length: ${agentInput.length} characters`);

        logger.info('Starting AI agent execution', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          agentCreationDuration_ms: agentCreationDuration,
          inputLength: agentInput.length,
          agentName: agent.name
        });

        // Run the AI agent with timeout and enhanced tracing
        console.log('\n🚀 STEP 5: Executing AI Agent');
        console.log('⏳ Starting AI execution with OpenAI Agents JS SDK...');
        console.log(`⏰ Timeout: ${API_TIMEOUT / 1000} seconds`);
        console.log(`🔍 Tracing: ${!TRACE_CONFIG.tracingDisabled ? 'Enabled' : 'Disabled'}`);

        const aiExecutionStartTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT);
        });

        console.log('🔄 Calling OpenAI API via Agents SDK...');
        const agentPromise = run(agent, agentInput);

        const result = await Promise.race([agentPromise, timeoutPromise]) as any;
        const aiExecutionDuration = Date.now() - aiExecutionStartTime;

        console.log('\n✅ AI EXECUTION COMPLETED:');
        console.log(`⏱️  Execution Duration: ${aiExecutionDuration}ms`);
        console.log(`📊 Result Type: ${typeof result}`);
        console.log(`✅ Has Result: ${!!result ? 'Yes' : 'No'}`);
        console.log(`📤 Has Final Output: ${!!result?.finalOutput ? 'Yes' : 'No'}`);

        if (result?.finalOutput) {
          console.log('\n📋 RAW AI RESPONSE:');
          console.log('─'.repeat(80));
          console.log(JSON.stringify(result.finalOutput, null, 2));
          console.log('─'.repeat(80));
        } else {
          console.log('\n⚠️  NO FINAL OUTPUT IN RESULT');
          console.log('📋 Full result structure:', JSON.stringify(result, null, 2));
        }

        logger.info('AI agent execution completed', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          aiExecutionDuration_ms: aiExecutionDuration,
          hasResult: !!result,
          hasFinalOutput: !!result?.finalOutput
        });

        // Transform AI response to match frontend expectations
        console.log('\n🔄 STEP 6: Transforming AI Response');
        const transformStartTime = Date.now();
        console.log('⚙️  Converting AI response to frontend format...');
        console.log(`🎯 Step: "${stepName}"`);
        console.log('📋 Input to transformAIResponse:', JSON.stringify(result.finalOutput, null, 2));
        const potentialCauses = transformAIResponse(result.finalOutput as AIResponse, stepName);
        const transformDuration = Date.now() - transformStartTime;

        console.log('\n✅ RESPONSE TRANSFORMATION COMPLETED:');
        console.log(`⏱️  Transform Duration: ${transformDuration}ms`);
        console.log(`📊 Potential Causes Count: ${potentialCauses.length}`);

        const totalDuration = Date.now() - requestStartTime;

        console.log('\n📤 STEP 7: Preparing Final Response');
        console.log(`📊 Final Potential Causes Count: ${potentialCauses.length}`);

        if (potentialCauses.length > 0) {
          console.log('\n📋 POTENTIAL CAUSES SUMMARY:');
          potentialCauses.forEach((cause, index) => {
            console.log(`${index + 1}. ${cause.name_localized} (ID: ${cause.cause_id})`);
          });
        }

        logger.info('Recipe Wizard AI request completed successfully', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          causesCount: potentialCauses.length,
          transformDuration_ms: transformDuration,
          totalDuration_ms: totalDuration,
          performance: {
            promptLoad_ms: promptLoadDuration,
            agentCreation_ms: agentCreationDuration,
            aiExecution_ms: aiExecutionDuration,
            transform_ms: transformDuration,
            total_ms: totalDuration
          }
        });

        const finalResponse = {
          success: true,
          data: potentialCauses,
          meta: {
            timestamp: new Date().toISOString(),
            count: potentialCauses.length,
            service: 'recipe-wizard-ai',
            traceId,
            performance: {
              total_duration_ms: totalDuration,
              ai_execution_ms: aiExecutionDuration
            }
          }
        };

        console.log('\n🎉 ===== RECIPE WIZARD AI REQUEST COMPLETED =====');
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📋 Trace ID: ${traceId}`);
        console.log(`✅ Status: SUCCESS`);
        console.log(`📊 Potential Causes: ${potentialCauses.length}`);
        console.log(`🔧 Performance Breakdown:`);
        console.log(`   - Prompt Load: ${promptLoadDuration}ms`);
        console.log(`   - Agent Creation: ${agentCreationDuration}ms`);
        console.log(`   - AI Execution: ${aiExecutionDuration}ms`);
        console.log(`   - Response Transform: ${transformDuration}ms`);
        console.log('═'.repeat(60));

        // Return successful response
        return NextResponse.json(finalResponse);

      } catch (error) {
        const totalDuration = Date.now() - requestStartTime;

        console.log('\n❌ ===== RECIPE WIZARD AI REQUEST FAILED =====');
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📋 Trace ID: ${traceId}`);
        console.log(`❌ Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`);
        console.log(`💬 Error Message: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          console.log(`📚 Stack Trace:`);
          console.log(error.stack);
        }
        console.log('═'.repeat(60));

        logger.error('Recipe Wizard AI request failed', {
          operation: 'POST /api/recipe-wizard',
          traceId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          totalDuration_ms: totalDuration
        });

        // Handle validation errors
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Invalid request data',
              details: error.errors,
              traceId
            },
            { status: 400 }
          );
        }

        // Handle prompt manager errors
        if (error instanceof PromptManagerError) {
          return NextResponse.json(
            {
              error: 'Failed to load AI configuration',
              message: error.message,
              traceId
            },
            { status: 500 }
          );
        }

        // Handle timeout errors
        if (error instanceof Error && error.message.includes('timeout')) {
          return NextResponse.json(
            {
              error: 'Request timeout',
              message: 'AI analysis took too long. Please try again.',
              traceId,
              duration_ms: totalDuration
            },
            { status: 408 }
          );
        }

        // Generic error response
        return NextResponse.json(
          {
            error: 'Recipe Wizard AI analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            traceId,
            duration_ms: totalDuration
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * GET handler - returns API status and configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    const hasApiKey = !!process.env['OPENAI_API_KEY'];

    return NextResponse.json({
      status: 'healthy',
      service: 'Recipe Wizard AI API',
      version: '1.0.0',
      configured: hasApiKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
