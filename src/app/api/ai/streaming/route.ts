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
  encoder: TextEncoder
): Promise<void> {
  console.log('[Structured-Only Streaming] Starting buffer-based structured processing');

  let buffer = '';
  let totalChunksProcessed = 0;
  let totalItemsSent = 0;
  let lastSentItemCount = 0;
  let finalData: any = null;

  // Track sent items to prevent duplicates
  const sentItems = new Set<string>();

  // Helper to send complete items only
  const sendCompleteItems = (parsedData: any) => {
    if (!parsedData?.data?.potential_causes || !Array.isArray(parsedData.data.potential_causes)) {
      return;
    }

    const causes = parsedData.data.potential_causes;

    // Only process items we haven't sent yet
    for (let i = lastSentItemCount; i < causes.length; i++) {
      const cause = causes[i];
      if (!cause || typeof cause !== 'object' || !cause.cause_id) continue;

      // Check if this cause is truly complete (not partial)
      const hasCompleteFields =
        cause.name_localized && cause.name_localized.length > 10 &&
        cause.suggestion_localized && cause.suggestion_localized.length > 20 &&
        cause.explanation_localized && cause.explanation_localized.length > 30 &&
        !cause.name_localized.endsWith('...') &&
        !cause.suggestion_localized.endsWith('...') &&
        !cause.explanation_localized.endsWith('...');

      if (hasCompleteFields) {
        const itemKey = `${i}-${cause.cause_id}`;

        // Only send if we haven't sent this exact item before
        if (!sentItems.has(itemKey)) {
          const cleanData = {
            cause_id: cause.cause_id,
            name_localized: cause.name_localized.trim(),
            suggestion_localized: cause.suggestion_localized.trim(),
            explanation_localized: cause.explanation_localized.trim(),
            ...(cause.confidence && { confidence: cause.confidence }),
            ...(cause.tags && { tags: cause.tags })
          };

          const sseEvent = `data: ${JSON.stringify({
            type: 'structured_data',
            field: 'potential_causes',
            index: i,
            data: cleanData,
            timestamp: new Date().toISOString()
          })}\n\n`;

          controller.enqueue(encoder.encode(sseEvent));
          sentItems.add(itemKey);
          totalItemsSent++;
          lastSentItemCount = i + 1;

          console.log('[Structured-Only Streaming] ✅ Sent complete item:', {
            index: i,
            name: cleanData.name_localized,
            totalSent: totalItemsSent
          });
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
      }
    }

    // Final processing to catch any remaining complete items
    processBuffer();

    console.log('[Structured-Only Streaming] Text streaming completed, waiting for final result');

    // Wait for completion and send final structured data
    await result.completed;
    finalData = result.finalOutput;

    if (finalData && typeof finalData === 'object') {
      // Final processing to ensure we have all complete items
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
    }
  } catch (error) {
    console.error('[Structured-Only Streaming] ❌ Error processing final output:', error);

    // Send error event
    const errorEvent = `data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown completion error',
      timestamp: new Date().toISOString(),
      recovery: 'Streaming completed with errors. Some data may be incomplete.'
    })}\n\n`;
    
    try {
      controller.enqueue(encoder.encode(errorEvent));
    } catch (e) {
      console.error('Failed to send error event:', e);
    }
  }
}

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

/**
 * Extract progressive data from accumulated JSON text using best-effort-json-parser
 * This is bulletproof and works with any JSON structure
 */
/**
 * Extract progressive data from accumulated JSON text using best-effort-json-parser
 * This ensures we only send complete items with all required fields
 */
function extractProgressiveData(accumulatedText: string, lastSentLength: number): {
  newItems: Array<{ index: number; data: any }>;
  totalSent: number;
} {
  const newItems: Array<{ index: number; data: any }> = [];
  
  try {
    // Use best-effort-json-parser to parse the accumulated text
    const parsed = parse(accumulatedText);
    if (!parsed || typeof parsed !== 'object') {
      return { newItems, totalSent: lastSentLength };
    }

    // Check if we have a valid structure with potential_causes
    if (parsed.data?.potential_causes && Array.isArray(parsed.data.potential_causes)) {
      const causes = parsed.data.potential_causes;
      let highestCompleteIndex = -1;
      let hasIncompleteCauses = false;

      // Process all causes, but only return new ones
      for (let i = 0; i < causes.length; i++) {
        const cause = causes[i];

        // Check if this cause has all required fields and meaningful content
        if (cause && typeof cause === 'object' && cause.cause_id) {
          const hasName = cause.name_localized?.length > 0;
          const hasSuggestion = cause.suggestion_localized?.length > 0;
          const hasExplanation = cause.explanation_localized?.length > 0;
          
          // We need all three fields to be present to consider it complete
          const isComplete = hasName && hasSuggestion && hasExplanation;
          
          if (isComplete) {
            // Only process new causes we haven't sent yet
            if (i >= lastSentLength) {
              // Create a clean data object with all required fields
              const cleanData = {
                cause_id: cause.cause_id,
                name_localized: cause.name_localized,
                suggestion_localized: cause.suggestion_localized,
                explanation_localized: cause.explanation_localized,
                // Include any additional fields
                ...(cause.confidence && { confidence: cause.confidence }),
                ...(cause.tags && { tags: cause.tags })
              };

              console.log('[Progressive Data] ✅ Complete cause found:', {
                index: i,
                name: cleanData.name_localized,
                suggestionLength: cleanData.suggestion_localized.length,
                explanationLength: cleanData.explanation_localized.length
              });

              newItems.push({
                index: i,
                data: cleanData
              });
            }
            highestCompleteIndex = i;
          } else {
            hasIncompleteCauses = true;
            if (i >= lastSentLength) {
              console.log('[Progressive Data] ⏳ Incomplete cause:', {
                index: i,
                hasName,
                hasSuggestion,
                hasExplanation,
                name: cause.name_localized || 'Unnamed',
                suggestionLength: cause.suggestion_localized?.length || 0,
                explanationLength: cause.explanation_localized?.length || 0
              });
            }
          }
        }
      }


      // If we found any complete items, return them
      if (newItems.length > 0) {
        return { 
          newItems, 
          totalSent: Math.max(lastSentLength, highestCompleteIndex + 1)
        };
      }
      
      // If we have incomplete causes but no new complete ones, update the count
      // This helps with cases where we're still streaming in the data
      if (hasIncompleteCauses && causes.length > lastSentLength) {
        return { newItems, totalSent: causes.length };
      }
    }
  } catch (error) {
    console.log('[Progressive Data] Parse attempt failed, waiting for more data');
  }
  
  // If we get here, no new complete items were found
  return { newItems, totalSent: lastSentLength };
}

/**
 * POST handler for streaming requests
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartTime = Date.now();
  const traceId = `streaming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('[Streaming API] Request started', { traceId });

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
    const agent = new Agent({
      name: `${feature}-${step}-agent`,
      instructions: prompt,
      model: config.config.model || 'gpt-4o-mini',
      outputType: config.schema as any // Use the JSON schema from YAML
    });
    console.log('[Streaming API] Agent created with structured output');

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
      console.log('[Streaming API] Agent execution completed');
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
          // Determine and execute the appropriate streaming mode
          if (finalStreamingMode === 'structured' && hasStructuredOutput) {
            streamingMode = 'structured';
            console.log('[Streaming API] 🚀 Starting structured streaming');
            await handleStructuredOnlyStreaming(result, controller, encoder);
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
