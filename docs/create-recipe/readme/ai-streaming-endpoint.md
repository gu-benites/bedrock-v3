# AI Streaming Endpoint Documentation

## Overview

The `/api/ai/streaming` endpoint provides real-time AI streaming capabilities using Server-Sent Events (SSE) and buffer-based streaming with `best-effort-json-parser`. It integrates with the **OpenAI Agents JS SDK** to deliver progressive, complete responses for AI-powered features.

**🎯 Key Features**:
- **Progressive Item Display**: Individual items appear one-by-one as they're generated
- **Real-time Streaming**: Immediate feedback during AI processing
- **Robust Error Handling**: Comprehensive error recovery and user feedback
- **Dynamic Data Types**: Supports both arrays and single objects automatically
- **Nested Field Access**: Handles complex data structures with dot notation

## Endpoint Details

- **URL**: `/api/ai/streaming`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Response-Type**: `text/event-stream` (SSE streaming)
- **Streaming Method**: Buffer-based with `best-effort-json-parser` for robust JSON handling
- **Data Delivery**: Complete, validated items delivered progressively as they become available
- **State Management**: Supports both hook-based and store-based streaming patterns
- **Error Recovery**: Graceful handling of network issues, timeouts, and AI service errors

## Authentication

Currently, the endpoint uses session-based authentication. Future versions may include API key authentication for external integrations.

## Request Schema

### Base Request Structure

```typescript
interface StreamingRequest {
  feature: string;                    // Feature identifier
  step: string;                       // Step identifier within the feature
  data: Record<string, any>;          // Input data for the AI processing
  streaming_mode?: 'structured' | 'text';  // Response format (default: 'structured')
  session_id?: string;                // Optional session identifier
}
```

### Required Fields

- **feature**: Identifies which feature is making the request (e.g., 'create-recipe', 'recipe-wizard')
- **step**: Identifies the specific AI step (e.g., 'potential-causes', 'potential-symptoms')
- **data**: Contains the input data required for AI processing

### Optional Fields

- **streaming_mode**: Determines response format
  - `'structured'`: JSON-structured responses (default)
  - `'text'`: Plain text streaming responses
- **session_id**: For tracking user sessions and maintaining context

## Response Formats

### Structured Streaming Response (SSE)

When `streaming_mode` is `'structured'` (default), the endpoint returns Server-Sent Events with complete items only:

```
data: {"type": "structured_data", "field": "potential_causes", "index": 0, "data": {"cause_id": "cause_1", "name_localized": "Stress", "suggestion_localized": "Manage work stress", "explanation_localized": "High stress levels can trigger symptoms"}, "timestamp": "2024-12-10T08:20:00Z"}

data: {"type": "structured_data", "field": "potential_causes", "index": 1, "data": {"cause_id": "cause_2", "name_localized": "Sleep Issues", "suggestion_localized": "Improve sleep hygiene", "explanation_localized": "Poor sleep can affect immune function"}, "timestamp": "2024-12-10T08:20:01Z"}

data: {"type": "structured_complete", "data": {"potential_causes": [...], "meta": {...}}, "stats": {"totalItemsSent": 6, "itemsProcessed": 6}, "timestamp": "2024-12-10T08:20:05Z"}
```

**Key Features:**
- **Progressive Item Display**: Individual items appear one-by-one as they're generated
- **Buffer-based processing**: Uses `best-effort-json-parser` for reliable JSON parsing
- **Dynamic Validation**: Configurable field requirements and minimum lengths per data type
- **Duplicate prevention**: Tracks sent items using unique IDs to prevent duplicates
- **Nested Field Support**: Handles complex ID paths like `therapeutic_property_context.property_id`
- **Real-time Streaming**: Starts immediately during agent execution (not after completion)

### Text Streaming Response (SSE)

When `streaming_mode` is `'text'`, the endpoint returns text chunks as SSE:

```
data: {"type": "text_chunk", "data": "Analyzing your health concern...", "timestamp": "2024-12-10T08:20:00Z"}

data: {"type": "text_chunk", "data": "Based on your demographics, potential causes include:", "timestamp": "2024-12-10T08:20:01Z"}

data: {"type": "completion", "data": "Analysis complete.", "timestamp": "2024-12-10T08:20:05Z"}
```

## Step-Specific Requests

### 1. Potential Causes Step

