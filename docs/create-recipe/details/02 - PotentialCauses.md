## Step 01: PotentialCauses

### Request Body:

--data '{
  "request_id": "'"${REQUEST_ID}"'",
  "step": "PotentialCauses",
  "health_concern": "dermatite atopica",
  "user_profile": {
    "gender": "male",
    "age_value": 8,
    "age_unit": "years", // babies are 'months'
    "age_category": "child",
    "language": "PT_BR"
  },
  "session_context": {
    "session_id": "'"${SESSION_ID}"'",
    "previous_selections": {}
  },
  "options": {
    "possible_option": {possible_option}
  }
}'
```

### Prompt:

**Potential Causes: Wellness Assessment Tool**

**Persona:** Act as an experienced wellness and holistic health advisor with evidence-based knowledge, skilled at correlating common health complaints with potential underlying causes based on individual profiles and lifestyle factors.

**Objective:** Analyze the provided `health_problem` and `userInfo` to generate a personalized list of the most likely potential causes or contributing factors. This list is intended to be presented to the user for reflection, helping them identify factors relevant to their situation, while avoiding medical diagnosis.

**Input Data:**

1. `health_problem`: The primary health complaint, symptom, or goal.
   * Value: `{{ health_concern }}`

2. `userInfo`: A JSON object containing crucial details about the end-user. **This profile is the primary driver for personalization.**
   * Value: `{{ user_profile) }}`

3. `user_language`: The target language for user-facing text in the output.
   * Value: `{{ user_profile.language }}`

**Guidelines:**

1. **User-Centric Analysis:** Deeply analyze the `health_problem` specifically *through the lens* of the `userInfo`. Ask: "What typically causes or contributes to [health_problem] in someone with this specific age, gender, life stage, and known conditions?"

2. **Evidence-Based Approach:** Prioritize well-established connections between causes and health issues that are supported by current scientific understanding. Avoid speculation on rare or unverified causes.

3. **Holistic Factor Consideration:** Brainstorm potential causes across various domains, including (but not limited to):
   * **Lifestyle:** Stress levels (work, family, financial), sleep patterns/hygiene, diet, physical activity (or lack thereof), substance use, screen time habits.
   * **Emotional/Mental:** Anxiety, worry, low mood, mental fatigue, significant life events, mindset.
   * **Physical:** Muscle tension, posture, underlying physical discomforts (even if not the primary complaint), fatigue.
   * **Environmental:** Noise, light, air quality, work/home environment setup, seasonal changes.

4. **Prioritize Personalization:** **Crucially, avoid generic lists.** Tailor the suggestions based on strong inferences from the `userInfo`. For example:
   * Work stress is more plausible for a middle-aged adult than academic pressure
   * Arthritis-related factors are more relevant for an older adult than post-workout soreness (unless indicated)
   * Consider cultural and regional factors when applicable

5. **Confidence Ranking:** Sort potential causes by likelihood based on the available information, placing the most probable causes first.

6. **Input Validation:** If critical information is missing from `userInfo` that would significantly impact analysis:
   * Note this limitation in a special `notes` field in the output
   * Proceed with available information, prioritizing factors that remain valid despite missing data

7. **Medical Boundaries:** 
   * Frame suggestions as possibilities to explore, not diagnoses

9. **Focused Output:** Generate a concise list of **5 to 8** of the *most plausible* potential causes to avoid overwhelming the user. Prioritize the causes most strongly suggested by the user's profile and the nature of the health problem.

10. **Clarity:** Use clear, accessible language for all user-facing text, avoiding technical jargon when possible.


**Output Format:**

Provide the result strictly in the following JSON format. **JSON key names must be in English.** The values for `cause_name`, `cause_suggestion`, `explanation`, and any advisory notes must be in the language specified by `{ user_profile.language }`.

json schema
{
  "name": "potential_causes_response",
  "schema": {
    "type": "object",
    "properties": {
      "meta": {
        "type": "object",
        "properties": {
          "step_name": {
            "type": "string",
            "description": "The name of the step."
          },
          "request_id": {
            "type": "string",
            "description": "Unique identifier for the request."
          },
          "timestamp_utc": {
            "type": "string",
            "description": "Timestamp of the response in UTC."
          },
          "version": {
            "type": "string",
            "description": "Version of the API."
          },
          "user_language": {
            "type": "string",
            "description": "Language preference of the user."
          },
          "status": {
            "type": "string",
            "description": "Status of the response."
          },
          "message": {
            "type": "string",
            "description": "Descriptive message about the response."
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
          "potential_causes": {
            "type": "array",
            "description": "List of potential causes.",
            "items": {
              "type": "object",
              "properties": {
                "cause_id": {
                  "type": "string",
                  "description": "Unique identifier for the potential cause."
                },
                "name_localized": {
                  "type": "string",
                  "description": "Localized name of the cause."
                },
                "suggestion_localized": {
                  "type": "string",
                  "description": "Localized suggestion related to the cause."
                },
                "explanation_localized": {
                  "type": "string",
                  "description": "Localized explanation of the cause."
                }
              },
              "required": [
                "cause_id",
                "name_localized",
                "suggestion_localized",
                "explanation_localized"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "potential_causes"
        ],
        "additionalProperties": false
      },
      "echo": {
        "type": "object",
        "properties": {
          "health_concern_input": {
            "type": "string",
            "description": "User input regarding health concern."
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
                "description": "Category of the user's age."
              },
              "age_specific": {
                "type": "string",
                "description": "Specific age of the user."
              },
              "age_unit": {
                "type": "string",
                "description": "Unit of age, e.g., years, months."
              }
            },
            "required": [
              "gender",
              "age_category",
              "age_specific",
              "age_unit"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "health_concern_input",
          "user_info_input"
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
```

