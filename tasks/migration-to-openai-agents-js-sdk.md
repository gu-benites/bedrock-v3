# Migrating Demographics to Causes Flow with Structured Streaming (OpenAI Agents JS SDK)

- [Related PRD: Demographics-to-Causes Migration](/tasks/prd-migrate-demographics-causes-flow.md)
- [Related Task List: Demographics-to-Causes Migration](/tasks/tasks-prd-migrate-demographics-causes-flow.md)

This document outlines the steps and considerations required to implement the transition from the Demographics screen to the Potential Causes screen within the Recipe Wizard feature, leveraging the OpenAI Agents JS SDK for structured data streaming. This process is driven by the `potential-causes.yaml` prompt configuration and adheres to the data structures defined in `docs/recipe-wizard/api-mapping.md`. A detailed Product Requirements Document and Task List have been created to guide the implementation of this migration.

## Introduction

The Recipe Wizard is designed with a step-by-step flow, where user input from one screen informs the AI analysis for the next. The transition from capturing user demographics to identifying potential causes of their health concern is a key point where AI is utilized to provide structured, relevant information. This document details how to ensure this transition uses the project's established patterns for structured data streaming with the OpenAI Agents JS SDK.

## Key Components and Required Actions

Implementing the Demographics to Causes flow with structured streaming involves coordinating changes across several key parts of the application:

### 1. Prompt Management (`src/features/recipe-wizard/prompts/` and `src/features/recipe-wizard/services/prompt-manager.ts`)

*   **Role:** Manages the loading and processing of AI prompt configurations defined in YAML files.
*   **Current State:** The `PromptManager` is functional and loads prompts based on their names. `potential-causes.yaml` is the specific prompt intended for this step.
*   **Action Required:**
    *   **Verify `potential-causes.yaml`:** Ensure that `/src/features/recipe-wizard/prompts/potential-causes.yaml` accurately defines:
        *   A `template` section containing the prompt text that instructs the AI to identify potential causes based on the user's health concern and demographics.
        *   A `config` section specifying the OpenAI model (`model`), `temperature`, and `max_tokens`.
        *   A `schema` section that precisely matches the JSON schema for the `PotentialCauses` structure outlined in `/docs/recipe-wizard/api-mapping.md`. This is critical for structured output.
    *   **Preload Configuration:** Confirm that `PromptManager.preloadPrompts()` in `/src/features/recipe-wizard/services/prompt-manager.ts` includes `'potential-causes'` in the list of prompts to load on application startup.

### 2. AI Streaming API Route (`src/app/api/ai/streaming/route.ts`)

*   **Role:** Acts as the backend endpoint that receives frontend requests, interacts with the OpenAI Agents SDK, and streams structured AI responses back to the client.
*   **Current State:** The route is capable of handling streaming requests and using a loaded prompt configuration to create and run an OpenAI Agent with a structured output schema.
*   **Action Required:**
    *   **Step Identification:** Within the `POST` handler, ensure the logic correctly identifies the `step` as `'potential-causes'` when a request is received for the demographics-to-causes transition. This will determine which prompt configuration is loaded.
    *   **Variable Preparation:** Verify that the `prepareTemplateVariables` function extracts the user's health concern and demographic information from the incoming `request.json()` body and formats them correctly to be substituted into the `potential-causes.yaml` template.
    *   **Agent Configuration:** Confirm that the loaded `config.schema` from `potential-causes.yaml` is correctly passed as the `outputType` when creating the OpenAI `Agent`.
    *   **Structured Streaming Handling:** Ensure that the `handleStructuredOnlyStreaming` function (or the logic responsible for streaming structured data) correctly processes the output based on the structure defined in `PotentialCauses` schema from `api-mapping.md`. This involves using `best-effort-json-parser` to progressively extract complete items from the streamed text.

### 3. Streaming Hook (`src/lib/ai/hooks/use-ai-streaming.ts`)

*   **Role:** A reusable frontend hook for managing the lifecycle of an Server-Sent Events (SSE) connection, accumulating streamed data, and handling errors/completion.
*   **Current State:** The hook supports accumulating text and progressively parsing structured data based on a `jsonArrayPath` configuration.
*   **Action Required:**
    *   **Hook Integration:** Integrate the `useAIStreaming` hook into the frontend component responsible for the transition from the Demographics screen (e.g., the component on the `/dashboard/recipe-wizard/demographics` page or the parent wizard container).
    *   **`jsonArrayPath` Configuration:** When calling `startStream` from this hook, provide the `jsonArrayPath` option set to the path of the array containing potential causes within the expected structured JSON response. Based on `/docs/recipe-wizard/api-mapping.md`, this would likely be `'data.potential_causes'`. This allows the hook to extract and provide partial or complete cause objects as they stream in.

### 4. Frontend Integration and State Management (`src/features/recipe-wizard/components/`, `src/features/recipe-wizard/store/wizard-store.ts`)

