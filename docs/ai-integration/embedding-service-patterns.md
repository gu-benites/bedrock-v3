# Embedding Service Integration Patterns

This document outlines patterns and provides examples for integrating with the `OpenAIEmbeddingsService` and related tools within the AI system. The service centralizes text embedding generation, primarily using OpenAI models.

## OpenAIEmbeddingsService

The `OpenAIEmbeddingsService` is the core component for generating text embeddings.

### Getting an Instance

The service is typically accessed as a singleton:

```typescript
import { getEmbeddingsService } from '@/lib/ai/services/embeddings.service';

const embeddingsService = getEmbeddingsService();
```

### Basic Embedding Creation: `createEmbedding()`

This is the primary method for generating an embedding for a given text.

**Example: Using the default model**

The service is configured with a default embedding model (e.g., `text-embedding-ada-002`).

```typescript
async function generateBasicEmbedding(textToEmbed: string) {
  try {
    const response = await embeddingsService.createEmbedding({
      text: textToEmbed,
    });
    console.log('Generated embedding:', response.embedding);
    console.log('Model used:', response.model);
    console.log('Usage tokens:', response.usage.total_tokens);
    return response.embedding;
  } catch (error) {
    console.error('Error generating basic embedding:', error);
    throw error;
  }
}

// Usage:
// generateBasicEmbedding("This is a test sentence.");
```

**Example: Overriding the embedding model**

You can specify a different OpenAI embedding model per call if needed.

```typescript
async function generateEmbeddingWithCustomModel(textToEmbed: string, modelName: string) {
  try {
    const response = await embeddingsService.createEmbedding({
      text: textToEmbed,
      model: modelName,
    });
    console.log('Generated embedding with custom model:', response.embedding);
    console.log('Model used:', response.model);
    return response.embedding;
  } catch (error) {
    console.error('Error generating embedding with custom model:', error);
    throw error;
  }
}

// Usage:
// generateEmbeddingWithCustomModel("Another test sentence.", "text-embedding-3-small");
```

### Specialized Utility Methods

The service also provides utility methods for common, structured embedding patterns.

**1. `createPortugueseSearchEmbedding()`**

This method is specifically designed for the `vectorSearchTool` to generate embeddings for Portuguese search queries related to therapeutic properties and health concerns. It encapsulates a specific query construction logic.

```typescript
async function generateHealthQueryEmbedding(property: string, concern: string, context?: string, model?: string) {
  try {
    const { embeddingResponse, searchQueryUsed } = await embeddingsService.createPortugueseSearchEmbedding(
      property,
      concern,
      context,
      model
    );
    console.log('Search query used by service:', searchQueryUsed);
    console.log('Generated embedding:', embeddingResponse.embedding);
    console.log('Model used:', embeddingResponse.model);
    return embeddingResponse.embedding;
  } catch (error) {
    console.error('Error generating Portuguese search embedding:', error);
    throw error;
  }
}

// Usage:
// generateHealthQueryEmbedding("Anti-inflamatório", "dor de cabeça", "tensão muscular");
```

**2. Other Utility Methods**

The service may contain other utility methods like `createTherapeuticPropertyEmbedding` (for general therapeutic property contexts) and `createOilDescriptionEmbedding` (for embedding detailed oil descriptions). Refer to the service's source code (`src/lib/ai/services/embeddings.service.ts`) for their specific parameters and usage.


## Tool Integration: `vectorSearchTool`

The `vectorSearchTool` (exposed as `get_recommended_essential_oils` to AI agents) is an example of how the embedding service is used.

- It internally uses `embeddingsService.createPortugueseSearchEmbedding()` to generate embeddings for user queries.
- It allows specifying an `embedding_model` parameter, which is passed down to the embedding service.

**Example: How an agent might use `vectorSearchTool` (conceptual)**

An AI agent's instructions might lead it to call the `get_recommended_essential_oils` tool like this (represented as a JSON object for clarity):

```json
{
  "tool_name": "get_recommended_essential_oils",
  "parameters": {
    "therapeutic_property": "Relaxante Muscular",
    "health_concern": "dores nas costas",
    "additional_context": "após exercício físico",
    "max_results": 5,
    "embedding_model": "text-embedding-3-small" // Optional: overrides default model
  }
}
```
The tool then handles the interaction with the embedding service and Pinecone to fetch results.

## Best Practices for Error Handling

Robust error handling is crucial when integrating with the embedding service and related tools, as these often involve external API calls and complex operations.

### Key Principles:

1.  **Always Use Try-Catch:**
    Wrap all calls to `OpenAIEmbeddingsService` methods or tools that utilize it (like `vectorSearchTool`) in `try-catch` blocks to handle potential exceptions.

    ```typescript
    try {
      const embedding = await embeddingsService.createEmbedding({ text: "my text" });
      // Use embedding
    } catch (error) {
      console.error("Embedding operation failed:", error);
      // Implement specific error handling logic
    }
    ```

2.  **Inspect Error Messages for Context:**
    Error messages from the service and tools are designed to be informative. Look for prefixes to understand the failure's origin:
    - `EmbeddingService:`: Indicates an error directly from the `OpenAIEmbeddingsService`.
    - `Embedding Generation Failed:`: Indicates an error during the embedding phase within a tool like `vectorSearchTool`.
    - `Pinecone Operation Failed:`: Indicates an error during the Pinecone interaction phase within `vectorSearchTool`.
    The detailed message following these prefixes provides more specific information.

