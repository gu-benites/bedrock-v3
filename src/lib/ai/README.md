# AI Streaming System

## Overview

The AI Streaming System provides real-time AI integration capabilities for the application using the OpenAI Agents JS SDK. This system enables progressive data loading, structured response processing, and seamless integration with frontend components.

## Architecture

### Core Components

1. **useAIStreaming Hook** (`hooks/use-ai-streaming.ts`)
   - React hook for AI streaming integration
   - Progressive data processing with real-time updates
   - Error handling and retry mechanisms
   - Configurable JSON path extraction

2. **Prompt Manager** (`utils/prompt-manager.ts`)
   - YAML-based prompt configuration management
   - Template variable substitution
   - Caching and performance optimization
   - Multi-feature support

3. **Streaming API Endpoint** (`/api/ai/streaming`)
   - Server-side streaming implementation
   - OpenAI Agents JS SDK integration
   - Dynamic prompt loading
   - Structured response validation

## Features

### Real-Time Streaming

```typescript
const { startStream, partialData, finalData, isComplete } = useAIStreaming({
  jsonArrayPath: 'data.potential_causes',
  onError: (error) => handleError(error)
});

// Start streaming
await startStream('/api/ai/streaming', {
  feature: 'create-recipe',
  step: 'potential-causes',
  data: { healthConcern, demographics }
});
```

### Progressive Data Updates

- **Partial Data**: Receive data as it's generated
- **Final Data**: Complete response when streaming finishes
- **Error Handling**: Comprehensive error recovery
- **State Management**: Automatic loading state tracking

### YAML-Based Prompt Management

```yaml
# prompt-config.yaml
version: "1.0.0"
description: "AI step configuration"

config:
  model: "gpt-4"
  temperature: 0.7
  max_tokens: 2000

template: |
  Analyze the health concern: {{healthConcern}}
  User demographics: {{demographics}}
  
  Generate structured recommendations.

schema:
  type: "object"
  properties:
    data:
      type: "object"
      properties:
        recommendations:
          type: "array"
          items:
            type: "object"
```

## Integration Patterns

### Frontend Integration

