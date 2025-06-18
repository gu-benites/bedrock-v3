# Project Brief: Embedding Service Refactoring

**Document Purpose:** This document is the single source of truth for the Embedding Service Refactoring project. It contains the project goals, requirements, key architectural decisions, and a detailed implementation plan.

## 1. Overview

This project will refactor our embedding generation functionality to eliminate code duplication and establish a single source of truth. Currently, `src/lib/ai/tools/vector-search-tool.ts` contains direct OpenAI embedding calls that duplicate logic found in `src/lib/ai/services/embeddings.service.ts`.

The goal is to modularize embedding generation by making the `embeddings.service.ts` the exclusive provider for these operations. This will require minor updates to dependent agents to integrate with the improved tool, while ensuring the end-to-end functionality of features like the create-recipe workflow's "suggested-oils" step remains unchanged.

## 2. Goals & Success Metrics

### Project Goals
1.  **Eliminate Code Duplication**: Replace direct OpenAI embedding calls in `vector-search-tool.ts` with the centralized embeddings service.
2.  **Establish Single Source of Truth**: Make `embeddings.service.ts` the exclusive provider for all embedding operations.
3.  **Ensure Functional Continuity**: Ensure existing agents (oil-selection-agent, oil-orchestrator-agent) continue to function correctly after being updated to use the refactored tool.
4.  **Enable Future Extensibility**: Design interfaces that support future embedding use cases across different agents and tools.
5.  **Remove Mock Data Dependencies**: Replace fallback mock data with robust, graceful error handling.
6.  **Preserve Performance**: Maintain current vector search tool performance and functionality.

### Success Metrics
1.  **Zero Functional Regressions**: All existing agents pass current functionality tests after the refactor.
2.  **Code Reduction**: Elimination of 44+ lines of duplicate embedding code in `vector-search-tool.ts`.
3.  **Error Transparency**: 100% removal of mock data fallbacks, replaced with clear, actionable error messages.
4.  **Performance Parity**: Vector search response times remain within 5% of current performance.
5.  **Integration Readiness**: New documentation and examples are available for future embedding use cases.

## 3. Requirements & Scope

### Functional Requirements
1.  The `searchWithPinecone()` function in `vector-search-tool.ts` **MUST** use `getEmbeddingsService()` instead of a direct OpenAI client.
2.  The embeddings service **MUST** support model override capabilities, allowing individual tools to specify an embedding model.
3.  All mock data fallback logic **MUST** be removed from `vector-search-tool.ts`.
4.  Error handling **MUST** provide graceful failure messages instead of mock data responses.
5.  The `oil-selection-agent` and `oil-orchestrator-agent`, after being updated, **MUST** pass all existing functional tests.
6.  The create-recipe workflow's "suggested-oils" step **MUST** maintain its current performance and accuracy.

### Non-Goals (Out of Scope)
-   **Performance Optimization**: This refactoring will not focus on improving embedding generation speed.
-   **New Embedding Models**: Adding support for non-OpenAI embedding providers is out of scope.
-   **Vector Search Logic Changes**: Modifications to Pinecone search algorithms are not included.
-   **UI/UX Changes**: No frontend modifications will be made.
-   **Major Agent Behavior Changes**: Significant changes to agent instructions, prompts, or core decision-making logic are out of scope. Minor configuration updates required to integrate the refactored tool are **in scope**.

## 4. Architectural Decisions
1.  **Configuration Strategy**: Embedding model configuration will be supported at the tool level. The `embeddings.service` will have a default model, but tools can pass an optional `model` parameter to override it for a specific call.
2.  **Error Handling Granularity**: Error messages will be specific enough to distinguish between an embedding generation failure (OpenAI API) and a vector search failure (Pinecone) to aid debugging.
3.  **Testing Strategy**: The project will include unit tests for the service and the refactored tool, plus end-to-end integration tests for the create-recipe workflow.

---

## 5. Implementation Plan & Tasks

This section contains the actionable steps to complete the project.

