# Troubleshooting Embedding Service and Integration Issues

This guide helps diagnose and resolve common issues related to the `OpenAIEmbeddingsService` and tools that utilize it, such as the `vectorSearchTool`.

## 1. Configuration Problems

### Issue: `OPENAI_API_KEY` Missing or Invalid
- **Symptom (in logs or tool error response):**
  - `"OPENAI_API_KEY environment variable is required"`
  - `"Embedding Generation Failed: OpenAIEmbeddingsService: OPENAI_API_KEY environment variable is required"`
  - Errors related to authentication failure from OpenAI, often containing `401 Unauthorized`.
- **Solution:**
  - Ensure the `OPENAI_API_KEY` environment variable is correctly set in your deployment environment and development environment (`.env` file).
  - Verify the key is valid and has not expired or been revoked.
  - Check that your OpenAI account has sufficient credits/quota.

### Issue: `vectorSearchTool` - Pinecone Not Configured
- **Symptom (tool error response):**
  - `"Pinecone is not configured. Essential search functionality is unavailable..."` (from `vectorSearchTool.execute`)
  - `"unconfigured"` status for Pinecone in `vectorSearchHealthCheckTool` output.
- **Solution:**
  - Ensure `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` environment variables are correctly set.
  - The `vectorSearchHealthCheckTool` can be used to verify Pinecone connectivity.

## 2. Embedding Generation Failures

These errors typically originate from the `OpenAIEmbeddingsService`.

### Issue: "EmbeddingService: Text input cannot be empty"
- **Symptom (error message):** Exactly as stated.
- **Cause:** An attempt was made to generate an embedding for an empty string.
- **Solution:**
  - Ensure that any text being passed to `embeddingsService.createEmbedding()` or utility functions like `createPortugueseSearchEmbedding()` is non-empty.
  - Add input validation in your calling code or tool schemas (e.g., using Zod `.min(1)` for required text fields) to prevent empty strings from reaching the service.

### Issue: "EmbeddingService: Failed to create embedding. Details: <OpenAI SDK error>"
- **Symptom (error message):** A generic failure from the service, often wrapping a more specific error from the OpenAI API.
- **Cause:**
    - **Invalid Embedding Model:** The specified model (either default or overridden) does not exist or is not accessible by your API key.
    - **OpenAI API Outage/Error:** The OpenAI API might be experiencing temporary issues.
    - **Rate Limiting:** Your application might be exceeding the allowed request rate for the OpenAI Embeddings API.
    - **Network Connectivity Issues:** Problems connecting from your server to the OpenAI API.
    - **Input Too Long:** While the service attempts to truncate, very long inputs might still cause issues with token limits if not handled correctly by the truncation logic for specific models.
- **Solution:**
    - **Check Model Name:** Verify that the embedding model name is correct (e.g., `text-embedding-ada-002`, `text-embedding-3-small`).
    - **Check OpenAI Status:** Visit the [OpenAI status page](https://status.openai.com/) for any ongoing incidents.
    - **Review OpenAI Error Details:** The `<OpenAI SDK error>` part of the message often contains valuable clues from OpenAI directly.
    - **Implement Retry Logic:** For transient issues like rate limits or temporary network errors, consider implementing retry mechanisms with exponential backoff in your application logic where tools are called.
    - **Monitor Usage:** Check your OpenAI API usage dashboard for rate limit or quota issues.

## 3. `vectorSearchTool` Specific Issues

The `vectorSearchTool` combines embedding generation with Pinecone queries. Its errors will typically distinguish the phase of failure.

### Interpreting `vectorSearchTool` Error Messages:
- **`"Vector search tool encountered an issue: Embedding Generation Failed: ..."`**:
  Indicates the problem occurred during the text embedding phase (interacting with `OpenAIEmbeddingsService`). Refer to "Embedding Generation Failures" above.
- **`"Vector search tool encountered an issue: Pinecone Operation Failed: ..."`**:
  Indicates the problem occurred while initializing or querying Pinecone (e.g., Pinecone API key invalid, index not found, query error).
  - **Solution:**
    - Verify `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`.
    - Check Pinecone console for index status and potential issues.
    - The detailed message from the Pinecone client (appended after "Pinecone Operation Failed:") should provide more specific clues.

### Issue: `vectorSearchTool` Returns Empty Results
- **Symptom:** The tool call succeeds (no error) but the `results` array in the JSON output is empty.
- **Cause:** This is usually not an "error" but indicates that Pinecone found no matching vectors for the generated query embedding above the similarity threshold.
  - The search query might be too niche or too different from the content in the vector database.
  - The data you're searching for might not exist in the Pinecone index or the specific namespace.
  - The similarity score threshold used internally by Pinecone might be too high for your query.
- **Solution:**
  - **Refine Search Query:** Try different phrasings for `therapeutic_property`, `health_concern`, or `additional_context`. The `vectorSearchTool` internally tries several variations, but the input parameters guide this.
  - **Check Data:** Ensure the data you expect to find is indeed indexed in Pinecone with appropriate embeddings.
  - **Review Namespaces:** `vectorSearchTool` attempts to search the default namespace and then the 'russell' namespace if the default yields no results. Ensure your data is in one of these or modify the tool if other namespaces are relevant.
  - **Consider Broader Terms:** If your query is very specific, try broadening it.

## 4. Debugging Tips

- **Check Console Logs:** Both `embeddings.service.ts` and `vector-search-tool.ts` (and other tools/agents) output detailed console logs, including error messages. These are invaluable for debugging.
- **Use `vectorSearchHealthCheckTool`:** This tool can help verify if Pinecone and the embedding generation (via a simple test) are operational.
- **Isolate the Problem:**
    - If you suspect an embedding issue, try calling `embeddingsService.createEmbedding()` directly with a simple test case.
    - If you suspect a Pinecone issue, try a very simple query directly against Pinecone if you have access to its client/console.
- **Validate Inputs:** Ensure the data being passed to the tools (and subsequently to the services) is in the correct format and type, and contains valid values. Zod schemas at the tool level help with this.
- **Step Through:** If possible in your development environment, step through the code in `vector-search-tool.ts` or the relevant agent to see where execution flow diverges or errors occur.
```
