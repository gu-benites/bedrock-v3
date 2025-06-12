# AI Streaming Endpoint Documentation

## Overview

The `/api/ai/streaming` endpoint provides real-time AI streaming capabilities for the application. It integrates with the OpenAI Agents JS SDK to deliver progressive responses for various AI-powered features.

## Endpoint Details

- **URL**: `/api/ai/streaming`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Response-Type**: `text/plain` (streaming)

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

### Structured Streaming Response

When `streaming_mode` is `'structured'` (default), the endpoint returns JSON objects separated by newlines:

```
{"partial": true, "data": {"potential_causes": [...]}}
{"partial": true, "data": {"potential_causes": [...]}}
{"partial": false, "data": {"potential_causes": [...], "meta": {...}}}
```

### Text Streaming Response

When `streaming_mode` is `'text'`, the endpoint returns plain text chunks:

```
Analyzing your health concern...
Based on your demographics, potential causes include:
1. Chronic stress from work pressure
2. Sleep pattern disruption
...
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

### JavaScript/TypeScript

```typescript
async function streamAIResponse(requestData: StreamingRequest) {
  const response = await fetch('/api/ai/streaming', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        // Process streaming data
        console.log('Received:', data);
      } catch (e) {
        // Handle non-JSON chunks
      }
    }
  }
}
```

### React Hook Integration

```typescript
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';

function MyComponent() {
  const { startStream, partialData, finalData, isComplete } = useAIStreaming({
    jsonArrayPath: 'data.potential_causes'
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
      <button onClick={handleStartStreaming}>Start AI Analysis</button>
      {partialData && <div>Partial results: {partialData.length} items</div>}
      {isComplete && <div>Analysis complete!</div>}
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
