// src/app/api/ai/streaming/route.ts
// Generic streaming API route using OpenAI Agents JS SDK patterns

import { NextRequest, NextResponse } from 'next/server';
import {
  Agent,
  run,
  setDefaultOpenAIKey,
  setOpenAIAPI
} from '@openai/agents';
import { parse } from 'best-effort-json-parser';
import { getPromptManager, PromptManagerError } from '@/lib/ai/utils/prompt-manager';
import {
  STREAMING_DATA_TYPES,
  isItemComplete,
  cleanItemData,
  getPrimaryDisplayField
} from '@/lib/ai/config/streaming-data-types';
import { vectorSearchTools } from '@/lib/ai/tools/vector-search-tool';
import { StreamingLogger } from '@/lib/debug/streaming-logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Configure OpenAI Agents SDK
if (process.env['OPENAI_API_KEY']) {
  setDefaultOpenAIKey(process.env['OPENAI_API_KEY']);
  setOpenAIAPI('responses'); // Use Responses API for structured outputs
}

// API timeout for AI requests (30 seconds)
const API_TIMEOUT = 30000;

// API configuration

/**
 * Simple request validation for testing
 */
function validateStreamingRequest(data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data.feature || typeof data.feature !== 'string') {
    errors.push('feature is required and must be a string');
  }

  if (!data.step || typeof data.step !== 'string') {
    errors.push('step is required and must be a string');
  }

  if (!data.data || typeof data.data !== 'object') {
    errors.push('data is required and must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Prepare template variables based on feature and step
 */
function prepareTemplateVariables(feature: string, data: any): Record<string, any> {
  // For recipe-wizard feature
  if (feature === 'recipe-wizard') {
    // Handle both nested demographics object and flat structure
    const demographics = data.demographics || data;
    return {
      healthConcern: data.healthConcern || data.health_concern || '',
      gender: demographics.gender || '',
      ageCategory: demographics.ageCategory || demographics.age_category || '',
      specificAge: demographics.specificAge || demographics.age_specific || demographics.age_value || '',
      language: demographics.language || demographics.user_language || 'en'
    };
  }

  // For create-recipe feature - properly structure template variables
  if (feature === 'create-recipe') {
    return {
      health_concern: data.health_concern || '',
      demographics: data.demographics || {},
      selected_causes: data.selected_causes || [],
      selected_symptoms: data.selected_symptoms || [],
      target_property: data.target_property || {},
      user_language: data.user_language || 'PT_BR'
    };
  }

  // Default: return data as-is for other features
  return data;
}



/**
 * Handle structured-only streaming (no text chunks, only structured data)
 * Uses best-effort-json-parser for bulletproof progressive parsing
 */
/**
 * Handle structured-only streaming (no text chunks, only structured data)
 * Uses best-effort-json-parser for bulletproof progressive parsing
 */
async function handleStructuredOnlyStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  logger?: StreamingLogger
): Promise<void> {
  console.log('[Structured-Only Streaming] Starting buffer-based structured processing');

  let buffer = '';
  let totalChunksProcessed = 0;
  let totalItemsSent = 0;
  let finalData: any = null;

  // Track sent items and counts per data type to prevent duplicates
  const sentItems = new Set<string>();
  const lastSentCounts = new Map<string, number>();

  // Use imported configuration for all supported data types

  /**
   * Generic helper to send complete items for any data type
   */
  const sendCompleteItems = (parsedData: any) => {
    if (!parsedData?.data || typeof parsedData.data !== 'object') {
      return;
    }

    // Dynamically detect and process all supported data types
    for (const [dataType, config] of Object.entries(STREAMING_DATA_TYPES)) {
      let items: any[] = [];

      // Handle special case for suggested_oils (nested in property_oil_suggestion)
      if (dataType === 'suggested_oils') {
        const propertyOilSuggestion = parsedData.data['property_oil_suggestion'];
        if (propertyOilSuggestion && propertyOilSuggestion.suggested_oils) {
          items = Array.isArray(propertyOilSuggestion.suggested_oils)
            ? propertyOilSuggestion.suggested_oils
            : [propertyOilSuggestion.suggested_oils];
        }
      } else {
        // Handle standard data types
        const data = parsedData.data[dataType];
        if (!data) {
          continue; // Skip if this data type is not present
        }
        items = Array.isArray(data) ? data : [data];
      }

      if (items.length === 0) {
        continue; // Skip if no items found
      }

      const lastSentCount = lastSentCounts.get(dataType) || 0;

      for (let i = lastSentCount; i < items.length; i++) {
        const item = items[i];

        if (isItemComplete(item, config)) {
          // Use nested value access for ID field (handles paths like 'therapeutic_property_context.property_id')
          const getNestedValue = (obj: any, path: string): any => {
            return path.split('.').reduce((current, key) => {
              return current && current[key] !== undefined ? current[key] : undefined;
            }, obj);
          };

          const itemId = getNestedValue(item, config.idField) || 'unknown';
          const itemKey = `${dataType}-${i}-${itemId}`;

          if (!sentItems.has(itemKey)) {
            const cleanData = cleanItemData(item, config);

            const sseEvent = `data: ${JSON.stringify({
              type: 'structured_data',
              field: dataType,
              index: i,
              data: cleanData,
              timestamp: new Date().toISOString()
            })}\n\n`;

            controller.enqueue(encoder.encode(sseEvent));
            sentItems.add(itemKey);
            totalItemsSent++;
            lastSentCounts.set(dataType, i + 1);

            const primaryField = getPrimaryDisplayField(dataType);
            console.log(`[Structured-Only Streaming] ✅ Sent complete ${config.displayName}:`, {
              index: i,
              name: cleanData[primaryField] || 'Unknown',
              totalSent: totalItemsSent,
              dataType
            });
          }
        }
      }
    }
  };

  // Process buffer using best-effort-json-parser (like reference code)
  const processBuffer = () => {
    try {
      // Use best-effort-json-parser to parse the buffer
      const parsed = parse(buffer);
      if (parsed) {
        sendCompleteItems(parsed);
      }
    } catch (error) {
      // Ignore parse errors - we'll try again with more data
    }
  };

  // Log buffer content for debugging
  const logBufferContent = (chunkCount: number) => {
    if (logger) {
      logger.writeLog(`Buffer content at chunk ${chunkCount} (${buffer.length} chars):`);
      logger.writeRawData({
        type: 'bufferSnapshot',
        chunkCount,
        bufferLength: buffer.length,
        bufferPreview: buffer.substring(0, 500),
        bufferSuffix: buffer.length > 500 ? buffer.substring(buffer.length - 100) : null
      });
    }
  };

  try {
    // Use toTextStream() to get character-by-character updates (like reference code)
    const textStream = result.toTextStream();

    for await (const textChunk of textStream) {
      buffer += textChunk;
      totalChunksProcessed++;

      // Process buffer every 50 chunks to reduce frequency (like reference code approach)
      if (totalChunksProcessed % 50 === 0) {
        processBuffer();
      }

      // Log progress every 200 chunks to avoid spam
      if (totalChunksProcessed % 200 === 0) {
        console.log('[Structured-Only Streaming] Progress:', {
          bufferLength: buffer.length,
          chunksProcessed: totalChunksProcessed,
          itemsSent: totalItemsSent
        });

        // Log buffer content for debugging
        logBufferContent(totalChunksProcessed);
      }
    }

    // Final processing to catch any remaining complete items
    processBuffer();

    console.log('[Structured-Only Streaming] Text streaming completed, waiting for final result');

    // Log final buffer content for debugging
    if (logger) {
      logger.writeLog(`Final buffer content (${buffer.length} chars):`);
      logger.writeRawData({
        type: 'finalBuffer',
        bufferLength: buffer.length,
        fullBuffer: buffer
      });
    }

    // Wait for completion and send final structured data
    await result.completed;
    finalData = result.finalOutput;

    if (finalData && typeof finalData === 'object') {
      // Final processing to ensure we have all complete items
      try {
        sendCompleteItems(finalData);

        const completionEvent = `data: ${JSON.stringify({
          type: 'structured_complete',
          data: finalData,
          stats: {
            totalChunksProcessed,
            totalItemsSent,
            finalBufferLength: buffer.length,
            itemsProcessed: sentItems.size
          },
          timestamp: new Date().toISOString()
        })}\n\n`;

        controller.enqueue(encoder.encode(completionEvent));
        console.log('[Structured-Only Streaming] ✅ Final completion sent:', {
          totalChunksProcessed,
          totalItemsSent,
          itemsProcessed: sentItems.size,
          finalOutputKeys: finalData ? Object.keys(finalData) : []
        });
      } catch (finalError) {
        console.error('[Structured-Only Streaming] ❌ Error sending final data:', finalError);
        // Don't throw here - we want to complete gracefully
      }
    }

    // Log agent result AFTER streaming completes (not before)
    if (logger) {
      logger.logAgentResult(result);
    }
  } catch (error) {
    console.error('[Structured-Only Streaming] ❌ Error processing final output:', error);
    // Don't try to send error events here - the controller might be closed
    // The error will be handled by the outer try-catch in the stream handler
  }
}

// Note: Manual extraction function removed since AI agent now provides complete structured output

/**
 * Handle traditional text streaming
 */
async function handleTextStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('[Text Streaming] Starting text stream processing');

  // Use toTextStream() as shown in the OpenAI Agents SDK examples
  const textStream = result.toTextStream();

  for await (const textChunk of textStream) {
    console.log('[Text Streaming] Text chunk received:', textChunk.length, 'chars');

    // Send text chunk as SSE
    const sseEvent = `data: ${JSON.stringify({
      type: 'text_chunk',
      content: textChunk
    })}\n\n`;
    controller.enqueue(encoder.encode(sseEvent));
  }

  // Wait for completion and get final result
  console.log('[Text Streaming] Waiting for completion');
  await result.completed;

  // Send completion event with final data
  const completionEvent = `data: ${JSON.stringify({
    type: 'completion',
    final_data: result.finalOutput || []
  })}\n\n`;
  controller.enqueue(encoder.encode(completionEvent));
}

