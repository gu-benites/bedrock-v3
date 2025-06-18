# Product Requirements Document: Embedding Service Refactoring

## Introduction/Overview

This PRD outlines the comprehensive refactoring of embedding generation functionality to eliminate code duplication and establish a single source of truth for all embedding operations. Currently, the `src/lib/ai/tools/vector-search-tool.ts` contains direct OpenAI embedding calls that duplicate functionality available in `src/lib/ai/services/embeddings.service.ts`.

The goal is to modularize embedding generation, making `embeddings.service.ts` the exclusive provider for these operations. This refactoring will require minor updates to dependent agents to ensure they correctly integrate with the improved tool, while ensuring the end-to-end functionality of features like the create-recipe workflow's suggested-oils step remains unchanged.

## Goals

1.  **Eliminate Code Duplication**: Replace direct OpenAI embedding calls in `vector-search-tool.ts` with the centralized embeddings service.
2.  **Establish Single Source of Truth**: Make `embeddings.service.ts` the exclusive provider for all embedding operations.
3.  **Ensure Functional Continuity**: Ensure existing agents (oil-selection-agent, oil-orchestrator-agent) continue to function correctly after being updated to use the refactored tool.
4.  **Enable Future Extensibility**: Design interfaces that support future embedding use cases across different agents and tools.
5.  **Remove Mock Data Dependencies**: Replace fallback mock data with robust, graceful error handling.
6.  **Preserve Performance**: Maintain current vector search tool performance and functionality.

## User Stories

1.  **As a developer**, I want to use a centralized embedding service so that I can avoid duplicating OpenAI embedding logic across multiple tools.
2.  **As a developer**, I want the embedding service to be easily configurable so that individual tools can override settings when needed.
3.  **As a system administrator**, I want graceful error handling instead of mock data fallbacks so that failures are transparent and actionable.
4.  **As a create-recipe workflow user**, I want the suggested-oils functionality to continue working seamlessly during and after the refactoring.
5.  **As a future developer**, I want clear integration patterns so that I can easily add embedding functionality to new agents and tools.

## Functional Requirements

### Phase 1: Core Refactoring
1.  **FR-1.1**: The `searchWithPinecone()` function in `vector-search-tool.ts` MUST use `getEmbeddingsService()` instead of direct OpenAI client instantiation.
2.  **FR-1.2**: The embeddings service MUST support model override capabilities, allowing individual tools to specify an embedding model.
3.  **FR-1.3**: All mock data fallback logic MUST be removed from `vector-search-tool.ts`.
4.  **FR-1.4**: Error handling MUST provide graceful failure messages instead of mock data responses.

### Phase 2: Integration Validation
5.  **FR-2.1**: The `oil-selection-agent`, after being updated to use the refactored tool, MUST pass all existing functional tests.
6.  **FR-2.2**: The `oil-orchestrator-agent`, after being updated to use the refactored tool, MUST pass all existing functional tests.
7.  **FR-2.3**: The create-recipe workflow's suggested-oils step MUST maintain current performance and accuracy.
8.  **FR-2.4**: The AI streaming API route MUST continue adding `vectorSearchTools` correctly for the 'suggested-oils' step.

### Phase 3: Future Extensibility
9.  **FR-3.1**: The embeddings service MUST expose a generic interface for any text-to-embedding conversion.
10. **FR-3.2**: New OpenAI Agents JS tools MUST be able to integrate the embeddings service using documented patterns.
11. **FR-3.3**: The service MUST support batch embedding operations for multiple texts.

## Non-Goals (Out of Scope)

1.  **Performance Optimization**: This refactoring will not focus on improving embedding generation speed or efficiency.
2.  **New Embedding Models**: Adding support for non-OpenAI embedding providers is out of scope.
3.  **Vector Search Logic Changes**: Modifications to Pinecone search algorithms or query logic are not included.
4.  **UI/UX Changes**: No frontend modifications to the create-recipe workflow interface.
5.  **Major Agent Behavior Changes**: Significant changes to agent instructions, prompts, or core decision-making logic are out of scope. Minor configuration updates required to integrate the refactored tool are **in scope**.
6.  **Database Schema Changes**: No modifications to Pinecone index structure or metadata schemas.

## Architectural Decisions

This section documents key decisions that inform the implementation plan.

1.  **Configuration Strategy**: Embedding model configuration will be supported at the tool level. The `embeddings.service` will have a default model, but tools can pass an optional `model` parameter to override it for a specific call.
2.  **Error Handling Granularity**: Error messages should be specific enough to distinguish between an embedding generation failure (e.g., OpenAI API error) and a vector search failure (e.g., Pinecone error) to aid in debugging.
3.  **Testing Strategy**: The project will include unit tests for the service and the refactored tool, and end-to-end integration tests for the create-recipe workflow to validate agent functionality.
4.  **Rollback Plan**: In case of critical issues post-deployment, the previous version of the `vector-search-tool.ts` and dependent agent configurations will be reverted via Git.

---

**Target Audience**: Junior developers implementing the refactoring
**Implementation Timeline**: 3-week phased approach with validation at each step
**Risk Level**: Low (The plan accounts for necessary updates to dependent agents to integrate the new architecture, with no changes to user-facing functionality.)