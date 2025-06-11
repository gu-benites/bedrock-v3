# PRD: Reusable Streaming AI Responses for Recipe Wizard

## Overview

Implement a reusable streaming solution for OpenAI Agents JS SDK that replaces static loading messages with real-time AI response streaming. The solution focuses on reusable business logic (hooks and utilities) while allowing feature-specific UI components to handle their own presentation needs.

## Problem Statement

**Current Issues:**
- Static loading message: "Loading potential causes..." provides no real-time feedback
- Users wait for complete AI processing without progress indication
- No reusable infrastructure for streaming AI responses across features
- Poor user experience during AI processing delays

**Current Implementation:**
- API Route: `src/app/api/recipe-wizard/route.ts` uses non-streaming `run(agent, agentInput)`
- Frontend: Static loading states in `src/features/recipe-wizard/components/potential-causes-form.tsx`
- No streaming infrastructure for future features

## Solution Architecture

### Core Principle
**Reusable Business Logic + Feature-Specific UI**
- Streaming hook and utilities: Reusable across all features
- UI components: Feature-specific to meet diverse presentation needs

### Key Requirements Analysis

From OpenAI Agents JS SDK documentation patterns:

1. **Basic Streaming**: `{ stream: true }` option with `run()` function
2. **Text Stream**: `stream.toTextStream()` for text-only output  
3. **Event Handling**: `for await` loops for all stream events
4. **Completion**: Always await `stream.completed` for complete output

## Implementation Plan

### Phase 1: Reusable Streaming Infrastructure

#### 1.1 Create Streaming Hook (`src/lib/ai/hooks/use-ai-streaming.ts`)
**Purpose:** Generic hook for any OpenAI Agents JS SDK streaming
```typescript
export function useAIStreaming<T>() {
  // State: streamingText, isStreaming, isComplete, error, finalData
  // Methods: startStream, resetStream, handleStreamError
  // Generic type T for different response formats (PotentialCause[], etc.)
}
```

**Features:**
- Generic type support for different AI response formats
- Real-time text accumulation from stream chunks
- Error handling and retry logic
- Completion status tracking
- SSE connection management

#### 1.2 Create Streaming Utilities (`src/lib/ai/utils/stream-helpers.ts`)
**Purpose:** Shared utilities for handling OpenAI Agents JS SDK streams
```typescript
// Stream event processing
export function processStreamEvent(event: StreamEvent): ProcessedEvent
export function createSSEConnection(url: string): EventSource
export function parseStreamedResponse<T>(finalText: string): T
```

**Features:**
- SSE connection setup and management
- Stream event parsing and transformation
- Error handling utilities
- Response format validation

### Phase 2: Streaming API Infrastructure

#### 2.1 Create Reusable Streaming Route (`src/app/api/ai/streaming/route.ts`)
**Purpose:** Generic streaming API that any feature can use

**Features:**
- Server-Sent Events (SSE) for browser compatibility
- OpenAI Agents JS SDK streaming integration
- Feature-agnostic request/response handling
- Maintains existing YAML prompt management compatibility

**Request Format:**
```typescript
{
  feature: "recipe-wizard",
  step: "potential-causes", 
  data: { healthConcern, demographics }
}
```

**SSE Response Format:**
```typescript
data: {"type": "text_chunk", "content": "Analyzing your health concern..."}
data: {"type": "text_chunk", "content": " Based on chronic anxiety"}
data: {"type": "completion", "data": [/* PotentialCause[] */]}
data: {"type": "error", "message": "Error details"}
```

### Phase 3: Recipe Wizard Integration

#### 3.1 Update Potential Causes Component
**File:** `src/features/recipe-wizard/components/potential-causes-form.tsx`

**Changes:**
- Replace static loading with feature-specific streaming UI
- Integrate `useAIStreaming` hook
- Custom UI for displaying streaming analysis text
- Maintain existing error handling and validation
- Show real-time AI thinking process

**UI Design:**
```typescript
// Feature-specific streaming display
{isStreaming && (
  <div className="ai-analysis-stream">
    <div className="stream-text">{streamingText}</div>
    <div className="typing-indicator">●●●</div>
  </div>
)}
```

