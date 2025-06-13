# Parallel Agent System for Essential Oil Selection Implementation Study

## Feature Description
Implement a system that selects essential oils for a user based on their profile and user-selected causes, symptoms, and appropriate medical/therapeutic properties. This system will achieve parallelism by running multiple instances of a single **Specialized Oil Selection Agent** concurrently. Each instance of the specialized agent will focus on finding oils relevant to a *single* therapeutic property, leveraging internal tools like a vector store in Pinecone after using a query embedded. The overall orchestration and parallel execution will be managed in the backend code, coordinating the calls to these specialized agent instances.

## Core Concepts and SDK Features to Leverage

The following core concepts and SDK features are crucial for this implementation:


Based on the analysis of the `openai-agents-js` documentation, the following core concepts and SDK features are crucial for this implementation:

*   **Agents (`docs/openai-agents-js/content/guides/agents.mdx`):**
    *   Defining specialized `Agent` instances for finding oils related to specific therapeutic properties.
    *   Using `instructions` to guide agent behavior.
    *   Setting `outputType` with a JSON schema for structured data output.
    *   A single specialized `Agent` definition will be created, which will be instantiated and run multiple times in parallel by the backend code.

*   **Structured Outputs (`docs/openai-agents-js/content/guides/structured-outputs-json-schema.md`):**
    *   Defining a precise JSON schema for the structured data output (list of oils) from specialized agents.
    *   Using `text.format` with `type: "json_schema"` to enforce schema adherence.
    *   The schema ensures that each specialized agent instance returns results in a consistent, machine-readable format, facilitating the collection and aggregation of results from parallel runs.

*   **Tools (`docs/openai-agents-js/content/guides/tools.mdx`):**
    *   Creating **Function Tools** that the specialized oil selection agent calls internally (e.g., a tool for querying the Pinecone vector store).
    *   Defining tool `parameters` for input to these tools.
    *   Implementing the parallel execution logic within the tool's `execute` function.

*   **Running Agents (`docs/openai-agents-js/content/guides/running-agents.mdx`):**
    *   Using the `run()` utility to initiate agent executions (orchestrating and specialized agents).

*   **Parallelization (`docs/openai-agents-js/content/guides/multi-agent.md`, `docs/openai-agents-js/examples/agent-patterns/parallelization.ts`):**
    *   Utilizing `Promise.all()` within the function tool's `execute` function to run multiple specialized agents concurrently.
    *   More precisely, `Promise.all()` will be used in the backend code to run *multiple instances* of the *same* specialized agent concurrently, each with a different therapeutic property.
*   **Context (`docs/openai-agents-js/content/guides/context.mdx`):**
    *   Passing user profile and selected data as **Agent/LLM Context** to agents.
    *   Using **Local Context (RunContext<T>)** for managing run-specific data and dependencies within code (like tool execution).

{
  "health_concern": "dor de cabeça",
  "gender": "female",
  "age_category": "teen",
  "age_specific": "16",
  "selected_causes": [
    {
      causes fields
    },
    {
      ...
    }
  ],
  "selected_symptoms": [
    {
      symptons fields
    },
    {
      ...
    }
  ],
  "therapeutic_property": [
    {
      therapeutic property fields (only one propery since the essential oil selection agent will handle on therapeutic property)
    }
  ],
  "step": "SuggestedOils",
  "user_language": "PT_BR"
}

*   **Streaming (`docs/openai-agents-js/content/guides/streaming.mdx`, `docs/openai-agents-js/content/guides/structured-outputs-json-schema.md`):**
    *   Implementing streaming on the backend (`stream: true` in `run()`).
    *   Handling streamed structured data events on the frontend.
    *   Awaiting `stream.completed` for full execution confirmation.

*   **Models (`docs/openai-agents-js/content/guides/models.mdx`):**
    *   Ensuring the orchestrating agent's model supports parallel function calls (`parallelToolCalls: true`). Model is gpt-4.1-nano
    *   The specialized agent will use a model like `gpt-4.1-nano`.
*   **Tracing (`docs/openai-agents-js/content/guides/tracing.mdx`):**
    *   Leveraging automatic tracing for debugging and visualization of parallel runs.
    *   Considering `withTrace()` for wrapping multi-run workflows.

## Proposed Implementation Steps

1.  **Define JSON Schema for Oil Output:** Create a JSON schema detailing the structure for the output of specialized oil selection agents (e.g., an array of oil objects with relevant details).