*   **Role:** React components provide the user interface, and the Zustand store manages the wizard's state and data across steps.
*   **Current State:** Components exist for demographics input and displaying potential causes. The store holds the wizard's state.
*   **Action Required:**
    *   **Triggering the AI Call:** In the Demographics form component (or parent), implement the logic to be executed when the user completes the form and proceeds to the next step. This logic should:
        *   Collect the user's health concern and demographic data from the store.
        *   Call the `startStream` function from the `useAIStreaming` hook, passing the API endpoint (`/api/ai/streaming`), the collected data, and specifying `step: 'potential-causes'` and `streaming_mode: 'structured'`.
        *   Set the UI state to indicate loading/streaming.
    *   **Processing Streamed Data:** Implement the callbacks provided by `useAIStreaming` (`onChunk` or equivalent logic within `handleStreamEvent`) to receive the parsed structured data (individual potential cause objects or partial arrays). Update the Zustand store with this progressive data.
    *   **Store Updates:** Enhance the `/src/features/recipe-wizard/store/wizard-store.ts` to include a state property to hold the list of potential causes (`potentialCauses: PotentialCause[] | null`). Add actions to update this list with the streamed data and handle loading/error states related to this specific AI call.
    *   **Displaying Causes:** The component for the "causes" screen (`/dashboard/recipe-wizard/potential-causes`) should read the `potentialCauses` data from the Zustand store and render the potential causes to the user as they become available via streaming. Implement loading indicators and error displays based on the store's state.

### 5. Dynamic Flow and API Mapping (`docs/recipe-wizard/api-mapping.md`)

*   **Role:** Serves as the central documentation for the API's structured data formats for each step of the Recipe Wizard.
*   **Current State:** Defines the expected JSON structure for the `PotentialCauses` step, including the `cause_id`, `name_localized`, `suggestion_localized`, and `explanation_localized` fields within the `data.potential_causes` array.
*   **Action Required:**
    *   **Adherence:** Consistently refer to and adhere to the `PotentialCauses` schema defined in this document throughout the implementation.
    *   **Documentation:** Ensure that any future changes to the expected structured output for the "potential-causes" step are first documented in `/docs/recipe-wizard/api-mapping.md`, then reflected in `/src/features/recipe-wizard/prompts/potential-causes.yaml`, the API route's processing logic, and the frontend components/store.

## Conclusion

By carefully coordinating the configuration in `potential-causes.yaml` with the dynamic handling logic in the AI streaming API route (`route.ts`), the progressive parsing capabilities of the `useAIStreaming` hook, and the state management in the frontend store, we can successfully migrate the demographics to causes flow to use structured data streaming. Adhering to the `api-mapping.md` document as the source of truth for data structures is paramount to maintaining consistency and enabling dynamic processing for subsequent steps in the Recipe Wizard. This approach ensures a robust, scalable, and maintainable AI integration.
# Migrating Demographics to Causes Flow with Structured Streaming (OpenAI Agents JS SDK)

This document outlines the steps and considerations required to implement the transition from the Demographics screen to the Potential Causes screen within the Recipe Wizard feature, leveraging the OpenAI Agents JS SDK for structured data streaming. This process is driven by the `potential-causes.yaml` prompt configuration and adheres to the data structures defined in `docs/recipe-wizard/api-mapping.md`.

## Introduction

The Recipe Wizard is designed with a step-by-step flow, where user input from one screen informs the AI analysis for the next. The transition from capturing user demographics to identifying potential causes of their health concern is a key point where AI is utilized to provide structured, relevant information. This document details how to ensure this transition uses the project's established patterns for structured data streaming with the OpenAI Agents JS SDK.

## Key Components and Required Actions

Implementing the Demographics to Causes flow with structured streaming involves coordinating changes across several key parts of the application:

### 1. Prompt Management (`src/features/recipe-wizard/prompts/` and `src/features/recipe-wizard/services/prompt-manager.ts`)

*   **Role:** Manages the loading and processing of AI prompt configurations defined in YAML files.
*   **Current State:** The `PromptManager` is functional and loads prompts based on their names. `potential-causes.yaml` is the specific prompt intended for this step.
*   **Action Required:**
    *   **Verify `potential-causes.yaml`:** Ensure that `src/features/recipe-wizard/prompts/potential-causes.yaml` accurately defines:
        *   A `template` section containing the prompt text that instructs the AI to identify potential causes based on the user's health concern and demographics.
        *   A `config` section specifying the OpenAI model (`model`), `temperature`, and `max_tokens`.
        *   A `schema` section that precisely matches the JSON schema for the `PotentialCauses` structure outlined in `docs/recipe-wizard/api-mapping.md`. This is critical for structured output.
    *   **Preload Configuration:** Confirm that `PromptManager.preloadPrompts()` in `src/features/recipe-wizard/services/prompt-manager.ts` includes `'potential-causes'` in the list of prompts to load on application startup.

### 2. AI Streaming API Route (`src/app/api/ai/streaming/route.ts`)