### Response Payload:

```json
{
  "meta": {
    "step_name": "PotentialCauses",
    "request_id": "e4f5c2a1-3b9d-4e8f-8c7a-6d5b4e3f2a10",
    "timestamp_utc": "2024-05-21T10:00:00Z",
    "version": "api_v1.0_step_v1.1",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully retrieved potential causes."
  },
  "data": {
    "potential_causes": [
      {
        "cause_id": "c72a3f5b-12a0-4f51-9a99-9a1b3e7d0b48",
        "name_localized": "Dermatite atópica",
        "suggestion_localized": "Possivelmente relacionada a uma condição genética de pele que causa irritação e inflamação.",
        "explanation_localized": "A dermatite atópica é comum em crianças e pode ser agravada por fatores ambientais, além de predisposição genética."
      },
      {
        "cause_id": "f83b1e09-6c4d-4a7f-ba89-4e5c6d7a8b32",
        "name_localized": "Alergias ambientais",
        "suggestion_localized": "Reações a poeira, ácaros, pelos de animais ou outros alérgenos presentes no ambiente de casa ou escola.",
        "explanation_localized": "Ambientes com alta exposição a alérgenos são fatores conhecidos que podem desencadear ou agravar a dermatite atópica em crianças."
      }
      // ... 5-8 causes total
    ]
  },
  "echo": {
    "health_concern_input": "dermatite atopica",
    "user_info_input": {
        "gender": "male",
        "age_category": "child",
        "age_specific": "8",
		    "age_unit": "years" // ... babies are from 0-23 months
    }
  }
}
```

**Frontend Display Considerations (Mobile-First Focused):**

**Layout & UX:**
*   **Overall Screen Structure (Mobile):**
    *   **Header:** Prominent step title (e.g., "Possible Causes of [User's Health Concern]"). A visual progress bar/stepper (e.g., "Step 1 of X") to manage user expectations.
    *   **Context Confirmation (`echo` data):** Display the `echo.health_concern_input` clearly (e.g., "For: Dermatitis Atópica"). User profile info (`echo.user_info_input`) could be in a small, collapsed "Reviewing for: Child, 8 years" section, expandable if details are needed.
    *   **Instructional Text:** Clear, concise, and friendly guidance directly above the list (e.g., "Please select the causes you feel are most relevant to your situation. Choose up to X options."). Reference `options.possible_option` if applicable for max selections.
    *   **List of Causes:** A vertically stacked list of `potential_causes`. Each cause presented as a distinct, easily tappable card.
    *   **Footer/CTA:** A clearly visible "Next" or "Continue" button, potentially sticky at the bottom of the viewport for easy access without scrolling.
