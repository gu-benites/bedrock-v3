// src/app/api/ai/streaming/route.ts
// Generic streaming API route using OpenAI Agents JS SDK patterns

import { NextRequest, NextResponse } from 'next/server';
import {
  Agent,
  run,
  setDefaultOpenAIKey,
  setOpenAIAPI,
  withTrace
} from '@openai/agents';
import { parse } from 'best-effort-json-parser';
// Note: zod would be imported here in real implementation
// For testing, we'll use simple validation
import { getPromptManager, PromptManagerError } from '@/features/recipe-wizard/services/prompt-manager';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Configure OpenAI Agents SDK
if (process.env['OPENAI_API_KEY']) {
  setDefaultOpenAIKey(process.env['OPENAI_API_KEY']);
  setOpenAIAPI('responses'); // Use Responses API for structured outputs
}

// Logger will be imported dynamically to support mocking

// API timeout for AI requests (30 seconds)
const API_TIMEOUT = 30000;

// Tracing configuration
const TRACE_CONFIG = {
  workflowName: 'AI Streaming API',
  traceIncludeSensitiveData: false,
  tracingDisabled: process.env['OPENAI_AGENTS_DISABLE_TRACING'] === '1'
};

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
function prepareTemplateVariables(feature: string, step: string, data: any): Record<string, any> {
  // For recipe-wizard feature
  if (feature === 'recipe-wizard') {
    const demographics = data.demographics || {};
    return {
      healthConcern: data.healthConcern || '',
      gender: demographics.gender || '',
      ageCategory: demographics.ageCategory || '',
      specificAge: demographics.specificAge || '',
      language: demographics.language || 'en'
    };
  }

  // Default: return data as-is for other features
  return data;
}



/**
 * Handle structured-only streaming (no text chunks, only structured data)
 * Uses best-effort-json-parser for bulletproof progressive parsing
 */
async function handleStructuredOnlyStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('[Structured-Only Streaming] Starting bulletproof structured-only processing');

  let accumulatedText = '';
  let lastSentDataLength = 0;
  let totalChunksProcessed = 0;
  let totalItemsSent = 0;

  // Use toTextStream() to get character-by-character updates
  const textStream = result.toTextStream();

  for await (const textChunk of textStream) {
    accumulatedText += textChunk;
    totalChunksProcessed++;

    // Log progress every 50 chunks to avoid spam
    if (totalChunksProcessed % 50 === 0) {
      console.log('[Structured-Only Streaming] Progress:', {
        accumulatedLength: accumulatedText.length,
        chunksProcessed: totalChunksProcessed,
        itemsSent: totalItemsSent
      });
    }

    // Use bulletproof progressive parsing
    const progressiveData = extractProgressiveData(accumulatedText, lastSentDataLength);

    if (progressiveData.newItems.length > 0) {
      // Send new items as they become available
      for (const item of progressiveData.newItems) {
        try {
          const sseEvent = `data: ${JSON.stringify({
            type: 'structured_data',
            field: 'potential_causes',
            index: item.index,
            data: item.data,
            timestamp: new Date().toISOString()
          })}\n\n`;

          controller.enqueue(encoder.encode(sseEvent));
          totalItemsSent++;

          console.log('[Structured-Only Streaming] ✅ Sent item:', {
            index: item.index,
            name: item.data.name_localized,
            totalSent: totalItemsSent
          });

        } catch (sseError) {
          console.error('[Structured-Only Streaming] ❌ Error sending SSE event:', sseError);
        }
      }
      lastSentDataLength = progressiveData.totalSent;
    }
  }

  console.log('[Structured-Only Streaming] Text streaming completed, waiting for final result');

  // Wait for completion and send final structured data
  try {
    await result.completed;
    const finalOutput = result.finalOutput;

    if (finalOutput && typeof finalOutput === 'object') {
      const completionEvent = `data: ${JSON.stringify({
        type: 'structured_complete',
        data: finalOutput,
        stats: {
          totalChunksProcessed,
          totalItemsSent,
          finalTextLength: accumulatedText.length
        },
        timestamp: new Date().toISOString()
      })}\n\n`;

      controller.enqueue(encoder.encode(completionEvent));
      console.log('[Structured-Only Streaming] ✅ Final completion sent:', {
        totalChunksProcessed,
        totalItemsSent,
        finalOutputKeys: Object.keys(finalOutput)
      });
    }
  } catch (error) {
    console.error('[Structured-Only Streaming] ❌ Error processing final output:', error);

    // Send error event
    const errorEvent = `data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown completion error',
      timestamp: new Date().toISOString()
    })}\n\n`;
    controller.enqueue(encoder.encode(errorEvent));
  }
}