{
  "response_format": { // This is the output schema for a *single* specialized agent run
    "type": "json_schema",
    "json_schema": {
      "name": "suggest_oils_for_property_response",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "meta": {
            "type": "object",
            "properties": {
              "step_name": {
                "type": "string",
                "description": "The name of the step in the API process."
              },
              "request_id": {
                "type": "string",
                "format": "uuid",
                "description": "The unique identifier for the request."
              },
              "timestamp_utc": {
                "type": "string",
                "format": "date-time",
                "description": "The UTC timestamp of the response."
              },
              "version": {
                "type": "string",
                "description": "Version information of the API step."
              },
              "user_language": {
                "type": "string",
                "description": "Language used by the user."
              },
              "status": {
                "type": "string",
                "description": "The status of the response."
              },
              "message": {
                "type": "string",
                "description": "A message providing additional information about the response."
              }
            },
            "required": [
              "step_name",
              "request_id",
              "timestamp_utc",
              "version",
              "user_language",
              "status",
              "message"
            ],
            "additionalProperties": false
          },
          "data": {
            "type": "object",
            "properties": {
              "therapeutic_property_context": {
                "type": "object",
                "properties": {
                  "property_id": {
                    "type": "string",
                    "format": "uuid",
                    "description": "Unique identifier for the therapeutic property."
                  },
                  "property_name_localized": {
                    "type": "string",
                    "description": "Localized name of the therapeutic property."
                  },
                  "property_name_english": {
                    "type": "string",
                    "description": "English name of the therapeutic property."
                  },
                  "description_localized": {
                    "type": "string",
                    "description": "Localized description of how this property helps."
                  }
                },
                "required": [
                  "property_id",
                  "property_name_localized",
                  "property_name_english",
                  "description_localized"
                ],
                "additionalProperties": false
              },
              "suggested_oils": {
                "type": "array",
                "description": "List of suggested essential oils for the property.",
                "items": {
                  "type": "object",
                  "properties": {
                    "oil_id": {
                      "type": "string",
                      "description": "System-level unique ID for this oil entity."
                    },
                    "name_english": {
                      "type": "string",
                      "description": "English common name for the oil."
                    },
                    "name_botanical": {
                      "type": "string",
                      "description": "Botanical name (primary identifier) for the oil."
                    },
                    "name_localized": {
                      "type": "string",
                      "description": "Localized common name for the oil."
                    },
                    "match_rationale_localized": {
                      "type": "string",
                      "description": "Localized explanation of why this oil matches the property."
                    },
                    "relevancy_to_property_score": {
                      "type": "integer",
                      "description": "How well this oil matches the property (1-5, 5 being highest)."
                    }
                  },
                  "required": [
                    "oil_id",
                    "name_english",
                    "name_botanical",
                    "name_localized",
                    "match_rationale_localized",
                    "relevancy_to_property_score"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "therapeutic_property_context",
              "suggested_oils"
            ],
            "additionalProperties": false
          },
          "echo": {
            "type": "object",
            "properties": {
              "health_concern_input": {
                "type": "string",
                "description": "The health concern input provided by the user."
              },
              "user_info_input": {
                "type": "object",
                "properties": {
                  "gender": {
                    "type": "string",
                    "description": "Gender of the user."
                  },
                  "age_category": {
                    "type": "string",
                    "description": "General age category of the user."
                  },
                  "age_specific": {
                    "type": "string",
                    "description": "Specific age of the user."
                  },
                  "age_unit": {
                    "type": "string",
                    "description": "Unit of measurement for the user's age."
                  }
                },
                "required": [
                  "gender",
                  "age_category",
                  "age_specific",
                  "age_unit"
                ],
                "additionalProperties": false
              },
              "selected_cause_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "IDs of selected causes."
                }
              },
              "selected_symptom_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "IDs of selected symptoms."
                }
              },
              "therapeutic_property_id": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "IDs of therapeutic properties being addressed."
                }
              }
            },
            "required": [
              "health_concern_input",
              "user_info_input",
              "selected_cause_ids",
              "selected_symptom_ids",
              "therapeutic_property_id"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "meta",
          "data",
          "echo"
        ],
        "additionalProperties": false
      }
    }
  }
}


2.  **Create Specialized Oil Selection Agent:**
    *   Develop a single `Agent` definition that will be instantiated and run for each therapeutic property.
    *   Provide specific `instructions` for finding oils based on their assigned property and the user's context.
    *   Set the `outputType` of each specialized agent to the defined JSON schema.
    *   Include internal tools, such as the Pinecone query tool and potentially a 'Think' tool, in this agent's `tools` array.

### Prompt Template:

**Suggest Relevant Essential Oils (Safety Deferred)**

**Persona:** Act as an expert Aromatherapist and Essential Oil Specialist. Your primary focus is recommending essential oils that strongly possess a specific therapeutic property.
**Objective:** Given a specific `therapeutic_property` including its property_id) and relevant context (user info, health concern), identify and rank essential oils known to possess this property based purely on their **relevance and efficacy for that property**. Safety checks will be performed in a later, dedicated step.

