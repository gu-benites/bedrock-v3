# AI Streaming Architecture

## Overview

This document outlines the architecture of the AI streaming system that powers the Create Recipe feature. The system integrates OpenAI Agents JS SDK with a buffer-based streaming approach using best-effort-json-parser to deliver complete, validated AI responses in real-time without partial updates.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   AI Services   │
│   Components    │◄──►│   Streaming     │◄──►│   OpenAI SDK    │
│                 │    │   Endpoint      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State         │    │   Prompt        │    │   Response      │
│   Management    │    │   Manager       │    │   Processing    │
│   (Zustand)     │    │   (YAML)        │    │   (Streaming)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

#### Frontend Layer

**1. React Components**
- `AIStreamingModal`: Terminal-style streaming interface with hidden scrollbars
- `DemographicsForm`: Enhanced with streaming capabilities and modal integration
- `CausesSelection`: Updated to handle AI-generated data with progressive display

**2. Custom Hooks**
- `useAIStreaming`: Core streaming functionality with buffer-based processing
- `useAutoScroll`: Automatic scrolling for streaming content
- `useRecipeStore`: State management with streaming support

**3. UI Components**
- Terminal-style code block interface
- Animated ellipsis indicators for loading states
- Progressive item reveal with fade-in animations
- Compact spacing for terminal-like density

#### API Layer

**1. Streaming Endpoint** (`/api/ai/streaming`)
- Server-Sent Events (SSE) implementation
- Buffer-based streaming with best-effort-json-parser
- Complete item validation and filtering
- Duplicate prevention and item tracking
- Request validation and processing
- Dynamic prompt loading
- OpenAI SDK integration

**2. Prompt Manager** (`src/lib/ai/utils/prompt-manager.ts`)
- YAML configuration loading
- Template variable substitution
- Caching and performance optimization
- Multi-feature support

#### AI Services Layer

**1. OpenAI Agents JS SDK**
- Structured response generation
- Real-time streaming capabilities
- Model configuration management
- Error handling and retry logic

**2. Response Processing**
- Buffer accumulation and parsing with best-effort-json-parser
- Complete item validation (minimum content length requirements)
- JSON schema validation
- Data transformation and cleaning
- Progressive data extraction (complete items only)
- Error recovery mechanisms

## Data Flow Architecture

### Request Flow

```
User Input → Form Validation → State Update → API Request → Prompt Loading → AI Processing → Response Streaming → Data Transformation → UI Update
```

**Detailed Flow:**

1. **User Interaction**
   - User completes form (health concern, demographics)
   - Form validation ensures data integrity
   - State management updates with user input

2. **AI Request Initiation**
   - `useAIStreaming` hook initiates request
   - Dynamic step processor prepares request data
   - API endpoint receives structured request

3. **Server-Side Processing**
   - Request validation against schemas
   - Prompt Manager loads YAML configuration
   - Template variables substituted with user data
   - OpenAI SDK initiates streaming request

4. **AI Response Processing**
   - Real-time streaming from OpenAI
   - Progressive JSON parsing and validation
   - Data extraction using configured JSON paths
   - Error handling and recovery

5. **Frontend Data Processing**
   - Streaming data received in chunks
   - Data transformation (recipe-wizard → create-recipe format)
   - State updates with partial and final data
   - UI components re-render with new data

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                            │
├─────────────────────────────────────────────────────────────┤
│  Core Data:                                                 │
│  • healthConcern                                            │
│  • demographics                                             │
│  • potentialCauses                                          │
│  • selectedCauses                                           │
│                                                             │
│  Streaming State:                                           │
│  • isStreamingCauses                                        │
│  • streamingError                                           │
│  • isLoading                                                │
│                                                             │
│  Actions:                                                   │
│  • updateDemographics()                                     │
│  • setPotentialCauses()                                     │
│  • setStreamingCauses()                                     │
│  • setStreamingError()                                      │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Architecture

**Dynamic Step Mapping:**

```typescript
// Configuration-driven step definitions
STEP_CONFIGURATIONS = {
  'potential-causes': {
    stepId: 'potential-causes',
    displayName: 'Potential Causes',
    promptName: 'potential-causes',
    jsonArrayPath: 'data.potential_causes',
    transformations: [DATA_TRANSFORMATIONS.POTENTIAL_CAUSES],
    dependencies: ['health-concern', 'demographics'],
    validation: { minSelection: 1, maxSelection: 10, required: true }
  }
}
```

**Data Transformation Pipeline:**

```typescript
// Automatic format conversion
Recipe-Wizard Format → Transformation Function → Create-Recipe Format

{                           transform()              {
  cause_id: "c1",          ──────────►               cause_name: "Stress",
  name_localized: "Stress",                          cause_suggestion: "Work stress",
  suggestion_localized: "Work stress"                explanation: "High stress levels"
}                                                   }
```

## Integration Patterns

### Frontend Integration Pattern

```typescript
// Generic component pattern
function AIStepComponent({ stepId }: { stepId: string }) {
  // 1. Dynamic step processor setup
  const processor = useDynamicStepProcessor({
    stepId,
    healthConcern,
    demographics,
    onSuccess: (data) => updateStepData(data),
    onError: (error) => handleError(error)
  });

  // 2. Automatic streaming integration
  useEffect(() => {
    if (processor.canProcess) {
      startStepProcessing(processor);
    }
  }, [processor.canProcess]);

  // 3. Generic UI rendering
  return (
    <GenericStepSelector 
      stepId={stepId}
      data={stepData}
      onSelection={handleSelection}
    />
  );
}
```

