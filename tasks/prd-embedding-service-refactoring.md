# Product Requirements Document: Embedding Service Refactoring

## Introduction/Overview

This PRD outlines the comprehensive refactoring of embedding generation functionality to eliminate code duplication and establish a single source of truth for all embedding operations across the codebase. Currently, the `src/lib/ai/tools/vector-search-tool.ts` contains direct OpenAI embedding calls that duplicate functionality available in the well-architected but unused `src/lib/ai/services/embeddings.service.ts`.

The goal is to modularize embedding generation while maintaining backward compatibility with existing agents (oil-selection-agent, oil-orchestrator-agent) and ensuring seamless operation of the create-recipe workflow's suggested-oils step.

## Goals

1. **Eliminate Code Duplication**: Replace direct OpenAI embedding calls in vector-search-tool.ts with the centralized embeddings service
2. **Establish Single Source of Truth**: Make `embeddings.service.ts` the exclusive provider for all embedding operations
3. **Maintain Backward Compatibility**: Ensure existing agents continue working without modification
4. **Enable Future Extensibility**: Design interfaces that support future embedding use cases across different agents and tools
5. **Remove Mock Data Dependencies**: Replace fallback mock data with graceful error handling
6. **Preserve Performance**: Maintain current vector search tool performance and functionality

## User Stories

1. **As a developer**, I want to use a centralized embedding service so that I can avoid duplicating OpenAI embedding logic across multiple tools
2. **As a developer**, I want the embedding service to be easily configurable so that individual tools can override settings when needed
3. **As a system administrator**, I want graceful error handling instead of mock data fallbacks so that failures are transparent and actionable
4. **As a create-recipe workflow user**, I want the suggested-oils functionality to continue working seamlessly during and after the refactoring
5. **As a future developer**, I want clear integration patterns so that I can easily add embedding functionality to new agents and tools

## Functional Requirements

### Phase 1: Core Refactoring
1. **FR-1.1**: The `searchWithPinecone()` function in `vector-search-tool.ts` MUST use `getEmbeddingsService()` instead of direct OpenAI client instantiation
2. **FR-1.2**: The refactored implementation MUST maintain identical input/output behavior for the `vectorSearchTool`
3. **FR-1.3**: All mock data fallback logic MUST be removed from `vector-search-tool.ts`
4. **FR-1.4**: Error handling MUST provide graceful failure messages instead of mock data responses
5. **FR-1.5**: The embeddings service MUST support model override capabilities for individual tool configurations

### Phase 2: Integration Validation
6. **FR-2.1**: The oil-selection-agent MUST continue functioning without any code changes
7. **FR-2.2**: The oil-orchestrator-agent MUST continue functioning without any code changes
8. **FR-2.3**: The create-recipe workflow's suggested-oils step MUST maintain current performance and accuracy
9. **FR-2.4**: The AI streaming API route MUST continue adding vectorSearchTools correctly for the 'suggested-oils' step

### Phase 3: Future Extensibility
10. **FR-3.1**: The embeddings service MUST expose a generic interface for any text-to-embedding conversion
11. **FR-3.2**: New OpenAI Agents JS tools MUST be able to integrate the embeddings service using documented patterns
12. **FR-3.3**: The service MUST support batch embedding operations for multiple texts
13. **FR-3.4**: Configuration overrides MUST be possible at the tool level without affecting the global service

## Non-Goals (Out of Scope)

1. **Performance Optimization**: This refactoring will not focus on improving embedding generation speed or efficiency
2. **New Embedding Models**: Adding support for non-OpenAI embedding providers is out of scope
3. **Vector Search Logic Changes**: Modifications to Pinecone search algorithms or query logic are not included
4. **UI/UX Changes**: No frontend modifications to the create-recipe workflow interface
5. **Agent Behavior Changes**: No modifications to agent instructions, prompts, or decision-making logic
6. **Database Schema Changes**: No modifications to Pinecone index structure or metadata schemas

## Technical Considerations

### Dependencies
- **OpenAI Agents JS SDK**: Must maintain compatibility with current tool patterns and agent integration
- **Pinecone TypeScript Client**: Current vector search functionality must remain unchanged
- **Environment Variables**: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` requirements unchanged

### Architecture Constraints
- **Singleton Pattern**: The embeddings service uses singleton pattern via `getEmbeddingsService()`
- **Error Propagation**: Failures must propagate to agents for proper error handling
- **Configuration Inheritance**: Tools must be able to override embedding model settings
- **Async Operations**: All embedding operations are asynchronous and must maintain current patterns

### Integration Patterns
Based on OpenAI Agents JS documentation, the refactored service must support:
- **Tool Integration**: Compatible with `tool()` helper function patterns
- **Agent Configuration**: Seamless integration with Agent constructor tool arrays
- **Streaming Compatibility**: Must work with AI streaming API route patterns
- **Context Passing**: Support for RunContext parameter passing in tool execution

## Implementation Plan

### Phase 1: Core Service Integration (Week 1)
1. **Step 1.1**: Refactor `searchWithPinecone()` function to use `getEmbeddingsService()`
2. **Step 1.2**: Remove direct OpenAI client instantiation from vector-search-tool.ts
3. **Step 1.3**: Update error handling to remove mock data fallbacks
4. **Step 1.4**: Add model override support to embeddings service calls
5. **Step 1.5**: Validate vector search tool functionality with unit tests

### Phase 2: Integration Testing (Week 2)
1. **Step 2.1**: Test oil-selection-agent with refactored vector search tool
2. **Step 2.2**: Test oil-orchestrator-agent with refactored vector search tool
3. **Step 2.3**: Validate create-recipe workflow suggested-oils step end-to-end
4. **Step 2.4**: Performance testing to ensure response time parity
5. **Step 2.5**: Error scenario testing with Pinecone/OpenAI service failures

### Phase 3: Documentation & Future-Proofing (Week 3)
1. **Step 3.1**: Create integration examples for future OpenAI Agents JS tools
2. **Step 3.2**: Document embedding service configuration patterns
3. **Step 3.3**: Update existing documentation to reflect new architecture
4. **Step 3.4**: Create troubleshooting guide for embedding service issues
5. **Step 3.5**: Final validation and deployment preparation

## Success Metrics

1. **Zero Breaking Changes**: All existing agents pass current functionality tests
2. **Code Reduction**: Elimination of 44+ lines of duplicate embedding code in vector-search-tool.ts
3. **Error Transparency**: 100% removal of mock data fallbacks with clear error messages
4. **Performance Parity**: Vector search response times remain within 5% of current performance
5. **Integration Readiness**: Documentation and examples available for future embedding use cases

## Open Questions

1. **Configuration Strategy**: Should embedding model configuration be centralized in the service or remain tool-specific?
2. **Error Handling Granularity**: What level of detail should be provided in error messages for embedding failures?
3. **Testing Strategy**: Should we implement integration tests for the refactored embedding service?
4. **Rollback Plan**: What is the rollback strategy if issues are discovered post-deployment?
5. **Documentation Updates**: Which documentation files need updates to reflect the new integration patterns?

---

**Target Audience**: Junior developers implementing the refactoring
**Implementation Timeline**: 3-week phased approach with validation at each step
**Risk Level**: Low (Updating dependent agents to work with the new embedding architecture (rather than maintaining compatibility), no user-facing changes)