*   **Cause Card Design (Mobile):**
    *   **Generous Tappable Area:** The entire card should be tappable to select/deselect the cause, maximizing ease of use on touchscreens.
    *   **Visual Hierarchy:**
        *   `name_localized`: Bold, primary text, acting as the card title.
        *   `suggestion_localized`: Secondary text, slightly smaller, directly below the name, providing a brief overview.
        *   Selection Indicator: A checkbox (styled for touch) or a prominent visual change on the card (e.g., border color, background tint, persistent checkmark icon on one side) to clearly indicate selection.
    *   **Progressive Disclosure for `explanation_localized`:**
        *   A "Learn More", "Details", or info icon (`ⓘ`) button/link within the card, positioned consistently (e.g., bottom right).
        *   Tapping this reveals the `explanation_localized` in an expandable section directly within the card or in a modal/bottom sheet for very long explanations.

**Text Considerations:**
*   **Readability:**
    *   Use legible font sizes appropriate for mobile (e.g., 16px base for body text).
    *   Sufficient line height (e.g., 1.5) for `suggestion_localized` and `explanation_localized`.
*   **Conciseness:**
    *   `name_localized`: Should be scannable. If naturally long, ensure it wraps clearly over 1-2 lines.
    *   `suggestion_localized`: Aim for 1-3 lines to keep cards compact.
*   **`explanation_localized` Density:** When revealed, ensure it's formatted for easy reading: shorter paragraphs, bullet points if applicable. Avoid large walls of text.
*   **Language:** All text comes from `_localized` fields, honouring `meta.user_language`.

**Interactions:**
*   **Selection:**
    *   Tap on card or checkbox to select/deselect.
    *   Immediate visual feedback on state change.
    *   Support multiple selections. Consider providing a counter if there's a maximum (e.g., "2 of 3 selected").
*   **"Learn More" Expansion:**
    *   Smooth animation for expand/collapse of `explanation_localized` to maintain context.
    *   The "Learn More" toggle should also provide visual feedback (e.g., icon change from `+` to `-` or `chevron-down` to `chevron-up`).
*   **CTA Button:**
    *   Enabled only when minimum selection criteria are met (e.g., at least one cause selected). Visually disabled (e.g., greyed out) otherwise.
    *   Clear label (e.g., "Confirm Causes", "Next: Symptoms").

**Performance & Responsiveness:**
*   **List Rendering:** For 5-8 items, direct rendering is efficient. No complex virtualization needed.
*   **Image/Icon Usage:** If icons are used (e.g., for "Learn More"), use lightweight SVGs.
*   **Tablet/Desktop Adaptation:**
    *   Cards can reflow into a 2 or 3-column grid if screen width allows, but ensure cards maintain sufficient width for readability and tap/click targets remain large.
    *   Text content within cards should have a max-width to prevent overly long lines.
    *   The "Learn More" content could potentially open in a sidebar or larger modal on desktop for easier reading of extensive explanations.

**Accessibility (A11y):**
*   **Touch Targets:** Ensure cards and interactive elements (checkbox, "Learn More" button) meet minimum size requirements (e.g., 44x44 CSS pixels).
*   **ARIA Attributes:**
    *   If cards are custom checkboxes: `role="checkbox"` on the card, `aria-checked` for state, `aria-labelledby` pointing to `name_localized` and `aria-describedby` for `suggestion_localized`.
    *   The list of cards should be within a `role="group"` with an `aria-labelledby` referring to the instructional text.
    *   For expandable explanations: `aria-expanded` on the toggle, `aria-controls` linking to the explanation content ID.
*   **Keyboard Navigation:**
    *   Causes should be navigable using Tab.
    *   Spacebar or Enter to toggle selection.
    *   Enter on "Learn More" to expand/collapse.
*   **Screen Reader:**
    *   Announce `name_localized`, `suggestion_localized`.
    *   Clearly state "selected" or "not selected".
    *   Announce "expandable button" for "Learn More" and the state (expanded/collapsed).
    *   Instructional text should be read out before the list.
*   **Color Contrast:** Ensure sufficient contrast between text, background, and interactive state indicators.
