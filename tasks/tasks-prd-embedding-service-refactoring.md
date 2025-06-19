# Implementation Plan: Embedding Service Refactoring

This document outlines the specific tasks required to implement the requirements detailed in `prd-embedding-service-refactoring.md`.

## Relevant Files

- `src/lib/ai/tools/vector-search-tool.ts` - Main file to refactor, contains duplicate OpenAI embedding logic that needs to use embeddings service
- `src/lib/ai/tools/vector-search-tool.test.ts` - Unit tests for the refactored vector search tool
- `src/lib/ai/services/embeddings.service.ts` - Existing embeddings service that needs to become the single source of truth
- `src/lib/ai/services/embeddings.service.test.ts` - Unit tests for embeddings service functionality
- `src/lib/ai/agents/oil-selection-agent.ts` - Agent that uses vector search tools, needs validation after refactoring
- `src/lib/ai/agents/oil-orchestrator-agent.ts` - Agent that uses vector search tools, needs validation after refactoring
- `src/app/api/ai/streaming/route.ts` - API route that adds vectorSearchTools for suggested-oils step, needs validation
- `docs/ai-integration/embedding-service-patterns.md` - New documentation for integration patterns
- `docs/ai-integration/troubleshooting-embeddings.md` - New troubleshooting guide for embedding service issues

### Notes

- Unit tests should be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Integration tests should validate the entire create-recipe workflow suggested-oils step.
- Performance tests should ensure response times remain within 5% of current performance.

## Tasks

- [ ] 1.0 Eliminate Duplicate Embedding Logic and Establish Single Source of Truth
  - [ ] 1.1 Analyze current embedding implementations in `vector-search-tool.ts` (lines 32-76) and `embeddings.service.ts`.
  - [ ] 1.2 Identify all duplicate OpenAI embedding logic that needs to be removed.
  - [ ] 1.3 Enhance `embeddings.service.ts` to support tool-level configuration overrides.
  - [ ] 1.4 Add `model` parameter support to `createEmbedding()` method for per-tool customization.
  - [ ] 1.5 Test embeddings service with different model configurations to ensure flexibility.
  - [ ] 1.6 Create utility functions for common embedding patterns (therapeutic properties, health concerns).

- [ ] 2.0 Refactor Vector Search Tool with Clean Architecture
  - [ ] 2.1 Remove direct OpenAI client instantiation from `searchWithPinecone()` function.
  - [ ] 2.2 Replace OpenAI embedding calls with `getEmbeddingsService().createEmbedding()`.
  - [ ] 2.3 Update `searchWithPinecone()` to accept embedding model as an optional parameter.
  - [ ] 2.4 Refactor Portuguese search query construction to use the embeddings service.
  - [ ] 2.5 Remove all mock data fallback logic (`searchWithMockData` function and calls).
  - [ ] 2.6 Clean up imports and remove unused OpenAI client dependencies.
  - [ ] 2.7 Update `vectorSearchTool` execute method to handle new embedding service integration.

- [ ] 3.0 Update Dependent Agents to Use New Embedding Architecture
  - [ ] 3.1 Update `oil-selection-agent.ts` to work with the refactored vector search tool.
  - [ ] 3.2 Update `oil-orchestrator-agent.ts` to work with the refactored vector search tool.
  - [ ] 3.3 Verify AI streaming API route (`src/app/api/ai/streaming/route.ts`) works with updated tools.
  - [ ] 3.4 Test create-recipe workflow's suggested-oils step with the new architecture.
  - [ ] 3.5 Update any agent configurations that depend on specific vector search tool behavior.
  - [ ] 3.6 Validate that parallel tool execution still works correctly with the new embedding service.

- [ ] 4.0 Implement Comprehensive Error Handling and Remove Mock Data
  - [ ] 4.1 Remove `searchWithMockData()` function entirely from `vector-search-tool.ts`.
  - [ ] 4.2 Implement graceful error handling for embedding service failures.
  - [ ] 4.3 Add specific error messages for OpenAI API failures vs. Pinecone failures.
  - [ ] 4.4 Update `vectorSearchTool` `errorFunction` to handle embedding-specific errors.
  - [ ] 4.5 Add proper error propagation from the embeddings service to the vector search tool.
  - [ ] 4.6 Test error scenarios: missing API keys, network failures, invalid inputs.
  - [ ] 4.7 Ensure error messages are actionable and help with debugging.

- [ ] 5.0 Create Integration Documentation and Extensible Patterns
  - [ ] 5.1 Create `docs/ai-integration/embedding-service-patterns.md` with usage examples.
  - [ ] 5.2 Document how to integrate the embeddings service with new OpenAI Agents JS tools.
  - [ ] 5.3 Create a troubleshooting guide for common embedding service issues.
  - [ ] 5.4 Add code examples for tool-level configuration overrides.
  - [ ] 5.5 Document best practices for error handling with embedding operations.
  - [ ] 5.6 Create a migration guide for developers updating existing tools to use the embeddings service.
  - [ ] 5.7 Add JSDoc comments to embeddings service methods for a better developer experience.