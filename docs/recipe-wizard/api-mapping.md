# API Migration: `create-recipe` to `recipe-wizard`

This document maps the legacy REST-style API calls from the `create-recipe` feature to the new streaming-based services in the `recipe-wizard` feature.

## Summary of Changes

The legacy implementation used a single endpoint and a `step` parameter to fetch data for each part of the wizard in one request. The new implementation uses the `ai-service-streaming.ts` service, which leverages the OpenAI Agents JS SDK. Each call will now initiate a stream corresponding to a specific prompt.

## API Call Mapping

| Legacy Function (`recipe-api.service.ts`) | Legacy `step` Parameter | New Streaming Prompt ID | Data Streamed (Structured JSON) |
| :--- | :--- | :--- | :--- |
| `fetchPotentialCauses` | `POTENTIAL_CAUSES` | `get-potential-causes` | `PotentialCause[]` |
| `fetchPotentialSymptoms` | `POTENTIAL_SYMPTOMS` | `get-potential-symptoms` | `PotentialSymptom[]` |
| `fetchTherapeuticProperties` | `MEDICAL_PROPERTIES` | `get-therapeutic-properties` | `TherapeuticProperty[]` |
| `fetchSuggestedOilsForAllProperties` | `SUGGESTED_OILS` | `get-suggested-oils` | `PropertyOilSuggestions[]` |

## Frontend Integration

Components will be refactored to use the `useAIStreaming` hook. Instead of waiting for a promise to resolve with all data, components will receive data progressively as it's streamed from the backend. The Zustand store (`wizard-store.ts`) is already set up to handle streaming state, including loading, progress, error, and final data.

### Example (Causes Selection):

**Old:**
```typescript
const causes = await fetchPotentialCauses(healthConcern, demographics);
setPotentialCauses(causes);
```

**New:**
```typescript
const { data, stream, isLoading, error } = useAIStreaming();

useEffect(() => {
  stream({
    promptId: 'get-potential-causes',
    body: { healthConcern, demographics }
  });
}, [healthConcern, demographics, stream]);

// The component will re-render as `data` is populated by the stream.
```