// Note: Progressive data extraction function removed since AI agent now provides complete structured output

/**
 * POST handler for streaming requests
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartTime = Date.now();
  const traceId = `streaming-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // Initialize debug logger for this session
  const logger = new StreamingLogger(traceId);

  try {
    console.log('[Streaming API] Request started', { traceId });
    logger.writeLog(`Request started with traceId: ${traceId}`);

    // Validate API key
    if (!process.env['OPENAI_API_KEY']) {
      console.log('[Streaming API] No OpenAI API key configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Streaming API] API key validated');

    // Parse and validate request
    const requestData = await request.json();
    console.log('[Streaming API] Request data parsed', { feature: requestData.feature, step: requestData.step });

    // Check for streaming mode override
    const streamingMode = requestData.streamingMode || 'auto'; // 'auto', 'text', 'structured'
    console.log('[Streaming API] Streaming mode:', streamingMode);

    const validation = validateStreamingRequest(requestData);

    if (!validation.isValid) {
      console.log('[Streaming API] Request validation failed', validation.errors);
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.errors,
          traceId
        },
        { status: 400 }
      );
    }

    console.log('[Streaming API] Request validation passed');
    const { feature, step, data } = requestData;

    // Get prompt manager and load configuration
    console.log('[Streaming API] Getting prompt manager');
    const promptManager = getPromptManager();
    const templateVariables = prepareTemplateVariables(feature, data);
    console.log('[Streaming API] Template variables prepared', templateVariables);

    // Load prompt configuration
    console.log('[Streaming API] Loading prompt configuration for step:', step);
    const { prompt, config } = await promptManager.getProcessedPrompt(step, templateVariables);
    console.log('[Streaming API] Prompt loaded, length:', prompt.length);
    console.log('[Streaming API] Config loaded:', { model: config.config.model, hasSchema: !!config.schema });

    // Create AI agent with structured output
    console.log('[Streaming API] Creating AI agent with JSON schema');

    // Configure tools based on the step
    let agentTools: any[] = [];
    if (step === 'suggested-oils') {
      agentTools = vectorSearchTools;
      console.log('[Streaming API] Adding vector search tools for suggested-oils step');
    }

    const agent = new Agent({
      name: `${feature}-${step}-agent`,
      instructions: prompt,
      model: config.config.model || 'gpt-4o-mini',
      outputType: config.schema as any, // Use the JSON schema from YAML
      tools: agentTools.length > 0 ? agentTools : undefined
    });
    console.log('[Streaming API] Agent created with structured output and', agentTools.length, 'tools');

    // Run agent with streaming enabled
    console.log('[Streaming API] Starting agent execution with streaming');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT);
    });

    const agentPromise = run(agent, prompt, { stream: true });
    console.log('[Streaming API] Agent promise created, waiting for result');

    let result: any;
    try {
      result = await Promise.race([agentPromise, timeoutPromise]);
      console.log('[Streaming API] Agent execution started');
      logger.writeLog('Agent execution started');

      // All steps now use real-time streaming (including tool-based steps)
      console.log('[Streaming API] Starting real-time streaming for step:', step);
      logger.writeLog(`Starting real-time streaming for step: ${step}`);

    } catch (error) {
      console.log('[Streaming API] Agent execution failed', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        throw error; // Re-throw timeout errors to be handled in the catch block
      }
      throw error;
    }

    // Create SSE response with structured or text streaming
    console.log('[Streaming API] Creating SSE stream');
    const encoder = new TextEncoder();

    // Detect if we have structured output (JSON schema)
    const hasStructuredOutput = config.schema && config.schema['schema'];
    console.log('[Streaming API] Structured output detected:', hasStructuredOutput);
    console.log('[Streaming API] Config schema keys:', config.schema ? Object.keys(config.schema) : 'no schema');

    // Determine streaming mode (default to 'structured' if not specified)
    let finalStreamingMode = 'structured';
    if (['structured', 'text'].includes(streamingMode)) {
      finalStreamingMode = streamingMode;
    }
    console.log('[Streaming API] Final streaming mode:', finalStreamingMode);

    const stream = new ReadableStream({
      async start(controller) {
        const streamStartTime = Date.now();
        let streamingMode = 'unknown';

        try {
          // Use structured streaming for all steps with structured output
          if (finalStreamingMode === 'structured' && hasStructuredOutput) {
            streamingMode = 'structured';
            console.log('[Streaming API] 🚀 Starting structured streaming');
            await handleStructuredOnlyStreaming(result, controller, encoder, logger);
          } else {
            // Fall back to text mode if structured output is not available or text mode is explicitly requested
            streamingMode = 'text';
            console.log('[Streaming API] 🚀 Starting text streaming');
            await handleTextStreaming(result, controller, encoder);
          }

          const streamDuration = Date.now() - streamStartTime;
          console.log('[Streaming API] ✅ Stream completed successfully:', {
            mode: streamingMode,
            duration: streamDuration,
            traceId
          });

        } catch (error) {
          const streamDuration = Date.now() - streamStartTime;
          console.error('[Streaming API] ❌ Stream error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            mode: streamingMode,
            duration: streamDuration,
            traceId
          });

          // Send comprehensive error event
          try {
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown streaming error',
              mode: streamingMode,
              duration: streamDuration,
              traceId,
              timestamp: new Date().toISOString(),
              recovery: 'Stream terminated due to error. Please try again.'
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
          } catch (errorEventError) {
            console.error('[Streaming API] ❌ Failed to send error event:', errorEventError);
          }
        } finally {
          try {
            controller.close();
            console.log('[Streaming API] 🔒 Stream controller closed');
            logger.close();
          } catch (closeError) {
            console.error('[Streaming API] ❌ Error closing stream controller:', closeError);
          }
        }
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;

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
          error: 'timeout',
          message: 'AI analysis took too long. Please try again.',
          traceId,
          duration_ms: totalDuration
        },
        { status: 408 }
      );
    }

    console.error('Error in streaming API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        error: 'An error occurred while processing your request.',
        details: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET handler - returns API status and configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    const hasApiKey = !!process.env['OPENAI_API_KEY'];

    return NextResponse.json({
      status: 'healthy',
      service: 'AI Streaming API',
      version: '1.0.0',
      configured: hasApiKey,
      features: ['recipe-wizard'],
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
