## Step: PotentialSymptoms

### Request Body:

```json
{
  "health_concern": "dermatite atopica",
  "gender": "male",
  "age_category": "child",
  "age_specific": "8",
  "selected_causes": [
    {
      "cause_id": "c72a3f5b-12a0-4f51-9a99-9a1b3e7d0b48",   	
      "name_localized": "Hábito de coçar",
      "suggestion_localized": "Rascado frequente que irrita ainda mais a pele e mantém o ciclo de inflamação.",
      "explanation_localized": "Crianças podem coçar inconscientemente, o que perpetua a inflamação e agravamento da dermatite."
    },
    {
      "cause_id": "c72a3f5b-12a0-4f51-9a99-9a1b3e7d0b48",   	
      "name_localized": "Hábito de coçar",
      "suggestion_localized": "Rascado frequente que irrita ainda mais a pele e mantém o ciclo de inflamação.",
      "explanation_localized": "Crianças podem coçar inconscientemente, o que perpetua a inflamação e agravamento da dermatite."
    },
...

  ],
  "step": "PotentialSymptoms",
  "user_language": "PT_BR"
}
```

### Prompt:
**Identify Potential Symptoms**

**Persona:** Act as a knowledgeable health assistant or symptom correlator, capable of identifying typical symptoms associated with a specific health concern, especially when linked to particular underlying causes or contributing factors.

**Objective:** Analyze the user's primary `health_concern` and the `selected_causes` they identified as relevant, to generate a list of potential symptoms commonly experienced in this context. This list helps the user further refine their understanding of their situation and prepares for selecting targeted therapeutic properties later.

**Input Data:**

1.  `health_concern`: The primary health complaint provided by the user.
    *   Value: `{{ $('Edit Fields').item.json.user.health_concern }}`
2.  `userInfo`: A JSON object containing details about the end-user (for context).
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.userInfo, null, 2) }}
        ```
3.  `selected_causes`: An array of cause objects that the user indicated as relevant in the previous step. **This is a key input for tailoring the symptom list.**
    *   Value:
        ```json
        {{ JSON.stringify($('Edit Fields').item.json.body.selected_causes, null, 2) }}
        ```
4.  `user_language`: The target language for user-facing text in the output.
    *   Value: `{{ $('Edit Fields').item.json.userInfo.user_language }}`

**Processing Steps:**

1.  **Input Evaluation:**
    *   Thoroughly understand the user's primary `health_concern`.
    *   Carefully review each item in the `selected_causes` array. The link between the concern and these specific causes is paramount for generating relevant symptoms.
    *   Note the `userInfo` for contextual nuances (age, gender, etc.), but prioritize the concern-cause relationship.

2.  **Symptom Identification:**
    *   Identify and describe common characteristics or variations of the `health_concern` itself (Primary Symptoms).
    *   Expand to include other physical sensations commonly accompanying the main concern *due to the selected causes* (Secondary Physical Symptoms - e.g., muscle tension from stress).
    *   Include relevant emotional or cognitive symptoms often linked to the concern and causes (Associated Non-Physical Symptoms - e.g., irritability from pain/stress).
    *   **Crucially, prioritize symptoms that strongly correlate with the `selected_causes`.**

3.  **Output Construction:**
    *   Generate a list of **5 to 10** relevant potential symptoms.
    *   Frame descriptions using clear, accessible language.
    *   Ensure phrasing suggests potentiality or common association, not definitive diagnosis.
    *   Craft a concise `explanation` for each symptom, explicitly linking it back to the `health_concern` and the `selected_causes`.

**Output Format:**

json schema provided

**Notes**

- Focus on listing potential and commonly associated symptoms; this is not a diagnostic tool.
- Ensure all user-facing text is accurately translated according to the user_language input.
- Handle user data (userInfo) with sensitivity and prioritize the direct link between the health concern and selected causes.

### Response Payload:


```
{
  "meta": {
    "step_name": "PotentialSymptoms",
    "request_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "timestamp_utc": "2024-05-21T10:05:00Z",
    "version": "api_v1.0_step_v1.1",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully retrieved potential symptoms."
  },
  "data": {
    "potential_symptoms": [
      {
        "symptom_id": "s10d9f8c-7b6a-4e3f-b2a1-9c8d7e6f5a4b",
        "name_localized": "Coceira intensa",
        "suggestion_localized": "Pele vermelha, seca e extremamente pruriginosa, que causa sensação de vontade de coçar incessantemente.",
        "explanation_localized": "A coceira forte é comum em casos de dermatite atópica, especialmente quando há fatores alérgicos ou irritantes em suas causas selecionadas, levando ao desconforto constante."
      },
      {
        "symptom_id": "s21e0a7d-8c5b-4f2e-a190-8b7c6d5e4f3a",
        "name_localized": "Vermelhidão na pele",
        "suggestion_localized": "Zona avermelhada, inflamada, frequentemente visível na área afetada pela dermatite.",
        "explanation_localized": "A vermelhidão é uma resposta inflamatória típica da dermatite atópica, especialmente desencadeada por sensibilizações ou fatores ambientais presentes nas causas identificadas."
      }
      // ... 5-10 symptoms total
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
    "selected_cause_ids": ["cause_id_for_estresse", "cause_id_for_emocional_negativo"]
  }
}
```

Schema:
{
  "name": "potential_symptoms_response",
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
          "potential_symptoms": {
            "type": "array",
            "description": "List of potential symptoms related to the health concern.",
            "items": {
              "type": "object",
              "properties": {
                "symptom_id": {
                  "type": "string",
                  "description": "Unique identifier for the symptom."
                },
                "name_localized": {
                  "type": "string",
                  "description": "Localized name of the symptom."
                },
                "suggestion_localized": {
                  "type": "string",
                  "description": "Localized suggestion regarding the symptom."
                },
                "explanation_localized": {
                  "type": "string",
                  "description": "Localized explanation of the symptom."
                }
              },
              "required": [
                "symptom_id",
                "name_localized",
                "suggestion_localized",
                "explanation_localized"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "potential_symptoms"
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
            "description": "List of selected cause IDs related to the health concern.",
            "items": {
              "type": "string",
              "description": "Unique identifier for each selected cause."
            }
          }
        },
        "required": [
          "health_concern_input",
          "user_info_input",
          "selected_cause_ids"
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