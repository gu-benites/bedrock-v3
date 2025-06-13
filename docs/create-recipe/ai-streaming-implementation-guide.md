# AI Streaming Implementation Guide

## Overview

This comprehensive guide provides step-by-step instructions for implementing AI streaming functionality in the create-recipe feature. It covers everything from backend API routes to frontend components, enabling any developer to confidently add new AI streaming features.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Streaming Hook Usage](#streaming-hook-usage)
6. [API Route Implementation](#api-route-implementation)
7. [Component Integration](#component-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- OpenAI Agents JS SDK configured
- Environment variables set (see [Environment Variables](./environment-variables.md))
- Basic understanding of React hooks and Zustand state management

### 5-Minute Implementation

```typescript
// 1. Add streaming to your component
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';

function MyAIStep() {
  const { startStream, partialData, isStreaming, error } = useAIStreaming({
    jsonArrayPath: 'data.my_results'
  });

  const handleAnalyze = async () => {
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'my-step',
      data: { /* your data */ }
    });
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isStreaming}>
        {isStreaming ? 'Analyzing...' : 'Start Analysis'}
      </button>
      {partialData && <div>Found {partialData.length} results</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## Architecture Overview

### Data Flow

```
User Input → Form Validation → API Request → AI Processing → Streaming Response → UI Update
     ↓              ↓              ↓              ↓              ↓              ↓
Demographics → Validation → /api/ai/streaming → OpenAI SDK → SSE Events → React State
```

### Component Hierarchy

```
Page Component
├── Form Component (Demographics, etc.)
├── AI Streaming Modal (Optional)
├── Results Display Component
└── Error Handling Component
```

### Integration Points

- **Zustand Store**: Global state management for recipe data
- **useAIStreaming Hook**: Core streaming functionality
- **API Route**: `/api/ai/streaming` - handles all AI requests
- **Prompt Manager**: YAML-based prompt configuration

## Backend Implementation

### 1. API Route Structure

The main streaming endpoint is located at `src/app/api/ai/streaming/route.ts`:

```typescript
// Core imports
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'best-effort-json-parser';
import { getPromptManager } from '@/lib/ai/utils/prompt-manager';

// Request interface
interface StreamRequest {
  feature: string;           // 'create-recipe'
  step: string;             // 'potential-causes', 'potential-symptoms', etc.
  data: Record<string, any>; // User input data
  streaming_mode?: 'structured' | 'text';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Implementation details below...
}
```

### 2. Streaming Implementation Pattern

```typescript
async function handleStructuredOnlyStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  let buffer = '';
  let totalItemsSent = 0;
  const sentItems = new Set<string>();

  // Buffer-based streaming (like reference code)
  const textStream = result.toTextStream();
  
  for await (const textChunk of textStream) {
    buffer += textChunk;
    
    // Process buffer every 50 chunks to reduce frequency
    if (totalChunksProcessed % 50 === 0) {
      processBuffer();
    }
  }

  function processBuffer() {
    try {
      const parsed = parse(buffer); // best-effort-json-parser
      sendCompleteItems(parsed);
    } catch (error) {
      // Ignore parse errors - try again with more data
    }
  }
}
```

### 3. Environment Configuration

Required environment variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7

# Streaming Configuration
STREAMING_TIMEOUT=30000
STREAMING_MAX_RETRIES=3
STREAMING_RETRY_DELAY=1000
```

## Frontend Implementation

### 1. useAIStreaming Hook

The core hook for AI streaming functionality:

```typescript
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';

// Basic usage
const {
  streamingText,      // Raw streaming text
  isStreaming,        // Boolean: is currently streaming
  isComplete,         // Boolean: streaming completed
  error,              // Error message if any
  finalData,          // Final complete data
  partialData,        // Progressive partial data
  startStream,        // Function to start streaming
  resetStream         // Function to reset state
} = useAIStreaming(config);
```

### 2. Hook Configuration Options

```typescript
interface AIStreamingConfig {
  // Data extraction
  jsonArrayPath?: string;           // 'data.potential_causes'
  
  // Connection settings
  timeout?: number;                 // 30000ms default
  maxRetries?: number;              // 3 default
  retryDelay?: number;              // 1000ms default
  
  // Behavior
  autoReset?: boolean;              // true default
  enableLogging?: boolean;          // true in development
}

// Example configurations
const causesConfig = {
  jsonArrayPath: 'data.potential_causes',
  timeout: 45000,
  maxRetries: 5
};

const symptomsConfig = {
  jsonArrayPath: 'data.potential_symptoms',
  timeout: 30000
};
```

### 3. Component Integration Pattern

```typescript
function AIStepComponent() {
  // 1. Get data from store
  const { healthConcern, demographics, setPotentialCauses } = useRecipeStore();
  
  // 2. Setup streaming
  const { startStream, partialData, isStreaming, error } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });

  // 3. Handle streaming data
  useEffect(() => {
    if (partialData && Array.isArray(partialData)) {
      // Transform data format if needed
      const transformedData = partialData.map(transformCauseData);
      setPotentialCauses(transformedData);
    }
  }, [partialData, setPotentialCauses]);

  // 4. Start streaming
  const handleAnalyze = async () => {
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-causes',
      data: { healthConcern, demographics }
    });
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isStreaming}>
        {isStreaming ? 'Analyzing...' : 'Start Analysis'}
      </button>
      {error && <ErrorDisplay error={error} />}
      {partialData && <ResultsDisplay data={partialData} />}
    </div>
  );
}
```

## Streaming Hook Usage

### Basic Usage Examples

#### 1. Simple Text Streaming

```typescript
function TextStreamingExample() {
  const { streamingText, isStreaming, startStream } = useAIStreaming();

  const handleStart = async () => {
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'analysis',
      data: { query: 'analyze this...' },
      streaming_mode: 'text'
    });
  };

  return (
    <div>
      <button onClick={handleStart}>Start Analysis</button>
      <pre>{streamingText}</pre>
    </div>
  );
}
```

#### 2. Structured Data Streaming

```typescript
function StructuredStreamingExample() {
  const { partialData, finalData, isComplete, startStream } = useAIStreaming({
    jsonArrayPath: 'data.results'
  });

  const handleStart = async () => {
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-causes',
      data: { healthConcern: 'anxiety', demographics: {...} }
    });
  };

  return (
    <div>
      <button onClick={handleStart}>Analyze Causes</button>
      
      {/* Progressive results */}
      {partialData && (
        <div>
          <h3>Found {partialData.length} potential causes:</h3>
          {partialData.map((cause, index) => (
            <div key={index}>{cause.name_localized}</div>
          ))}
        </div>
      )}
      
      {/* Final results */}
      {isComplete && finalData && (
        <div>Analysis complete! Total: {finalData.data.results.length}</div>
      )}
    </div>
  );
}
```

### Advanced Usage Patterns

#### 1. Error Handling

```typescript
function ErrorHandlingExample() {
  const { 
    startStream, 
    error, 
    isStreaming, 
    resetStream 
  } = useAIStreaming({
    maxRetries: 5,
    retryDelay: 2000
  });

  const handleRetry = async () => {
    resetStream(); // Clear previous error
    await startStream('/api/ai/streaming', requestData);
  };

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return <div>Normal component content...</div>;
}
```

#### 2. Multiple Streaming Operations

```typescript
function MultipleStreamingExample() {
  const causesStream = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });
  
  const symptomsStream = useAIStreaming({
    jsonArrayPath: 'data.potential_symptoms'
  });

  const analyzeCauses = async () => {
    await causesStream.startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-causes',
      data: { healthConcern, demographics }
    });
  };

  const analyzeSymptoms = async () => {
    await symptomsStream.startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-symptoms',
      data: { healthConcern, demographics, selectedCauses }
    });
  };

  return (
    <div>
      <button onClick={analyzeCauses} disabled={causesStream.isStreaming}>
        Analyze Causes
      </button>
      <button onClick={analyzeSymptoms} disabled={symptomsStream.isStreaming}>
        Analyze Symptoms
      </button>
    </div>
  );
}
```

### Memory Management & Cleanup

```typescript
function CleanupExample() {
  const { startStream, resetStream } = useAIStreaming();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetStream(); // Automatically cleans up connections
    };
  }, [resetStream]);

  // Manual cleanup
  const handleCancel = () => {
    resetStream(); // Stops streaming and cleans up
  };

  return (
    <div>
      <button onClick={handleCancel}>Cancel Analysis</button>
    </div>
  );
}
```

## API Route Implementation

### 1. Complete API Route Setup

Create or update `src/app/api/ai/streaming/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'best-effort-json-parser';
import { getPromptManager } from '@/lib/ai/utils/prompt-manager';
import { createOpenAIAgent } from '@/lib/ai/utils/openai-agent';

// Request validation schema
interface StreamRequest {
  feature: string;
  step: string;
  data: Record<string, any>;
  streaming_mode?: 'structured' | 'text';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartTime = Date.now();
  const traceId = `streaming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('[Streaming API] Request started', { traceId });

    // 1. Parse and validate request
    const requestData: StreamRequest = await request.json();
    const { feature, step, data, streaming_mode = 'structured' } = requestData;

    // Validate required fields
    if (!feature || !step || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: feature, step, data' },
        { status: 400 }
      );
    }

    // 2. Load prompt configuration
    const promptManager = getPromptManager();
    const { processedPrompt, config } = await promptManager.getProcessedPrompt(
      step,
      data,
      feature
    );

    // 3. Create OpenAI agent
    const agent = createOpenAIAgent({
      model: config.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000
    });

    // 4. Start streaming
    const result = await agent.streamStructuredResponse({
      prompt: processedPrompt,
      schema: config.schema,
      responseFormat: config.responseFormat
    });

    // 5. Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (streaming_mode === 'structured') {
            await handleStructuredOnlyStreaming(result, controller, encoder);
          } else {
            await handleTextStreaming(result, controller, encoder);
          }
        } catch (error) {
          console.error('[Streaming API] Stream error:', error);
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown streaming error'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Trace-ID': traceId
      }
    });

  } catch (error) {
    console.error('[Streaming API] Request error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        traceId,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 2. Structured Streaming Handler

```typescript
async function handleStructuredOnlyStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('[Structured-Only Streaming] Starting buffer-based processing');

  let buffer = '';
  let totalChunksProcessed = 0;
  let totalItemsSent = 0;
  let lastSentItemCount = 0;
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

      // Check if this cause is truly complete
      const hasCompleteFields =
        cause.name_localized && cause.name_localized.length > 10 &&
        cause.suggestion_localized && cause.suggestion_localized.length > 20 &&
        cause.explanation_localized && cause.explanation_localized.length > 30 &&
        !cause.name_localized.endsWith('...') &&
        !cause.suggestion_localized.endsWith('...') &&
        !cause.explanation_localized.endsWith('...');

      if (hasCompleteFields) {
        const itemKey = `${i}-${cause.cause_id}`;

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

  // Process buffer using best-effort-json-parser
  const processBuffer = () => {
    try {
      const parsed = parse(buffer);
      if (parsed) {
        sendCompleteItems(parsed);
      }
    } catch (error) {
      // Ignore parse errors - we'll try again with more data
    }
  };

  try {
    const textStream = result.toTextStream();

    for await (const textChunk of textStream) {
      buffer += textChunk;
      totalChunksProcessed++;

      // Process buffer every 50 chunks to reduce frequency
      if (totalChunksProcessed % 50 === 0) {
        processBuffer();
      }
    }

    // Final processing to catch any remaining complete items
    processBuffer();

    // Send completion event
    const completionEvent = `data: ${JSON.stringify({
      type: 'structured_complete',
      data: await result.finalOutput,
      stats: {
        totalChunksProcessed,
        totalItemsSent,
        finalBufferLength: buffer.length,
        itemsProcessed: sentItems.size
      },
      timestamp: new Date().toISOString()
    })}\n\n`;

    controller.enqueue(encoder.encode(completionEvent));

  } catch (error) {
    console.error('[Structured-Only Streaming] Error:', error);
    throw error;
  }
}
```

### 3. Text Streaming Handler

```typescript
async function handleTextStreaming(
  result: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  try {
    const textStream = result.toTextStream();

    for await (const textChunk of textStream) {
      const sseEvent = `data: ${JSON.stringify({
        type: 'text_chunk',
        data: textChunk,
        timestamp: new Date().toISOString()
      })}\n\n`;

      controller.enqueue(encoder.encode(sseEvent));
    }

    // Send completion
    const completionEvent = `data: ${JSON.stringify({
      type: 'completion',
      data: await result.finalOutput,
      timestamp: new Date().toISOString()
    })}\n\n`;

    controller.enqueue(encoder.encode(completionEvent));

  } catch (error) {
    console.error('[Text Streaming] Error:', error);
    throw error;
  }
}
```

### 4. Error Handling & Retry Logic

```typescript
// Add to your API route
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2
};

async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = RETRY_CONFIG.retryDelay *
        Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries);

      console.log(`[Retry] Retrying in ${delay}ms, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

function isRetryableError(error: any): boolean {
  // Define which errors should trigger a retry
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit_exceeded'
  ];

  return retryableErrors.some(code =>
    error.code === code || error.message?.includes(code)
  );
}

## Frontend Integration

### 1. AI Streaming Modal Component

Use the pre-built modal for a professional streaming experience:

```typescript
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamingItems, setStreamingItems] = useState([]);

  const { startStream, partialData, isStreaming } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });

  // Transform data for modal
  useEffect(() => {
    if (partialData && Array.isArray(partialData)) {
      const modalItems = partialData.map((cause, index) => ({
        title: cause.name_localized,
        subtitle: cause.suggestion_localized,
        description: cause.explanation_localized,
        timestamp: new Date()
      }));
      setStreamingItems(modalItems);
    }
  }, [partialData]);

  const handleAnalyze = async () => {
    setIsModalOpen(true);
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-causes',
      data: { healthConcern, demographics }
    });
  };

  return (
    <div>
      <button onClick={handleAnalyze}>Analyze Potential Causes</button>

      <AIStreamingModal
        isOpen={isModalOpen}
        title="AI Analysis in Progress"
        description="Identifying potential causes based on your demographics"
        items={streamingItems}
        onClose={() => setIsModalOpen(false)}
        maxVisibleItems={100}
      />
    </div>
  );
}
```

### 2. Custom Streaming UI Implementation

For custom UI implementations:

```typescript
function CustomStreamingUI() {
  const { partialData, isStreaming, error } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });

  return (
    <div className="streaming-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3>AI Analysis Results</h3>
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {partialData?.map((item, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <h4 className="font-semibold">{item.name_localized}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.suggestion_localized}</p>
            <p className="text-sm mt-2">{item.explanation_localized}</p>
          </div>
        ))}
      </div>

      {/* Error handling */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}
    </div>
  );
}
```

### 3. State Management Integration

Integrate with Zustand store:

```typescript
// In your store (src/stores/recipe.store.ts)
interface RecipeStore {
  // Existing state
  healthConcern: string;
  demographics: Demographics;
  potentialCauses: PotentialCause[];

  // Streaming state
  isStreamingCauses: boolean;
  streamingError: string | null;

  // Actions
  setPotentialCauses: (causes: PotentialCause[]) => void;
  setStreamingCauses: (isStreaming: boolean) => void;
  setStreamingError: (error: string | null) => void;
}

// In your component
function StreamingIntegratedComponent() {
  const {
    healthConcern,
    demographics,
    potentialCauses,
    setPotentialCauses,
    setStreamingCauses,
    setStreamingError
  } = useRecipeStore();

  const { startStream, partialData, isStreaming, error } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });

  // Sync streaming state with store
  useEffect(() => {
    setStreamingCauses(isStreaming);
  }, [isStreaming, setStreamingCauses]);

  useEffect(() => {
    setStreamingError(error);
  }, [error, setStreamingError]);

  // Transform and store data
  useEffect(() => {
    if (partialData && Array.isArray(partialData)) {
      const transformedCauses = partialData.map(transformCauseData);
      setPotentialCauses(transformedCauses);
    }
  }, [partialData, setPotentialCauses]);

  return <div>Component content...</div>;
}
```

### 4. Progressive Data Display Patterns

#### Pattern 1: Incremental List

```typescript
function IncrementalList({ items }: { items: any[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (items.length > visibleCount) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 1, items.length));
      }, 300); // Stagger appearance
      return () => clearTimeout(timer);
    }
  }, [items.length, visibleCount]);

  return (
    <div className="space-y-3">
      {items.slice(0, visibleCount).map((item, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-left duration-300"
        >
          {/* Item content */}
        </div>
      ))}
    </div>
  );
}
```

#### Pattern 2: Skeleton Loading

```typescript
function SkeletonLoader({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

function ProgressiveDisplay({ items, isLoading }: { items: any[], isLoading: boolean }) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>Item content...</div>
      ))}

      {isLoading && <SkeletonLoader count={3} />}
    </div>
  );
}
```

### 5. Auto-scroll and User Interaction

```typescript
function AutoScrollContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (!isUserScrolling && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [children, isUserScrolling]);

  // Detect user scrolling
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsUserScrolling(!isAtBottom);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-80 overflow-y-auto"
    >
      {children}
    </div>
  );
}
```

## Best Practices

### 1. Performance Optimization

```typescript
// Memoize expensive transformations
const transformedData = useMemo(() => {
  return partialData?.map(transformCauseData) || [];
}, [partialData]);

// Debounce rapid updates
const debouncedUpdate = useMemo(
  () => debounce((data) => setPotentialCauses(data), 100),
  [setPotentialCauses]
);

useEffect(() => {
  if (transformedData.length > 0) {
    debouncedUpdate(transformedData);
  }
}, [transformedData, debouncedUpdate]);
```

### 2. Error Handling

```typescript
function RobustStreamingComponent() {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { startStream, error, resetStream } = useAIStreaming();

  const handleRetry = useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      resetStream();
      await startStream('/api/ai/streaming', requestData);
    }
  }, [retryCount, maxRetries, resetStream, startStream]);

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        {retryCount < maxRetries && (
          <button onClick={handleRetry}>
            Retry ({retryCount + 1}/{maxRetries})
          </button>
        )}
        {retryCount >= maxRetries && (
          <p>Maximum retries exceeded. Please try again later.</p>
        )}
      </div>
    );
  }

  return <div>Normal content...</div>;
}
```

### 3. Memory Management

```typescript
function MemoryEfficientComponent() {
  const { startStream, resetStream } = useAIStreaming();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetStream();
    };
  }, [resetStream]);

  // Cleanup on route change
  useEffect(() => {
    const handleRouteChange = () => {
      resetStream();
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [resetStream]);

  return <div>Component content...</div>;
}
```

### 4. Testing Patterns

```typescript
// Mock streaming for tests
const mockUseAIStreaming = {
  startStream: jest.fn(),
  partialData: mockData,
  isStreaming: false,
  error: null,
  resetStream: jest.fn()
};

jest.mock('@/lib/ai/hooks/use-ai-streaming', () => ({
  useAIStreaming: () => mockUseAIStreaming
}));

// Test streaming behavior
test('handles streaming data correctly', async () => {
  render(<StreamingComponent />);

  // Simulate streaming data
  act(() => {
    mockUseAIStreaming.partialData = [mockCause1];
  });

  expect(screen.getByText(mockCause1.name_localized)).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Streaming stops unexpectedly**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check browser console for errors
   - Ensure proper cleanup in useEffect

2. **Partial data not updating**
   - Verify `jsonArrayPath` configuration
   - Check data transformation logic
   - Ensure state updates are not being blocked

3. **Memory leaks**
   - Always call `resetStream()` on unmount
   - Avoid creating new objects in render
   - Use `useMemo` for expensive calculations

4. **Performance issues**
   - Implement debouncing for rapid updates
   - Use `React.memo` for expensive components
   - Limit the number of visible items

### Debug Tools

```typescript
// Enable debug logging
const { startStream } = useAIStreaming({
  enableLogging: true // Shows detailed console logs
});

// Monitor streaming state
useEffect(() => {
  console.log('Streaming state:', { partialData, isStreaming, error });
}, [partialData, isStreaming, error]);
```

This comprehensive guide provides everything needed to implement AI streaming functionality in the create-recipe feature. Follow the patterns and best practices to ensure robust, performant, and maintainable streaming implementations.
```