**Request Example:**
```json
{
  "feature": "create-recipe",
  "step": "potential-causes",
  "data": {
    "healthConcern": "chronic anxiety and stress",
    "demographics": {
      "gender": "female",
      "ageCategory": "adult",
      "specificAge": 28,
      "language": "en"
    }
  }
}
```

**Response Schema:**
```json
{
  "meta": {
    "step_name": "PotentialCauses",
    "request_id": "req_123",
    "timestamp_utc": "2024-12-10T08:20:00Z",
    "version": "api_v1.0_step_v1.1",
    "user_language": "en",
    "status": "success",
    "message": "Successfully retrieved potential causes."
  },
  "data": {
    "potential_causes": [
      {
        "cause_id": "cause_chronic_stress",
        "name_localized": "Chronic Stress Response",
        "suggestion_localized": "Prolonged stress affecting your body's natural balance",
        "explanation_localized": "Chronic stress can lead to elevated cortisol levels and persistent tension."
      }
    ]
  },
  "echo": {
    "health_concern_input": "chronic anxiety and stress",
    "user_info_input": {
      "gender": "female",
      "age_category": "adult",
      "age_specific": "28",
      "age_unit": "years"
    }
  }
}
```

### 2. Potential Symptoms Step

**Request Example:**
```json
{
  "feature": "create-recipe",
  "step": "potential-symptoms",
  "data": {
    "healthConcern": "chronic anxiety and stress",
    "demographics": {
      "gender": "female",
      "ageCategory": "adult",
      "specificAge": 28,
      "language": "en"
    },
    "selectedCauses": [
      {
        "cause_name": "Chronic Stress Response",
        "cause_suggestion": "Work-related stress",
        "explanation": "High stress levels from work pressure"
      }
    ]
  }
}
```

**Response Schema:**
```json
{
  "data": {
    "potential_symptoms": [
      {
        "symptom_id": "symptom_tension_headache",
        "name_localized": "Tension Headaches",
        "suggestion_localized": "Frequent headaches from muscle tension",
        "explanation_localized": "Stress-induced muscle tension can cause recurring headaches."
      }
    ]
  }
}
```

### 3. Therapeutic Properties Step

**Request Example:**
```json
{
  "feature": "create-recipe",
  "step": "therapeutic-properties",
  "data": {
    "healthConcern": "chronic anxiety and stress",
    "demographics": {
      "gender": "female",
      "ageCategory": "adult",
      "specificAge": 28,
      "language": "en"
    },
    "selectedCauses": [...],
    "selectedSymptoms": [...]
  }
}
```

**Response Schema:**
```json
{
  "data": {
    "therapeutic_properties": [
      {
        "property_id": "prop_calming",
        "property_name_localized": "Calming",
        "property_name_english": "Calming",
        "description_contextual_localized": "Helps reduce anxiety and promote relaxation",
        "addresses_cause_ids": ["cause_chronic_stress"],
        "addresses_symptom_ids": ["symptom_anxiety"],
        "relevancy_score": 0.95
      }
    ]
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "timestamp": "2024-12-10T08:20:00Z",
    "request_id": "req_123"
  }
}
```

### Common Error Codes

- **`INVALID_REQUEST`**: Malformed request or missing required fields
- **`INVALID_STEP`**: Unknown or unsupported step identifier
- **`PROMPT_NOT_FOUND`**: Prompt configuration not found for the specified step
- **`AI_SERVICE_ERROR`**: Error from the AI service (OpenAI)
- **`RATE_LIMIT_EXCEEDED`**: Too many requests from the client
- **`INTERNAL_ERROR`**: Unexpected server error

### Error Examples

**Invalid Request:**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: healthConcern",
    "details": "The 'data.healthConcern' field is required for this step",
    "timestamp": "2024-12-10T08:20:00Z",
    "request_id": "req_123"
  }
}
```

**Rate Limit Exceeded:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": "Rate limit: 10 requests per minute",
    "timestamp": "2024-12-10T08:20:00Z",
    "request_id": "req_123"
  }
}
```

## Rate Limiting

- **Default Limit**: 10 requests per minute per session
- **Burst Limit**: 3 concurrent requests
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Performance

### Response Times

- **Initial Response**: < 500ms (first chunk)
- **Streaming Latency**: < 100ms between chunks
- **Total Completion**: 2-10 seconds (depending on complexity)

### Optimization Features

