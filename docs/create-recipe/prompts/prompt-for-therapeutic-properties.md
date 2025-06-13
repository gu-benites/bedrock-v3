## Step 03: MedicalProperties

### Request Body:

```json
{
  "health_concern": "herpes labial",
  "gender": "female",
  "age_category": "adult",
  "age_specific": "47",
  "selected_causes": [
    {
      cause fields
    },
    {
      cause fields
    },
    {
      cause fields
    }
  ],
  "selected_symptoms": [
    {
      symptom fields
    },
    {
      symptom fields
    },
    {
      symptom fields
    }
  ],
  "step": "MedicalProperties",
  "user_language": "PT_BR"
}
```

### Prompt:

**Identify Required Therapeutic Properties**

**Persona:** Act as an expert researcher specializing in **holistic therapeutic properties** (covering medical, physical, mental, and emotional aspects), with a deep understanding of how these properties address specific health concerns, symptoms, and their underlying causes. Emphasize the **interconnectedness** of mind and body.

**Objective:** Based on the provided input data, identify and prioritize key therapeutic properties needed for an effective and holistic essential oil blend. The focus is on identifying the *actions* required, not specific oils yet. **Crucially, the output must explicitly link each selected property back to the specific causes and symptoms it primarily targets from the user's input.**

**Input Data:**

1.  `health_concern`: The primary health complaint.
    *   Value: `{{ $('Edit Fields').item.json.user.health_concern }}`
2.  `userInfo`: JSON object with user details for context.
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.userInfo, null, 2) }}
        ```
3.  `selected_causes`: Array of cause objects the user deemed relevant.
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.user.selected_causes, null, 2) }}
        ```
4.  `selected_symptoms`: Array of symptom objects the user identified as most relevant. **This is a primary driver for selecting properties.**
    *   Value: 
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.user.selected_symptoms, null, 2) }}
        ```
5.  `user_language`: The target language for user-facing text.
    *   Value: `{{ $('Edit Fields').item.json.userInfo.user_language }}`

**Steps:**

1.  **Symptom-Driven Analysis:**
    *   Examine the `selected_symptoms`. Determine the core therapeutic actions (properties) required to alleviate them, considering physical, mental, and emotional dimensions. **Note which property addresses which specific `symptom_name`(s).**
2.  **Cause Consideration:**
    *   Analyze the `selected_causes`. Identify properties addressing these underlying factors from a holistic perspective. **Note which property addresses which specific `cause_name`(s).**
3.  **Holistic Integration & Prioritization:**
    *   Synthesize properties from symptoms and causes. Prioritize those offering the most direct or comprehensive support for the primary `health_concern` and the *most impactful* `selected_symptoms` and `selected_causes`. Assign a relevancy score (1-5, 5 being highest). **Ensure the links noted in steps 1 & 2 are accurate.**
4.  **Refinement & Scope:**
    *   Consolidate the list. Select **5 to 8** key therapeutic properties providing a well-rounded and diverse approach (covering different needed actions).
5.  **Property Focus:**
    *   Ensure the output contains *only* therapeutic property names, descriptions, and the link fields. **Do not list essential oils or chemical constituents.** Use the examples below for inspiration.

**Important Clarification:**

*   Each therapeutic property must be listed individually, even if they are related or complementary. For example, instead of combining "Propriedades nutritivas e fortalecedoras" into one entry, list "Propriedades nutritivas" and "Propriedades fortalecedoras" as separate properties, each with their own description, causes addressed, symptoms addressed, and relevancy score.
*   Avoid aggregating multiple properties into a single entry. Each entry in the output list should represent a single, distinct therapeutic property.

**Example Therapeutic Properties (Non-Exhaustive List for Inspiration):**
*   *Medical/Physical:* Analgesic, Anti-inflammatory, Antispasmodic, Relaxante Muscular, Decongestant, Expectorant, Antiemetic, Cicatrizant, Antiviral, Antibacterial, Antifungal, Antioxidant, Hypotensive, Antipyretic, Diuretic, Vasodilator, Vasoconstrictor, Rubefacient.
*   *Emotional/Mental/Energetic:* Calmante (Calming), Sedative (Leve/Moderate), Ansiolítico (Anxiolytic), Antidepressant/Uplifting, Nervino Relaxante (Nervine Relaxant), Adaptogênico (Adaptogen), Equilibrante do Humor (Mood Balancing), Revigorante (Energizing), Estimulante Mental (Cognitive Enhancer), Grounding, Comforting, Neuroprotetor.
    *   *Think broadly about the actions needed based on the inputs.*

**Output Format:**

Provide the result strictly in the following JSON format. **JSON key names must be in English.** The values for `property_name`, `description`, `causes_addressed`, and `symptoms_addressed` must be in the language specified by `user_language` (except for the lists in `causes_addressed` and `symptoms_addressed` which should contain the exact `cause_name` and `symptom_name` strings from the input, potentially translated if the input names were already translated). Order the list by `relevancy` score (highest first). **Include a unique `property_id` for each property, generated as a standard random UUID string.**

```json

