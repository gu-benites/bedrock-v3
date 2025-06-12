## Relevant Files

-   `src/features/recipe-wizard/prompts/potential-causes.yaml` - Configuration file for the potential causes prompt and schema.
-   `src/features/recipe-wizard/services/prompt-manager.ts` - Service for loading and processing prompt configurations.
-   `src/app/api/ai/streaming/route.ts` - Main API route for handling streaming AI requests.
-   `src/lib/ai/hooks/use-ai-streaming.ts` - Reusable React hook for consuming AI streaming responses.
-   `src/features/recipe-wizard/store/wizard-store.ts` - Zustand store for managing the Recipe Wizard's state.
-   `src/features/recipe-wizard/components/demographics-form.tsx` - Frontend component for the demographics form.
-   `src/features/recipe-wizard/components/potential-causes-form.tsx` - Frontend component for displaying and interacting with potential causes.
-   `docs/recipe-wizard/api-mapping.md` - Document defining the expected structured output schemas.
-   `tasks/prd-migrate-demographics-causes-flow.md` - The PRD for this migration.
-   `src/features/recipe-wizard/services/prompt-manager.test.ts` - Tests for the prompt manager.
-   `src/app/api/ai/streaming/route.test.ts` - (To be created) Tests for the streaming API route.
-   `src/lib/ai/hooks/use-ai-streaming.test.ts` - (To be created/updated) Tests for the streaming hook.
-   `src/features/recipe-wizard/store/wizard-store.test.ts` - Tests for the wizard store.
-   `src/features/recipe-wizard/components/demographics-form.test.tsx` - Tests for the demographics form component.
-   `src/features/recipe-wizard/components/potential-causes-form.test.tsx` - Tests for the potential causes component.

### Notes

-   Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
-   Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
-   This task list assumes a basic understanding of Next.js, React, Zustand, and the OpenAI Agents JS SDK.

## Tasks

-   [ ] 1.0 Configure Prompt Management for the Demographics to Causes Step.
    -   [ ] 1.1 Verify the content and structure of `src/features/recipe-wizard/prompts/potential-causes.yaml`, ensuring it includes the prompt template, model configuration, and a `schema` section that matches the `PotentialCauses` structure in `docs/recipe-wizard/api-mapping.md`.
    -   [ ] 1.2 Confirm that the `preloadPrompts` function in `src/features/recipe-wizard/services/prompt-manager.ts` includes `potential-causes` so the configuration is loaded on application start.
    -   [ ] 1.3 Run or create tests (`src/features/recipe-wizard/services/prompt-manager.test.ts`) to ensure `potential-causes.yaml` is loaded and parsed correctly by the `PromptManager`.
-   [ ] 2.0 Update the API call to use the AI Streaming and Dynamic prompt YAML.
    -   [ ] 2.1 In `src/app/api/ai/streaming/route.ts`, ensure the POST handler correctly extracts the `step` (`"potential-causes"`) and relevant data (health concern, demographics) from the incoming request body.
    -   [ ] 2.2 Verify that the `prepareTemplateVariables` function correctly maps the extracted request data to the variables expected by the `potential-causes.yaml` prompt template.
    -   [ ] 2.3 Confirm that the API route uses the `PromptManager` to load the prompt and configuration for the identified `step` (`"potential-causes"`).
    -   [ ] 2.4 Verify that the OpenAI Agent is created with the loaded prompt, model configuration, and importantly, the `outputType` set to the JSON `schema` loaded from `potential-causes.yaml`.
    -   [ ] 2.5 Ensure the agent is executed with `stream: true`.
    -   [ ] 2.6 Confirm that the structured streaming handler (`handleStructuredOnlyStreaming`) correctly processes the streamed data according to the `PotentialCauses` schema from `docs/recipe-wizard/api-mapping.md`, specifically extracting and formatting the individual cause items.
    -   [ ] 2.7 Create or update tests (`src/app/api/ai/streaming/route.test.ts`) to cover handling requests for the "potential-causes" step, loading the correct prompt, configuring the agent with the schema, and initiating the structured stream.
-   [ ] 3.0 Update the Demographics to Causes Step to use and integrate with the newly developed OpenAI Agents JS SDK and the new JSON schema.
    -   [ ] 3.1 In the component responsible for handling the transition after the demographics form (likely within `src/features/recipe-wizard/components/demographics-form.tsx` or a parent component), modify the logic to initiate the AI call via the frontend.
    -   [ ] 3.2 This initiation should involve calling the `startStream` function provided by the `useAIStreaming` hook.
    -   [ ] 3.3 The call to `startStream` should target the `/api/ai/streaming` endpoint and include the collected health concern, demographic data, and specify `step: 'potential-causes'` and `streaming_mode: 'structured'` in the `requestData`.
    -   [ ] 3.4 Create or update tests for the demographics form component (`src/features/recipe-wizard/components/demographics-form.test.tsx`) to verify that the streaming process is correctly initiated upon form submission or transition.
-   [ ] 4.0 Integrate Streaming Hook and State Management in the Frontend.
    -   [ ] 4.1 In the component that will receive and display the potential causes (likely `src/features/recipe-wizard/components/potential-causes-form.tsx`), integrate the `useAIStreaming` hook.
    -   [ ] 4.2 Configure the `useAIStreaming` hook with the appropriate `jsonArrayPath` to point to the array of potential causes within the streamed structured data (based on `docs/recipe-wizard/api-mapping.md`).
    -   [ ] 4.3 Implement the callback function(s) provided by the `useAIStreaming` hook (e.g., `onChunk`, `handleStreamEvent`) to process the incoming structured data chunks.
    -   [ ] 4.4 Update the Zustand store (`src/features/recipe-wizard/store/wizard-store.ts`) to include a state property to hold the list of potential causes and an action to update this list with the progressively streamed data.
    -   [ ] 4.5 Within the frontend component, use the store action to update the potential causes state as data is received from the stream.
    -   [ ] 4.6 Create or update tests for the streaming hook (`src/lib/ai/hooks/use-ai-streaming.test.ts`) and the wizard store (`src/features/recipe-wizard/store/wizard-store.test.ts`) to ensure correct handling of structured streaming data and state updates.
-   [ ] 5.0 Develop and Integrate the Causes Display Component.
    -   [ ] 5.1 In the `src/features/recipe-wizard/components/potential-causes-form.tsx` component (or the designated causes display component), retrieve the list of potential causes from the Zustand store.
    -   [ ] 5.2 Render the potential causes data retrieved from the store, following the structure and localized fields provided in the streamed data (as defined by the `PotentialCauses` schema in `docs/recipe-wizard/api-mapping.md`).
    -   [ ] 5.3 Implement loading states and error display based on the `isStreaming` and `error` states provided by the `useAIStreaming` hook and managed in the Zustand store.
    -   [ ] 5.4 Create or update tests for the causes display component (`src/features/recipe-wizard/components/potential-causes-form.test.tsx`) to verify that it correctly renders the potential causes based on the data in the store, and handles loading and error states.
-   [ ] 6.0 Ensure Dynamic Adaptability for Future Steps.
    -   [ ] 6.1 Throughout the implementation, prioritize creating reusable patterns for handling different AI steps. This includes how data is passed to the API, how prompts are loaded based on the step, and how streamed structured data is processed based on the schema defined in `api-mapping.md`.
    -   [ ] 6.2 Avoid hardcoding step-specific logic where possible, favoring dynamic approaches based on the `step` parameter and the information available in the loaded prompt configuration and API mapping document.
    -   [ ] 6.3 Document any patterns or conventions established during this migration that will facilitate adding future AI steps.