### Relevant Files
-   `src/lib/ai/tools/vector-search-tool.ts` - Main file to refactor.
-   `src/lib/ai/tools/vector-search-tool.test.ts` - Unit tests for the refactored tool.
-   `src/lib/ai/services/embeddings.service.ts` - The service to be used as the single source of truth.
-   `src/lib/ai/services/embeddings.service.test.ts` - Unit tests for the service.
-   `src/lib/ai/agents/oil-selection-agent.ts` - Agent to be updated and validated.
-   `src/lib/ai/agents/oil-orchestrator-agent.ts` - Agent to be updated and validated.
-   `src/app/api/ai/streaming/route.ts` - API route to be validated.
-   `docs/ai-integration/embedding-service-patterns.md` - New documentation to be created.
-   `docs/ai-integration/troubleshooting-embeddings.md` - New documentation to be created.

### Technical Notes
-   Unit tests should be placed alongside the code files they are testing.
-   Use `npx jest [optional/path/to/test/file]` to run tests.

### Task Checklist

-   [ ] **1.0 Eliminate Duplicate Embedding Logic and Establish Single Source of Truth**
    -   [ ] 1.1 Analyze current embedding implementations in `vector-search-tool.ts` (lines 32-76) and `embeddings.service.ts`.
    -   [ ] 1.2 Enhance `embeddings.service.ts` to support tool-level configuration overrides.
    -   [ ] 1.3 Add `model` parameter support to the `createEmbedding()` method for per-tool customization.
    -   [ ] 1.4 Test the embeddings service with different model configurations to ensure flexibility.

-   [ ] **2.0 Refactor Vector Search Tool with Clean Architecture**
    -   [ ] 2.1 Remove direct OpenAI client instantiation from the `searchWithPinecone()` function.
    -   [ ] 2.2 Replace OpenAI embedding calls with `getEmbeddingsService().createEmbedding()`.
    -   [ ] 2.3 Update `searchWithPinecone()` to accept the embedding model as an optional parameter.
    -   [ ] 2.4 Remove all mock data fallback logic (the `searchWithMockData` function and its calls).
    -   [ ] 2.5 Clean up imports and remove unused OpenAI client dependencies.
    -   [ ] 2.6 Update the `vectorSearchTool` `execute` method to handle the new embedding service integration.

-   [ ] **3.0 Update Dependent Agents and Validate Integration**
    -   [ ] 3.1 Update `oil-selection-agent.ts` to work with the refactored vector search tool.
    -   [ ] 3.2 Update `oil-orchestrator-agent.ts` to work with the refactored vector search tool.
    -   [ ] 3.3 Update any agent configurations that depend on the specific vector search tool behavior.
    -   [ ] 3.4 Validate that the AI streaming API route (`src/app/api/ai/streaming/route.ts`) works with the updated tools.
    -   [ ] 3.5 Test the end-to-end create-recipe workflow's "suggested-oils" step.

-   [ ] **4.0 Implement Comprehensive Error Handling**
    -   [ ] 4.1 Remove the `searchWithMockData()` function entirely from `vector-search-tool.ts`.
    -   [ ] 4.2 Implement graceful error handling for embedding service failures.
    -   [ ] 4.3 Add specific error messages for OpenAI API failures vs. Pinecone failures.
    -   [ ] 4.4 Add proper error propagation from the embeddings service to the vector search tool.
    -   [ ] 4.5 Test error scenarios: missing API keys, network failures, invalid inputs.

-   [ ] **5.0 Create Documentation**
    -   [ ] 5.1 Create `docs/ai-integration/embedding-service-patterns.md` with usage examples.
    -   [ ] 5.2 Create `docs/ai-integration/troubleshooting-embeddings.md` for common issues.
    -   [ ] 5.3 Add code examples for tool-level configuration overrides.
    -   [ ] 5.4 Add JSDoc comments to public embeddings service methods.

---
**Implementation Timeline**: 3-week phased approach with validation at each step.
**Risk Level**: Low. The plan accounts for necessary updates to dependent agents to integrate the new architecture, with no changes to user-facing functionality.