- **Prompt Caching**: YAML configurations cached for faster loading
- **Connection Pooling**: Efficient HTTP connection management
- **Response Compression**: Gzip compression for large responses

## Security

### Input Validation

- All request fields validated against schemas
- Sanitization of user inputs to prevent injection attacks
- Maximum input length limits enforced

### Output Sanitization

- AI responses validated against predefined schemas
- Content filtering for inappropriate responses
- Sensitive information removed from error messages

### Access Control

- Session-based authentication required
- Feature-based access control
- Request logging for audit purposes

## Monitoring

### Metrics Tracked

- **Request Volume**: Number of requests per endpoint
- **Response Times**: Latency metrics for each step
- **Error Rates**: Error frequency by type and step
- **Success Rates**: Successful completion rates

### Health Checks

- **Endpoint Health**: `/api/health/streaming`
- **AI Service Health**: Connection to OpenAI services
- **Prompt Availability**: Validation of prompt configurations

## Debugging Best Practices for Data Transformation Issues

### Common Data Flow Problems

#### 1. Relevancy Scores and Cross-References Lost
**Symptoms**: Frontend displays `undefined` for `relevancy_score`, empty arrays for `addresses_cause_ids`/`addresses_symptom_ids`
**Root Cause**: Processing partial data instead of final complete data, field mapping issues

**Debugging Pattern**:
```javascript
// ✅ Log raw AI response to verify fields exist
useEffect(() => {
  if (propertiesPartialData) {
    console.log('📥 RAW PROPERTIES PARTIAL DATA:', propertiesPartialData);
  }
}, [propertiesPartialData]);

useEffect(() => {
  if (isComplete && finalData) {
    console.log('✅ RAW PROPERTIES FINAL DATA:', finalData);
  }
}, [isComplete, finalData]);

// ✅ Verify field mapping during transformation
const transformedProperties = propertiesPartialData.map((property, index) => {
  console.log(`🔄 Transforming property ${index}:`, {
    allOriginalFields: Object.keys(property),
    relevancy_score: property.relevancy_score,
    addresses_cause_ids: property.addresses_cause_ids,
    fullOriginalProperty: property
  });

  return {
    // Preserve ALL AI response fields
    relevancy_score: property.relevancy_score, // Keep original
    relevancy: property.relevancy_score, // Map for compatibility
    addresses_cause_ids: property.addresses_cause_ids || [],
    addresses_symptom_ids: property.addresses_symptom_ids || []
  };
});
```

#### 2. ID Consistency Issues
**Symptoms**: Cross-references show empty arrays despite AI generating correct IDs
**Root Cause**: Different IDs sent to AI vs stored in frontend

**Debugging Pattern**:
```javascript
// ✅ Verify ID consistency before sending to AI
const requestData = {
  feature: 'create-recipe',
  step: 'therapeutic-properties',
  data: {
    selected_causes: selectedCauses.map(cause => ({
      cause_id: cause.cause_id, // Use stored ID, not generated fallback
      name_localized: cause.cause_name
    }))
  }
};

console.log('🚀 CRITICAL DEBUG - IDs being sent to AI:', {
  selectedCausesStored: selectedCauses.map(c => ({
    cause_id: c.cause_id,
    cause_name: c.cause_name
  })),
  causesBeingSent: requestData.data.selected_causes
});

// ✅ Debug cross-reference matching
const getAddressedCauses = (property) => {
  console.log('🔍 Cross-reference debug:', {
    property_addresses_cause_ids: property.addresses_cause_ids,
    stored_cause_ids: selectedCauses.map(c => c.cause_id)
  });

  const matches = selectedCauses.filter(cause =>
    property.addresses_cause_ids?.includes(cause.cause_id)
  );

  console.log(`✅ Found ${matches.length} matching causes`);
  return matches;
};
```

#### 3. Dual Data Processing Pattern
**Problem**: Relying only on partial data loses complete field information
**Solution**: Process both partial data (for streaming) AND final data (for completeness)