### Backend Integration Pattern

```typescript
// API endpoint pattern
export async function POST(request: Request) {
  // 1. Request validation
  const { feature, step, data } = await validateRequest(request);
  
  // 2. Dynamic prompt loading
  const promptManager = getPromptManager();
  const { prompt, config } = await promptManager.getProcessedPrompt(step, data);
  
  // 3. AI streaming
  const stream = await openaiAgent.streamStructuredResponse({
    prompt,
    schema: config.schema,
    model: config.model
  });
  
  // 4. Response streaming
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

## Scalability Architecture

### Horizontal Scaling

**Frontend Scaling:**
- Component-based architecture enables code splitting
- State management optimized for minimal re-renders
- Generic components reduce bundle size

**Backend Scaling:**
- Stateless API design enables horizontal scaling
- Prompt caching reduces database load
- Connection pooling optimizes resource usage

### Performance Optimization

**Caching Strategy:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Server        │    │   AI Service    │
│   Cache         │    │   Cache         │    │   Cache         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Component     │    │ • Prompt        │    │ • Model         │
│   State         │    │   Configs       │    │   Responses     │
│ • User Data     │    │ • Templates     │    │ • Embeddings    │
│ • UI State      │    │ • Responses     │    │ • Context       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Memory Management:**
- Automatic cleanup of streaming connections
- Efficient state updates with selective subscriptions
- Garbage collection optimization for large datasets

## Security Architecture

### Input Security

```
User Input → Validation → Sanitization → Template Processing → AI Request
     │            │            │               │              │
     ▼            ▼            ▼               ▼              ▼
Schema      XSS         Injection      Variable        Rate
Validation  Prevention  Prevention     Validation      Limiting
```

### Output Security

```
AI Response → Schema Validation → Content Filtering → Sanitization → Client Response
      │              │                   │               │              │
      ▼              ▼                   ▼               ▼              ▼
Structure     JSON Schema        Content         XSS           Safe
Validation    Compliance         Moderation      Prevention    Delivery
```

### Access Control

- **Authentication**: Session-based user authentication
- **Authorization**: Feature-based access control
- **Rate Limiting**: Per-user and per-endpoint limits
- **Audit Logging**: Comprehensive request/response logging

## Error Handling Architecture

### Error Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Hierarchy                          │
├─────────────────────────────────────────────────────────────┤
│  Network Errors:                                            │
│  • Connection timeouts                                      │
│  • Network interruptions                                    │
│  • DNS resolution failures                                  │
│                                                             │
│  Validation Errors:                                         │
│  • Schema validation failures                               │
│  • Input format errors                                      │
│  • Missing required fields                                  │
│                                                             │
│  AI Service Errors:                                         │
│  • Model unavailability                                     │
│  • Rate limit exceeded                                      │
│  • Invalid responses                                        │
│                                                             │
│  Application Errors:                                        │
│  • Configuration errors                                     │
│  • State management errors                                  │
│  • Component lifecycle errors                               │
└─────────────────────────────────────────────────────────────┘
```

### Recovery Strategies

- **Automatic Retry**: Exponential backoff for transient errors
- **Graceful Degradation**: Fallback to cached or default data
- **User Notification**: Clear error messages with recovery options
- **State Recovery**: Automatic state cleanup and reset

## Monitoring Architecture

### Metrics Collection

```
Frontend Metrics → API Gateway → Monitoring Service → Alerting System
      │                │              │                    │
      ▼                ▼              ▼                    ▼
• User Actions    • Request/Response  • Performance      • Error Alerts
• Performance     • Error Rates       • Availability     • Performance Alerts
• Errors          • Latency          • Error Patterns   • Capacity Alerts
```

### Health Monitoring

- **Endpoint Health**: Real-time API availability
- **AI Service Health**: OpenAI service connectivity
- **Performance Monitoring**: Response time tracking
- **Error Rate Monitoring**: Error frequency analysis

## Future Architecture Considerations

### Extensibility

**Multi-Model Support:**
- Abstract AI service interface
- Model-specific configuration
- Performance comparison capabilities

**Advanced Caching:**
- Intelligent response caching
- Predictive data loading
- Context-aware caching strategies

**Real-Time Collaboration:**
- Multi-user streaming capabilities
- Shared state management
- Conflict resolution mechanisms

### Migration Path

**Incremental Enhancement:**
- Backward compatibility maintenance
- Feature flag-based rollouts
- A/B testing infrastructure
- Performance monitoring during migration

## Conclusion

The AI streaming architecture provides a robust, scalable foundation for real-time AI integration. The configuration-driven approach enables rapid development of new AI features while maintaining performance, security, and reliability standards.

Key architectural benefits:

- **Modularity**: Component-based design enables independent development
- **Scalability**: Horizontal scaling capabilities for high-load scenarios
- **Maintainability**: Configuration-driven approach reduces code complexity
- **Reliability**: Comprehensive error handling and recovery mechanisms
- **Security**: Multi-layered security with input validation and output sanitization
- **Performance**: Optimized caching and streaming for responsive user experience

This architecture successfully supports the migration from recipe-wizard to create-recipe while providing a foundation for future AI-powered features.