json schema provided

**Notes:**

- Focus strictly on therapeutic properties; do not list specific essential oils.
- Ensure the selected properties reflect the interconnectedness of mind and body relevant to the user's inputs.
- Tailor the description for each property to explicitly connect it to the user's specific situation.
- Accurately populate causes_addressed and symptoms_addressed using the exact cause_name and symptom_name strings from the input that each property primarily targets. If a property addresses multiple, list them separated by a comma and space. - Leave the string empty if a property doesn't directly target a specific listed cause or symptom (e.g., a general systemic property).
- Adhere strictly to the Important Clarification regarding listing each property individually.
- Crucially, ensure each property object in the therapeutic_properties array includes a property_id field containing a newly generated, unique, standard random UUID string (like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). A new UUID should be generated for each property every time this prompt is executed.
```

### Response Payload:

```
{
  "meta": {
    "step_name": "IdentifyTherapeuticProperties",
    "request_id": "b2c3d4e5-f6a7-8901-2345-678901bcdef0",
    "timestamp_utc": "2024-05-21T10:10:00Z",
    "version": "api_v1.0_step_v1.2",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully identified therapeutic properties."
  },
  "data": {
    "therapeutic_properties": [
      {
        "property_id": "4a02aec1-863f-49f8-b00a-816764f14d2d",
        "property_name_localized": "Antiviral",
        "property_name_english": "Antiviral",
        "description_contextual_localized": "Esta propriedade ajuda a combater infecções virais como o herpes simples, abordando diretamente o problema do herpes labial que o usuário está enfrentando.",
        "addresses_cause_ids": [],
        "addresses_symptom_ids": ["symptom_id_for_lesoes", "symptom_id_for_coceira"],
        "relevancy_score": 5 // (1-5, 5 highest)
      },
      {
        "property_id": "45720011-a551-46e9-b4c6-e8a40cbbc307",
        "property_name_localized": "Calmante",
        "property_name_english": "Calming",
        "description_contextual_localized": "Ajuda a reduzir os níveis de estresse e ansiedade que podem desencadear surtos de herpes labial, permitindo que o usuário encontre alívio emocional e mental.",
        "addresses_cause_ids": ["cause_id_for_estresse", "cause_id_for_emocional_negativo"],
        "addresses_symptom_ids": ["symptom_id_for_irritabilidade"],
        "relevancy_score": 5
      }
      // ... 5-8 properties total, ordered by relevancy_score descending
    ]
  },
  "echo": {
    "health_concern_input": "dermatite atopica",
    "user_info_input": {
        "gender": "male",
        "age_category": "child",
        "age_specific": "8",
		    "age_unit": "years" // ... babies are from 0-23 months
    },
    "selected_cause_ids": ["cause_id_for_estresse", "cause_id_for_emocional_negativo"],
    "selected_symptom_ids": ["symptom_id_for_lesoes", "symptom_id_for_coceira", "symptom_id_for_irritabilidade"]
  }
}
```

Schema:
{
  "name": "therapeutic_properties_response",
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
          "therapeutic_properties": {
            "type": "array",
            "description": "List of therapeutic properties identified for the health concern.",
            "items": {
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
                "description_contextual_localized": {
                  "type": "string",
                  "description": "Localized contextual description of how this property helps."
                },
                "addresses_cause_ids": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "description": "IDs of causes this property addresses."
                  }
                },
                "addresses_symptom_ids": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "description": "IDs of symptoms this property addresses."
                  }
                },
                "relevancy_score": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 5,
                  "description": "Relevancy score (1-5, 5 being highest)."
                }
              },
              "required": [
                "property_id",
                "property_name_localized",
                "property_name_english",
                "description_contextual_localized",
                "addresses_cause_ids",
                "addresses_symptom_ids",
                "relevancy_score"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "therapeutic_properties"
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
          }
        },
        "required": [
          "health_concern_input",
          "user_info_input",
          "selected_cause_ids",
          "selected_symptom_ids"
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
  },
  "strict": true
}