3.  **Implement Application-Level Fallbacks (Cautiously):**
    If an embedding-dependent feature is critical, your application might need a strategy for when it fails. This could mean:
    - Temporarily disabling the feature.
    - Using cached/stale data if appropriate and clearly indicated.
    - Providing a clear message to the user that the feature is unavailable.
    Avoid silent fallbacks that obscure problems (like the mock data previously used internally by `vectorSearchTool`).

4.  **Comprehensive Server-Side Logging:**
    Log the full error object (including `error.message`, `error.stack`, and any custom properties) on the server-side when an error is caught. This is vital for debugging. Client-facing or agent-facing error messages should be more user-friendly.

5.  **User-Friendly Error Messages:**
    For errors that ultimately impact an end-user or an AI agent's response:
    - Provide clear, concise messages (e.g., "Could not retrieve recommendations at this time. Please try again later.").
    - Avoid exposing raw internal error messages, stack traces, or sensitive details.
    - The `vectorSearchTool`, for instance, returns a JSON structure with an error message:
      ```json
      {
        "error": true,
        "message": "Vector search tool encountered an issue: Embedding Generation Failed: EmbeddingService: Details...",
        // other relevant context from the request
      }
      ```
      Agents should be prepared to parse such responses.

6.  **Idempotency and Retries:**
    For operations involving external API calls (like embedding generation or Pinecone queries), consider implementing retry mechanisms for transient errors (e.g., network issues, temporary API rate limits, 5xx server errors from external services).
    - Use exponential backoff strategies for retries.
    - Ensure that the operations are idempotent or that retrying is safe.
    - The `OpenAIEmbeddingsService` itself does not currently implement automatic retries. This should be handled by the caller if needed.

7.  **Proactive Configuration Checks:**
    Where possible, validate necessary configurations (API keys, environment variables for services like Pinecone) at application startup or before initiating complex workflows. This helps in failing fast and providing immediate feedback on setup issues. The `vectorSearchHealthCheckTool` can assist with checking the `vectorSearchTool`'s dependencies.

By following these practices, you can build more resilient and maintainable integrations with the embedding functionalities.

## Integrating with New OpenAI Agents JS Tools

When creating new tools using the `@openai/agents` SDK that require text embedding capabilities, follow this general pattern:

1.  **Import the Service**: Import `getEmbeddingsService` in your tool's TypeScript file.
    ```typescript
    import { getEmbeddingsService } from '@/lib/ai/services/embeddings.service';
    ```

2.  **Access in `execute`**: Within your tool's `execute` method, get an instance of the service.
    ```typescript
    // Inside tool's execute method
    const embeddingsService = getEmbeddingsService();
    ```

3.  **Call Service Methods**: Use the appropriate service method (`createEmbedding`, `createPortugueseSearchEmbedding`, etc.) to generate embeddings.
    ```typescript
    // Example: Get embedding for a parameter named 'query_text'
    const { query_text, embedding_model_override } = args; // Assuming 'args' are tool parameters

    const embeddingResponse = await embeddingsService.createEmbedding({
      text: query_text,
      model: embedding_model_override // Pass if tool supports model override
    });
    const vector = embeddingResponse.embedding;
    // Use the vector for subsequent operations (e.g., database lookup)
    ```

4.  **Parameter Handling**: If your tool needs to allow overriding the embedding model (or other parameters specific to embedding), define these in your tool's Zod schema and pass them from `args` to the embedding service methods.

5.  **Error Handling**:
    - Wrap calls to the embedding service in a try-catch block.
    - Catch errors from the service and transform them into the error reporting format expected by your tool or the OpenAI Agents framework. This often involves returning a JSON string with an `error` field and a descriptive `message`.
    ```typescript
    try {
      // ... call embedding service ...
      // ... process results ...
      return JSON.stringify({ success: true, data: /* ... */ });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown embedding error';
      console.error('Error within MyCustomTool during embedding:', errorMessage);
      // Return a JSON string that conforms to your tool's error contract
      return JSON.stringify({
        error: true,
        message: `MyCustomTool failed: Embedding step error - ${errorMessage}`
      });
    }
    ```

By following these steps, new tools can leverage the centralized `OpenAIEmbeddingsService` consistently.

## Migrating Existing Tools to Use `OpenAIEmbeddingsService`

If you have existing tools that make direct calls to the OpenAI API for embeddings (e.g., using `new OpenAI().embeddings.create()`), you should migrate them to use the centralized `OpenAIEmbeddingsService`. The process is similar to integrating a new tool:

1.  **Follow the steps outlined in "Integrating with New OpenAI Agents JS Tools"** above to call `getEmbeddingsService()` and its methods (e.g., `createEmbedding()`).
2.  **Remove Old Code**:
    *   Delete any local instantiation of the `OpenAI` client (`new OpenAI(...)`) if it was solely used for embeddings.
    *   Replace direct calls to `openai.embeddings.create(...)` with calls to the appropriate `OpenAIEmbeddingsService` method.
    *   Adjust your code to handle the response structure from the service (e.g., `embeddingResponse.embedding` instead of `openAIResponse.data[0].embedding`).
3.  **Update Error Handling**: Adapt your existing error handling to catch exceptions from the `OpenAIEmbeddingsService` and manage them according to your tool's error reporting strategy. Remember that errors from the service are often prefixed (e.g., `EmbeddingService:`).
4.  **Test Thoroughly**: After migration, re-test your tool extensively to ensure it functions correctly with the centralized service, including its error handling and model override capabilities if applicable.

This ensures consistency, leverages centralized configuration and error handling, and makes future updates to embedding logic easier to manage.
```