```typescript
// Component with AI streaming
function AIStepComponent({ stepId }: { stepId: string }) {
  const [data, setData] = useState([]);
  
  const { startStream, partialData, isComplete } = useAIStreaming({
    jsonArrayPath: `data.${stepId}_data`,
    onError: (error) => console.error('Streaming error:', error)
  });

  // Process partial data
  useEffect(() => {
    if (partialData) {
      setData(partialData);
    }
  }, [partialData]);

  // Handle completion
  useEffect(() => {
    if (isComplete) {
      // Process final data
    }
  }, [isComplete]);

  return (
    <div>
      {data.map(item => (
        <ItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Backend Integration

```typescript
// API route with streaming
export async function POST(request: Request) {
  const { feature, step, data } = await request.json();
  
  // Load prompt configuration
  const promptManager = getPromptManager();
  const { prompt, config } = await promptManager.getProcessedPrompt(step, data);
  
  // Start streaming
  const stream = await openaiAgent.streamStructuredResponse({
    prompt,
    schema: config.schema,
    model: config.model
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

## Configuration

### Prompt Configuration

Prompts are stored in YAML files with the following structure:

- **Metadata**: Version, description, configuration details
- **Model Settings**: Temperature, max tokens, model selection
- **Template**: Prompt text with variable substitution
- **Schema**: JSON schema for response validation
- **Examples**: Sample responses for reference

### Hook Configuration

```typescript
interface AIStreamingConfig {
  jsonArrayPath: string;           // Path to extract array data
  onError?: (error: string) => boolean;  // Error handler
  retryAttempts?: number;          // Number of retry attempts
  retryDelay?: number;             // Delay between retries
}
```

### API Configuration

```typescript
interface StreamingRequest {
  feature: string;                 // Feature identifier
  step: string;                    // Step identifier
  data: Record<string, any>;       // Input data
  streaming_mode?: 'structured' | 'text';  // Response mode
}
```

## Data Flow

### Streaming Process

1. **Request Initiation**
   - Frontend calls `startStream()` with request data
   - Hook manages loading state and error handling

2. **Server Processing**
   - API endpoint receives request
   - PromptManager loads appropriate YAML configuration
   - Template variables are substituted
   - OpenAI Agents JS SDK initiates streaming

3. **Progressive Updates**
   - Server streams partial responses
   - Frontend receives and processes chunks
   - Hook extracts data using `jsonArrayPath`
   - Components update with partial data

4. **Completion**
   - Final data is processed and validated
   - Hook updates completion state
   - Components handle final data

### Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Validation Errors**: Schema validation with detailed error messages
- **Timeout Errors**: Configurable timeout with graceful degradation
- **Rate Limiting**: Automatic handling of API rate limits

## Performance Optimization

### Caching Strategy

- **Prompt Caching**: YAML configurations cached after first load
- **Response Caching**: Optional caching of AI responses
- **State Optimization**: Efficient state updates with minimal re-renders

### Memory Management

- **Stream Cleanup**: Automatic cleanup of streaming connections
- **State Cleanup**: Proper cleanup of component state
- **Error Recovery**: Memory-efficient error handling

### Network Optimization

- **Compression**: Response compression for large datasets
- **Chunking**: Efficient data chunking for streaming
- **Connection Reuse**: HTTP connection pooling

## Testing

### Unit Tests

```typescript
describe('useAIStreaming', () => {
  it('should handle streaming data correctly', async () => {
    const { result } = renderHook(() => useAIStreaming({
      jsonArrayPath: 'data.test'
    }));
    
    // Test streaming functionality
  });
});
```

### Integration Tests

```typescript
describe('AI Streaming Integration', () => {
  it('should complete full streaming flow', async () => {
    // Test complete flow from request to completion
  });
});
```

### Mock Strategies

- **API Mocking**: Mock streaming responses for testing
- **Hook Mocking**: Mock hook behavior for component tests
- **Error Simulation**: Test error handling scenarios

## Security

### Input Validation

- **Request Validation**: All inputs validated before processing
- **Template Injection**: Protection against template injection attacks
- **Rate Limiting**: API rate limiting and abuse prevention

### Output Sanitization

- **Response Validation**: All AI responses validated against schemas
- **Content Filtering**: Inappropriate content filtering
- **Error Sanitization**: Sensitive information removed from errors

### Access Control

- **Authentication**: Secure API access control
- **Authorization**: Feature-based access permissions
- **Audit Logging**: Comprehensive request and response logging

## Monitoring

### Performance Metrics

- **Response Times**: Streaming latency and completion times
- **Error Rates**: Error frequency and types
- **Usage Patterns**: Feature usage and user behavior

### Health Checks

- **API Health**: Endpoint availability and performance
- **Model Health**: AI model response quality
- **System Health**: Overall system performance

### Alerting

- **Error Alerts**: Automatic error notification
- **Performance Alerts**: Performance degradation alerts
- **Capacity Alerts**: Resource usage monitoring

## Migration Notes

This system was developed during the migration from recipe-wizard to create-recipe:

### Key Improvements

- **Unified Architecture**: Single system for all AI streaming needs
- **Configuration-Driven**: YAML-based prompt management
- **Reusable Components**: Generic hooks and utilities
- **Better Testing**: Comprehensive test coverage
- **Enhanced Error Handling**: Robust error recovery

### Backward Compatibility

- **Data Format Support**: Supports both recipe-wizard and create-recipe formats
- **Gradual Migration**: Allows incremental feature migration
- **Fallback Mechanisms**: Graceful degradation for unsupported features

## Future Enhancements

### Planned Features

1. **Multi-Model Support**: Support for different AI models per step
2. **Advanced Caching**: Intelligent response caching strategies
3. **Real-Time Collaboration**: Multi-user streaming capabilities
4. **Analytics Integration**: Advanced usage analytics
5. **Performance Optimization**: Further streaming optimizations

### Extensibility

- **Custom Hooks**: Framework for custom streaming hooks
- **Plugin System**: Extensible plugin architecture
- **Custom Transformations**: Configurable data transformations
- **Integration APIs**: APIs for third-party integrations

## Support

For questions about the AI streaming system:

1. Check this documentation for guidance
2. Review existing implementations for examples
3. Test with the provided hooks and utilities
4. Check the API endpoint documentation
5. Refer to the OpenAI Agents JS SDK documentation

The AI streaming system provides a robust, scalable foundation for real-time AI integration with comprehensive testing, monitoring, and security features.