*   **Role:** Acts as the backend endpoint that receives frontend requests, interacts with the OpenAI Agents SDK, and streams structured AI responses back to the client.
*   **Current State:** The route is capable of handling streaming requests and using a loaded prompt configuration to create and run an OpenAI Agent with a structured output schema.
*   **Action Required:**
    *   **Step Identification:** Within the `POST` handler, ensure the logic correctly identifies the `step` as `'potential-causes'` when a request is received for the demographics-to-causes transition. This will determine which prompt configuration is loaded.
    *   **Variable Preparation:** Verify that the `prepareTemplateVariables` function extracts the user's health concern and demographic information from the incoming `request.json()` body and formats them correctly to be substituted into the `potential-causes.yaml` template.
    *   **Agent Configuration:** Confirm that the loaded `config.schema` from `potential-causes.yaml` is correctly passed as the `outputType` when creating the OpenAI `Agent`.
    *   **Structured Streaming Handling:** Ensure that the `handleStructuredOnlyStreaming` function (or the logic responsible for streaming structured data) correctly processes the output based on the structure defined in `potentialCauses` schema from `api-mapping.md`. This involves using `best-effort-json-parser` to progressively extract complete items from the streamed text.

### 3. Streaming Hook (`src/lib/ai/hooks/use-ai-streaming.ts`)

*   **Role:** A reusable frontend hook for managing the lifecycle of an Server-Sent Events (SSE) connection, accumulating streamed data, and handling errors/completion.
*   **Current State:** The hook supports accumulating text and progressively parsing structured data based on a `jsonArrayPath` configuration.
*   **Action Required:**
    *   **Hook Integration:** Integrate the `useAIStreaming` hook into the frontend component responsible for the transition from the Demographics screen (e.g., the component on the `/dashboard/recipe-wizard/demographics` page or the parent wizard container).
    *   **`jsonArrayPath` Configuration:** When calling `startStream` from this hook, provide the `jsonArrayPath` option set to the path of the array containing potential causes within the expected structured JSON response. Based on `api-mapping.md`, this would likely be `'data.potential_causes'`. This allows the hook to extract and provide partial or complete cause objects as they stream in.

### 4. Frontend Integration and State Management (`src/features/recipe-wizard/components/`, `src/features/recipe-wizard/store/wizard-store.ts`)

*   **Role:** React components provide the user interface, and the Zustand store manages the wizard's state and data across steps.
*   **Current State:** Components exist for demographics input and displaying potential causes. The store holds the wizard's state.
*   **Action Required:**
    *   **Triggering the AI Call:** In the Demographics form component (or parent), implement the logic to be executed when the user completes the form and proceeds to the next step. This logic should:
        *   Collect the user's health concern and demographic data from the store.
        *   Call the `startStream` function from the `useAIStreaming` hook, passing the API endpoint (`/api/ai/streaming`), the collected data, and specifying `step: 'potential-causes'` and `streaming_mode: 'structured'`.
        *   Set the UI state to indicate loading/streaming.
    *   **Processing Streamed Data:** Implement the callbacks provided by `useAIStreaming` (`onChunk` or equivalent logic within `handleStreamEvent`) to receive the parsed structured data (individual potential cause objects or partial arrays). Update the Zustand store with this progressive data.
    *   **Store Updates:** Enhance the `wizard-store.ts` to include a state property to hold the list of potential causes (`potentialCauses: PotentialCause[] | null`). Add actions to update this list with the streamed data and handle loading/error states related to this specific AI call.
    *   **Displaying Causes:** The component for the "causes" screen (`/dashboard/recipe-wizard/potential-causes`) should read the `potentialCauses` data from the Zustand store and render the potential causes to the user as they become available via streaming. Implement loading indicators and error displays based on the store's state.

### 5. Dynamic Flow and API Mapping (`docs/recipe-wizard/api-mapping.md`)

*   **Role:** Serves as the central documentation for the API's structured data formats for each step of the Recipe Wizard.
*   **Current State:** Defines the expected JSON structure for the `PotentialCauses` step, including the `cause_id`, `name_localized`, `suggestion_localized`, and `explanation_localized` fields within the `data.potential_causes` array.
*   **Action Required:**
    *   **Adherence:** Consistently refer to and adhere to the `PotentialCauses` schema defined in this document throughout the implementation.
    *   **Documentation:** Ensure that any future changes to the expected structured output for the "potential-causes" step are first documented in `api-mapping.md`, then reflected in `potential-causes.yaml`, the API route's processing logic, and the frontend components/store.

## Conclusion

By carefully coordinating the configuration in `potential-causes.yaml` with the dynamic handling logic in the AI streaming API route (`route.ts`), the progressive parsing capabilities of the `useAIStreaming` hook, and the state management in the frontend store, we can successfully migrate the demographics to causes flow to use structured data streaming. Adhering to the `api-mapping.md` document as the source of truth for data structures is paramount to maintaining consistency and enabling dynamic processing for subsequent steps in the Recipe Wizard. This approach ensures a robust, scalable, and maintainable AI integration.