**Input Data:**
*These inputs will be passed as Agent/LLM Context or directly in the run input for each specialized agent instance.*
1.  `therapeutic_property`: A JSON object describing the single property to find oils for.
    *   Value:
        ```json
{{ JSON.stringify($('Edit Fields').item.json.oils.therapeutic_properties[0], null, 2) }}
        ```
2.  **(Context Only) `userInfo`**: JSON object with user details. Used only for subtle contextual understanding if needed for relevance, NOT for safety exclusion at this stage.
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.userInfo, null, 2) }}
        ```
3.  `user_language`: The target language for user-facing text.
    *   Value: `{{ $('Edit Fields').item.json.userInfo.user_language }}`
4.  **(Context Only) `health_concern`**: The primary health complaint.
    *   Value: `{{ $('Edit Fields').item.json.user.health_concern }}`
5.  **(Context Only) `selected_causes`**: Array of relevant causes.
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.user.selected_causes, null, 2) }}
        ```
6.  **(Context Only) `selected_symptoms`**: Array of relevant symptoms.
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.user.selected_symptoms, null, 2) }}
        ```

**Steps:**
1.  **Use function tool get_recommended_essential_oils to perform multiple relevant queries with (`therapeutic_property` AND `health_concern`) for the following steps**
2.  **Target Property Identification:**
    *   Extract the `therapeutic_property` details, primarily using `property_name_in_english` AND `health_concern` for searching multiple times with different queries.
    *   Crucially, note the property_id from the input therapeutic_property object.
3.  **Initial Oil Search:**
    *   Search the knowledge base for essential oils known to possess the specified `therapeutic_property` AND `health_concern`.
4.  **Relevancy Ranking & Selection:**
    *   Evaluate how strongly and effectively each identified oil exhibits the target `therapeutic_property` for addressing the `health_concern`, {{ $('Edit Fields').item.json.user.health_concern }}.
    *   Rank the oils based *primarily* on the strength of each oil's efficacy in exhibiting the target `therapeutic_property` relevant to the `health_concern`
    *   Select the top **5 to 8** most relevant oils based on this ranking.
5.  **Output Generation:**
    *   Format the results in the specified JSON schema, nesting the recommended oils array within the therapeutic property object.
    *   Include the property_id received in the input therapeutic_property object at the top level of the output JSON. This ID must be exactly the same as the one received and must not be altered.
    *   Translate user-facing text fields into the target language specified by `user_language`.
    *   Ensure that the essential oil names (name_english, name_local_language) contain only the plant name and explicitly exclude the word "Oil" or its translation.

**Output Format:**

json schema provided

**Notes:**
- Safety Deferred: This prompt explicitly assumes safety checks are not performed here. The AI should focus solely on identifying oils known for the target property.
- Relevance is Key: The ranking (relevancy) reflects how well the oil matches the `therapeutic_property` for addressing the `health concern`, not overall suitability (which includes safety).
- Clarity: Descriptions should remain clear and concise.
- Language: Ensure user-facing text fields are in the specified user_language {{ $('Edit Fields').item.json.userInfo.user_language }}.
- Structure: Output remains nested, grouping suggested oils under the property they address.
- ID Preservation: The property_id in the output JSON must match the property_id received in the input therapeutic_property object exactly.
- When listing essential oil names (name_english, name_local_language), provide only the common plant name and omit the word "Oil" or its translation.


3.  **Define the Parallel Execution Function Tool:**
    *   Create a JavaScript function to encapsulate the parallel execution logic.
    *   Wrap this function using the `tool()` helper, defining its name, description, and input parameters schema (e.g., the list of selected properties).
    *   Implement the tool's `execute` function to:
        *   Access user/selection context.
        *   Identify necessary specialized agents based on tool input.
        *   Prepare input for each selected specialized agent.
        *   Create `run()` promises for each specialized agent.
        *   Use `Promise.all()` to run the agents concurrently.
        *   Collect structured oil data from each agent's `finalOutput`.
        *   Combine the collected data into a single result.
        *   Return the combined result.
4.  **Create the Orchestrating Therapeutic Agent:**
    *   Define the main `TherapeuticAgent`.
    *   Write `instructions` for the LLM to identify therapeutic properties and utilize the parallel execution tool.
    *   Include the parallel execution function tool in this agent's `tools` array.
    *   Enable parallel tool calls in the agent's `modelSettings` (`parallelToolCalls: true`).
5.  **Integrate into the Streaming Endpoint (`/api/ai/streaming`):**
    *   Modify the relevant API route handler.
    *   Receive user data and selected properties.
    *   Run the `TherapeuticAgent` using `run()` with `stream: true`.
    *   Pass user/selection data as context/input to `run()`.
    *   Process streamed events, including structured data from the parallel tool execution.
    *   Await `stream.completed`.
6.  **Frontend Integration:**
    *   Update the frontend to send necessary data to the backend endpoint.
    *   Modify the `useAIStreaming` hook or related logic to handle and display the streamed structured oil recommendations in real-time.