/**
 * Handle hybrid structured JSON streaming (text + structured data)
 * Uses best-effort-json-parser for bulletproof progressive parsing
 */
async function handleStructuredStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('[Hybrid Streaming] Starting bulletproof hybrid processing (text + structured)');

  let accumulatedText = '';
  let lastSentDataLength = 0;
  let totalChunksProcessed = 0;
  let totalItemsSent = 0;

  // Use toTextStream() to get character-by-character updates
  const textStream = result.toTextStream();

  for await (const textChunk of textStream) {
    accumulatedText += textChunk;
    totalChunksProcessed++;

    // Always send text chunks for real-time feedback
    try {
      const textSseEvent = `data: ${JSON.stringify({
        type: 'text_chunk',
        content: textChunk,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(textSseEvent));
    } catch (textError) {
      console.error('[Hybrid Streaming] ❌ Error sending text chunk:', textError);
    }

    // Use bulletproof progressive parsing for structured data
    const progressiveData = extractProgressiveData(accumulatedText, lastSentDataLength);

    if (progressiveData.newItems.length > 0) {
      // Send new structured items as they become available
      for (const item of progressiveData.newItems) {
        try {
          const structuredSseEvent = `data: ${JSON.stringify({
            type: 'structured_data',
            field: 'potential_causes',
            index: item.index,
            data: item.data,
            timestamp: new Date().toISOString()
          })}\n\n`;

          controller.enqueue(encoder.encode(structuredSseEvent));
          totalItemsSent++;

          console.log('[Hybrid Streaming] ✅ Sent structured item:', {
            index: item.index,
            name: item.data.name_localized,
            totalSent: totalItemsSent
          });

        } catch (structuredError) {
          console.error('[Hybrid Streaming] ❌ Error sending structured event:', structuredError);
        }
      }
      lastSentDataLength = progressiveData.totalSent;
    }
  }

  console.log('[Hybrid Streaming] Text streaming completed, waiting for final result');

  // Wait for completion and send final structured data
  try {
    await result.completed;
    const finalOutput = result.finalOutput;

    if (finalOutput && typeof finalOutput === 'object') {
      const completionEvent = `data: ${JSON.stringify({
        type: 'structured_complete',
        data: finalOutput,
        stats: {
          totalChunksProcessed,
          totalItemsSent,
          finalTextLength: accumulatedText.length
        },
        timestamp: new Date().toISOString()
      })}\n\n`;

      controller.enqueue(encoder.encode(completionEvent));
      console.log('[Hybrid Streaming] ✅ Final completion sent:', {
        totalChunksProcessed,
        totalItemsSent,
        finalOutputKeys: Object.keys(finalOutput)
      });
    }
  } catch (error) {
    console.error('[Hybrid Streaming] ❌ Error processing final output:', error);

    // Send error event
    const errorEvent = `data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown completion error',
      timestamp: new Date().toISOString()
    })}\n\n`;
    controller.enqueue(encoder.encode(errorEvent));
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
function extractProgressiveData(accumulatedText: string, lastSentLength: number): {
  newItems: Array<{ index: number; data: any }>;
  totalSent: number;
} {
  const newItems: Array<{ index: number; data: any }> = [];

  try {
    // Use best-effort-json-parser to parse incomplete JSON
    const parsed = parse(accumulatedText);

    // Check if we have a valid structure with potential_causes
    if (parsed &&
        typeof parsed === 'object' &&
        parsed.data &&
        parsed.data.potential_causes &&
        Array.isArray(parsed.data.potential_causes)) {

      const causes = parsed.data.potential_causes;

      // Send any new complete causes that we haven't sent yet
      for (let i = lastSentLength; i < causes.length; i++) {
        const cause = causes[i];

        // Check if this cause is COMPLETE with all required fields
        if (cause &&
            typeof cause === 'object' &&
            cause.cause_id &&
            cause.name_localized &&
            cause.suggestion_localized &&
            cause.explanation_localized &&
            // Ensure fields have meaningful content (not just empty strings)
            cause.name_localized.length > 3 &&
            cause.suggestion_localized.length > 10 &&
            cause.explanation_localized.length > 10) {

          // Log complete object for debugging
          console.log('[Progressive Data] ✅ Complete cause found:', {
            index: i,
            name: cause.name_localized,
            suggestion_length: cause.suggestion_localized.length,
            explanation_length: cause.explanation_localized.length
          });

          newItems.push({
            index: i,
            data: cause
          });
        } else if (cause && typeof cause === 'object' && cause.cause_id) {
          // Log incomplete objects for debugging
          console.log('[Progressive Data] ⏳ Incomplete cause (waiting for more data):', {
            index: i,
            name: cause.name_localized || 'missing',
            has_suggestion: !!cause.suggestion_localized,
            has_explanation: !!cause.explanation_localized
          });
        }
      }

      // Return the new items and update the count
      if (newItems.length > 0) {
        return { newItems, totalSent: lastSentLength + newItems.length };
      }

      // Even if no new complete items, update the count if we have more partial items
      return { newItems, totalSent: Math.max(lastSentLength, causes.length) };
    }

    // If we don't have the expected structure yet, return current state
    return { newItems, totalSent: lastSentLength };

  } catch (error) {
    // best-effort-json-parser should rarely throw, but handle gracefully
    console.log('[Progressive Data] Parse error (rare with best-effort-json-parser):', error instanceof Error ? error.message : 'Unknown error');
    return { newItems, totalSent: lastSentLength };
  }
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
    const templateVariables = prepareTemplateVariables(feature, step, data);
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

    // Create SSE response with hybrid streaming (structured + text)
    console.log('[Streaming API] Creating hybrid SSE stream');
    const encoder = new TextEncoder();

    // Detect if we have structured output (JSON schema)
    const hasStructuredOutput = config.schema && config.schema['schema'];
    console.log('[Streaming API] Structured output detected:', hasStructuredOutput);
    console.log('[Streaming API] Config schema keys:', config.schema ? Object.keys(config.schema) : 'no schema');

    // Determine final streaming mode
    let finalStreamingMode = streamingMode;
    if (streamingMode === 'auto') {
      finalStreamingMode = hasStructuredOutput ? 'hybrid' : 'text';
    }
    console.log('[Streaming API] Final streaming mode:', finalStreamingMode);

    const stream = new ReadableStream({
      async start(controller) {
        const streamStartTime = Date.now();
        let streamingMode = 'unknown';

        try {
          // Determine and execute the appropriate streaming mode
          if (finalStreamingMode === 'structured' && hasStructuredOutput) {
            streamingMode = 'structured-only';
            console.log('[Streaming API] 🚀 Starting bulletproof structured-only streaming');
            await handleStructuredOnlyStreaming(result, controller, encoder);
          } else if (finalStreamingMode === 'hybrid' && hasStructuredOutput) {
            streamingMode = 'hybrid';
            console.log('[Streaming API] 🚀 Starting bulletproof hybrid streaming');
            await handleStructuredStreaming(result, controller, encoder);
          } else {
            streamingMode = 'text-only';
            console.log('[Streaming API] 🚀 Starting text-only streaming');
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
        error: 'Streaming failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        traceId,
        duration_ms: totalDuration
      },
      { status: 500 }
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