#### 3.2 Update AI Service
**File:** `src/features/recipe-wizard/services/ai-service.ts`

**Changes:**
- Add `fetchPotentialCausesStreaming()` function
- Handle SSE connection to `/api/ai/streaming`
- Preserve existing `fetchPotentialCauses()` for backward compatibility
- Maintain existing error handling patterns

### Phase 4: Testing & Documentation

#### 4.1 Test Coverage
- Unit tests for `useAIStreaming` hook
- Integration tests for streaming API route
- Recipe Wizard streaming flow tests
- Error handling and connection failure scenarios
- SSE connection management tests

#### 4.2 Documentation
- Update Recipe Wizard README with streaming patterns
- Create `src/lib/ai/README.md` for reusable streaming infrastructure
- Document feature integration patterns
- API documentation for streaming endpoints

## File Structure

```
src/
├── lib/ai/                          # Reusable AI infrastructure
│   ├── hooks/
│   │   └── use-ai-streaming.ts      # Generic streaming hook
│   ├── utils/
│   │   └── stream-helpers.ts        # Streaming utilities
│   └── README.md                    # Streaming documentation
├── app/api/ai/
│   └── streaming/
│       └── route.ts                 # Generic streaming API route
└── features/recipe-wizard/
    ├── components/
    │   └── potential-causes-form.tsx # Feature-specific streaming UI
    └── services/
        └── ai-service.ts            # Updated with streaming support
```

## Technical Implementation Details

### OpenAI Agents JS SDK Integration
```typescript
// Following documented patterns from basicStreaming.ts
const result = await run(agent, prompt, { stream: true });

// Text stream processing from nodeTextStream.ts
const textStream = result.toTextStream({ 
  compatibleWithNodeStreams: true 
});

// Always await completion
await result.completed;
```

### SSE Implementation
```typescript
// Browser-compatible streaming (not Node.js streams)
const encoder = new TextEncoder();
const stream = new ReadableStream({
  start(controller) {
    // Process OpenAI stream and send SSE events
  }
});
```

## Success Criteria

### Functional Requirements
- ✅ Real-time streaming text display during AI processing
- ✅ Seamless integration with existing Recipe Wizard flow  
- ✅ Reusable streaming infrastructure for any feature
- ✅ Feature-specific UI components for diverse presentation needs
- ✅ Maintains all existing error handling and validation

### Technical Requirements
- ✅ Uses only documented OpenAI Agents JS SDK patterns
- ✅ Compatible with existing YAML prompt management
- ✅ Follows established project architecture patterns
- ✅ 100% test coverage for new streaming components
- ✅ Backward compatibility with existing non-streaming APIs

### User Experience
- ✅ Eliminates static "Loading..." messages
- ✅ Provides real-time feedback during AI processing
- ✅ Graceful error handling with retry functionality
- ✅ No breaking changes to existing Recipe Wizard functionality

## Migration Strategy

1. **Backward Compatibility**: Keep existing `/api/recipe-wizard` route functional
2. **Gradual Rollout**: Implement streaming for potential causes step first
3. **Feature Flag**: Allow toggling between streaming and non-streaming modes
4. **Testing**: Comprehensive testing before replacing static loading states

## Future Extensibility

This architecture enables easy integration for future features:

**Chat Interface:**
```typescript
const { streamingText, isStreaming } = useAIStreaming<ChatMessage>();
// Custom chat bubble UI with typing indicators
```

**Data Analysis Features:**
```typescript  
const { streamingText, finalData } = useAIStreaming<AnalysisResult>();
// Custom table/chart UI showing analysis progress
```

**Content Generation:**
```typescript
const { streamingText, isComplete } = useAIStreaming<GeneratedContent>();
// Custom editor UI with real-time content preview
```

## Next Steps

1. Implement reusable streaming infrastructure (`use-ai-streaming.ts`, `stream-helpers.ts`)
2. Create generic streaming API route (`/api/ai/streaming`)
3. Integrate streaming into Recipe Wizard potential causes step
4. Comprehensive testing and documentation
5. Gradual rollout with feature flag support

This approach provides maximum reusability for business logic while maintaining flexibility for diverse UI requirements across different features.
