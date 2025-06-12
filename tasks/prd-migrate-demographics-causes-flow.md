# Product Requirements Document: Migrate Demographics-to-Causes Flow to OpenAI Agents JS SDK

- [Overview: OpenAI Agents JS SDK Migration](/tasks/migration-to-openai-agents-js-sdk.md)
- [Related Task List: Demographics-to-Causes Migration](/tasks/tasks-prd-migrate-demographics-causes-flow.md)

## 1. Introduction/Overview

This document outlines the requirements for migrating the existing AI integration used in the Recipe Wizard's transition from the Demographics screen to the Potential Causes screen. Currently, this flow relies on an outdated external n8n workflow. The goal of this project is to replace the n8n workflow with a direct integration using the new OpenAI Agents JS SDK, specifically implementing structured data streaming for improved performance and a better developer experience. For a broader overview of this migration effort, please refer to the [Overview document](/tasks/migration-to-openai-agents-js-sdk.md).

## 2. Goals

*   Replace the external n8n workflow for generating potential causes with a direct integration using the OpenAI Agents JS SDK.
*   Implement structured data streaming for the AI response to the frontend.
*   Ensure the Causes screen correctly displays the structured data streamed from the AI.
*   Establish a dynamic and reusable pattern for AI integration that can be easily applied to future steps in the Recipe Wizard.

## 3. User Stories (Developer Perspective)

*   As a junior developer, I want to understand how the new OpenAI Agents JS SDK is integrated so I can maintain and extend the AI flows.
*   As a junior developer, I want the AI integration logic to be clearly defined and use structured data so it's easy to parse and use in the frontend.
*   As a junior developer, I want the system to handle AI calls dynamically based on the current wizard step so I can add new steps efficiently.

## 4. Functional Requirements

1.  The system must initiate an AI call to the `/api/ai/streaming` endpoint when the user proceeds from the Demographics screen.
2.  The API call must include the user's health concern and demographic information in the request body.
3.  The API call must specify the target AI step as "potential-causes".
4.  The backend API route (`src/app/api/ai/streaming/route.ts`) must receive the request and identify the "potential-causes" step.
5.  The backend must use the `PromptManager` service (`src/features/recipe-wizard/services/prompt-manager.ts`) to load the configuration and prompt from the `potential-causes.yaml` file.
6.  The backend must use the OpenAI Agents JS SDK to create an agent using the loaded prompt template and model configuration.
7.  The backend must configure the OpenAI Agent's `outputType` using the JSON schema provided in the `schema` section of `potential-causes.yaml`.
8.  The backend must execute the agent with streaming enabled.
9.  The backend must stream the structured AI response data to the frontend using Server-Sent Events (SSE), following the `PotentialCauses` schema defined in `docs/recipe-wizard/api-mapping.md`.
10. The frontend component for the Causes screen must use the `useAIStreaming` hook (`src/lib/ai/hooks/use-ai-streaming.ts`) to listen for and process the streamed structured data.
11. The frontend must progressively update the Zustand store (`src/features/recipe-wizard/store/wizard-store.ts`) with the potential causes as they are received in the stream.
12. The Causes screen must display the potential causes rendered from the data in the Zustand store.
13. The system must handle potential errors during the AI call and streaming process and provide feedback to the user.

## 5. Non-Goals

*   Redesigning the UI for the Demographics or Causes screens.
*   Implementing the selection or processing of causes by the user.
*   Migrating any other steps of the Recipe Wizard to the new SDK in this phase (though the architecture should support it).

## 6. Design Considerations (Optional)

*   The existing UI components for displaying potential causes should be adapted to handle data updating progressively as it streams in.

## 7. Technical Considerations

*   Reference the existing implementation patterns in `src/app/api/ai/streaming/route.ts` and `src/lib/ai/hooks/use-ai-streaming.ts` as examples of integrating the new OpenAI Agents JS SDK.
*   The `PromptManager` is a key service for loading prompt configurations dynamically.
*   The `docs/recipe-wizard/api-mapping.md` document provides the definitive JSON schema for the expected structured output of the "potential-causes" step.
*   Ensure the `useAIStreaming` hook is configured with the correct `jsonArrayPath` to extract the list of causes from the streamed data.
*   Implement thorough testing for the API route, the streaming logic, and the frontend component integration.

## 8. Success Metrics

*   The Causes screen successfully loads and displays the list of potential causes after completing the Demographics form.
*   The data displayed on the Causes screen matches the final structured output received from the AI via the streaming API.
*   The implementation adheres to the structured output format defined in `docs/recipe-wizard/api-mapping.md`.
*   Automated tests for this flow pass consistently.

## 9. Open Questions

*   Are there specific logging or monitoring requirements for this new AI integration beyond the existing logging in the streaming API route?
*   Are there specific error messages or user feedback requirements for different failure scenarios during the AI analysis (e.g., timeout, malformed response)?

## 10. Implementation Status

**Status**: Requirements defined, ready for implementation
**Implementation Tracking**: See [Task List](tasks-prd-migrate-demographics-causes-flow.md) for detailed progress tracking
**Key Constraint**: Use ONLY information provided in task documentation, not external knowledge about OpenAI/Vercel APIs