```javascript
// ✅ Process partial data for progressive display
useEffect(() => {
  if (propertiesPartialData && Array.isArray(propertiesPartialData)) {
    const transformedProperties = propertiesPartialData.map(property => ({
      // Transform with all fields preserved
    }));
    updateTherapeuticProperties(transformedProperties);
  }
}, [propertiesPartialData]);

// ✅ CRITICAL: Also process final data to ensure completeness
useEffect(() => {
  if (isComplete && finalData) {
    let finalProperties = [];

    if (Array.isArray(finalData)) {
      finalProperties = finalData.map(property => ({ /* complete mapping */ }));
    } else if (finalData.data?.therapeutic_properties) {
      finalProperties = finalData.data.therapeutic_properties.map(property => ({ /* complete mapping */ }));
    }

    if (finalProperties.length > 0) {
      console.log('🔄 Updating with final complete data:', finalProperties.length);
      updateTherapeuticProperties(finalProperties);
    }
  }
}, [isComplete, finalData]);
```

### Debugging Checklist

#### Before Implementation
- [ ] Verify AI response structure matches expected schema
- [ ] Check that all required fields are included in transformation
- [ ] Ensure ID consistency throughout the pipeline
- [ ] Configure appropriate timeouts for analysis complexity

#### During Debugging
- [ ] Log raw AI response data (`📥 RAW DATA`)
- [ ] Verify field mapping (`🔄 Transforming`)
- [ ] Check ID consistency (`🚀 CRITICAL DEBUG`)
- [ ] Validate cross-reference matching (`🔍 Cross-reference debug`)
- [ ] Confirm final data processing (`✅ Found X matching`)

#### After Implementation
- [ ] Test with real AI responses (not mock data)
- [ ] Verify all fields display correctly in UI
- [ ] Test cross-reference functionality
- [ ] Validate error handling and edge cases

## Testing

### Test Endpoints

- **Development**: `http://localhost:3000/api/ai/streaming`
- **Staging**: `https://staging.example.com/api/ai/streaming`
- **Production**: `https://app.example.com/api/ai/streaming`

### Example Test Requests

Use the provided examples above with tools like:
- **curl**: Command-line testing
- **Postman**: API testing interface
- **Frontend Integration**: Direct integration testing

### Mock Responses

For testing purposes, mock responses are available when the `X-Mock-Response` header is set to `true`.

## Integration Examples

### JavaScript/TypeScript (Manual Implementation)

```typescript
async function streamAIResponse(requestData: StreamingRequest) {
  const response = await fetch('/api/ai/streaming', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(requestData)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));

          // Handle different event types
          switch (data.type) {
            case 'structured_data':
              console.log('New item:', data.data);
              break;
            case 'structured_complete':
              console.log('Analysis complete:', data.data);
              break;
            case 'error':
              console.error('Stream error:', data.message);
              break;
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', line);
        }
      }
    }
  }
}
```

### React Hook Integration (Recommended)

```typescript
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';

function MyComponent() {
  const {
    startStream,
    partialData,
    finalData,
    isStreaming,
    isComplete,
    error
  } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes',
    timeout: 45000,
    maxRetries: 5
  });

  const handleStartStreaming = async () => {
    await startStream('/api/ai/streaming', {
      feature: 'create-recipe',
      step: 'potential-causes',
      data: { healthConcern: 'anxiety', demographics: {...} }
    });
  };

  return (
    <div>
      <button onClick={handleStartStreaming} disabled={isStreaming}>
        {isStreaming ? 'Analyzing...' : 'Start AI Analysis'}
      </button>

      {/* Progressive results */}
      {partialData && (
        <div>
          <p>Found {partialData.length} potential causes:</p>
          {partialData.map((cause, index) => (
            <div key={index}>{cause.name_localized}</div>
          ))}
        </div>
      )}

      {/* Error handling */}
      {error && <div className="error">Error: {error}</div>}

      {/* Completion */}
      {isComplete && <div>Analysis complete!</div>}
    </div>
  );
}
```

### AI Streaming Modal Integration

```typescript
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

function ComponentWithModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamingItems, setStreamingItems] = useState([]);

  const { startStream, partialData, isStreaming } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
  });

  // Transform data for modal display
  useEffect(() => {
    if (partialData && Array.isArray(partialData)) {
      const modalItems = partialData.map((cause) => ({
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
      data: { healthConcern: 'anxiety', demographics: {...} }
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

## Support

For API support:

1. Check this documentation for request/response formats
2. Review the error codes and troubleshooting section
3. Test with the provided examples
4. Check the health endpoints for service status
5. Contact the development team for additional support

The AI streaming endpoint provides a robust, scalable foundation for real-time AI integration with comprehensive error handling, monitoring, and security features.
