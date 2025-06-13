## Step 02: PotentialSymptoms

### Request Body:

```json
{
  "health_concern": "dermatite atopica",
  "gender": "male",
  "age_category": "child",
  "age_specific": "8",
  "selected_causes": [
    {
      "cause_name": "Hábito de coçar",
      "cause_suggestion": "Rascado frequente que irrita ainda mais a pele e mantém o ciclo de inflamação.",
      "explanation": "Crianças podem coçar inconscientemente, o que perpetua a inflamação e agravamento da dermatite."
    },
    {
      "cause_name": "Fatores de pele seca",
      "cause_suggestion": "Falta de hidratação adequada da pele ou uso de sabonetes agressivos que removem a camada protetora da pele.",
      "explanation": "A pele seca aumenta a vulnerabilidade à irritação e infecção, contribuindo para crises de dermatite atópica, especialmente em crianças."
    },
    {
      "cause_name": "Dermatite atópica",
      "cause_suggestion": "Possivelmente relacionada a uma condição genética de pele que causa irritação e inflamação.",
      "explanation": "A dermatite atópica é comum em crianças e pode ser agravada por fatores ambientais, além de predisposição genética."
    }
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


**Notes**

- Focus on listing potential and commonly associated symptoms; this is not a diagnostic tool.
- Ensure all user-facing text (symptom_name, symptom_suggestion, explanation) is accurately translated according to the user_language input.
- Handle user data (userInfo) with sensitivity and prioritize the direct link between the health concern and selected causes.

### Response Payload:

```json
[
  {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": {
        "potential_symptoms": [
          {
            "symptom_name": "Coceira intensa",
            "symptom_suggestion": "Pele vermelha, seca e extremamente pruriginosa, que causa sensação de vontade de coçar incessantemente.",
            "explanation": "A coceira forte é comum em casos de dermatite atópica, especialmente quando há fatores alérgicos ou irritantes em suas causas selecionadas, levando ao desconforto constante."
          },
          {
            "symptom_name": "Vermelhidão na pele",
            "symptom_suggestion": "Zona avermelhada, inflamada, frequentemente visível na área afetada pela dermatite.",
            "explanation": "A vermelhidão é uma resposta inflamatória típica da dermatite atópica, especialmente desencadeada por sensibilizações ou fatores ambientais presentes nas causas identificadas."
          },
          {
            "symptom_name": "Ressecamento da pele",
            "symptom_suggestion": "A pele fica ressecada, áspera e escamosa, frequentemente possuindo rachaduras leves.",
            "explanation": "A pele seca reforça o estado de inflamação e é comum em dermatite atópica, especialmente em ambientes secos ou após exposição a fatores desencadeantes indicados pelas causas selecionadas."
          },
          {
            "symptom_name": "Inchaço ou edema",
            "symptom_suggestion": "Áreas afetadas podem apresentar leve inchaço devido à inflamação e reação alérgica.",
            "explanation": "O edema surge como resposta do corpo à inflamação na pele, comum em reações alérgicas ou irritativas vinculadas às causas identificadas."
          },
          {
            "symptom_name": "Irritação e sensação de queimação",
            "symptom_suggestion": "Sensação de queimação ou ardência na pele afetada, às vezes acompanhada de desconforto generalizado.",
            "explanation": "A irritação e queimação derivam da inflamação e sensibilização da pele, frequentemente presentes na dermatite atópica associada às causas alérgicas ou ambientais."
          },
          {
            "symptom_name": "Mudanças de humor ou irritabilidade",
            "symptom_suggestion": "O desconforto contínuo pode afetar o humor, levando a irritabilidade ou frustração.",
            "explanation": "O desconforto físico causado pela coceira e inflamação pode influenciar o bem-estar emocional, especialmente em crianças com dermatite atópica que percebem o desconforto constante."
          },
          {
            "symptom_name": "Dificuldade para dormir",
            "symptom_suggestion": "Interrupções no sono devido à coceira intensa ou desconforto na pele durante a noite.",
            "explanation": "A coceira e o desconforto podem dificultar o sono adequado, o que ocorre frequentemente na dermatite atópica agravada por fatores desencadeantes como alérgenos e irritantes."
          },
          {
            "symptom_name": "Lesões de arranhadura",
            "symptom_suggestion": "Áreas da pele podem apresentar arranhões, escoriações ou feridas abertas por causa da coceira insistente.",
            "explanation": "O ato de coçar prolongado pode levar à formação de feridas e lesões na pele, agravando o quadro inflamatório na dermatite atópica, especialmente com fatores irritantes or alérgicos presentes nas causas selecionadas."
          }
        ]
      },
      "refusal": null,
      "annotations": []
    },
    "logprobs": null,
    "finish_reason": "stop"
  }
]
```

**Frontend Display Considerations (Mobile-First Focused):**

**Layout & UX:**
*   **Overall Screen Structure (Mobile):**
    *   **Header:** Step title (e.g., "Your Symptoms"). Progress indicator (e.g., "Step 2 of X").
    *   **Context Confirmation (`echo` data):** Display `echo.health_concern_input`. Optionally, briefly summarize selected causes (e.g., "Related to: [Selected Cause 1 Name], ...").
    *   **Instructional Text:** Clear guidance (e.g., "Please select the symptoms you are experiencing.").
    *   **List of Symptoms:** Vertically stacked list of `potential_symptoms`, each as a selectable card.
    *   **Footer/CTA:** "Next" or "Continue" button, sticky if list is long.
*   **Symptom Card Design (Mobile):**
    *   **Tappable Area:** Entire card tappable for selection.
    *   **Visual Hierarchy:**
        *   `name_localized`: Bold, primary text (card title).
        *   `suggestion_localized`: Secondary text below the name.
        *   Selection Indicator: Checkbox or visual change on card (border, background, icon).
    *   **Progressive Disclosure for `explanation_localized`:** "Learn More" / "Details" toggle to reveal `explanation_localized` within the card or a modal.

**Text Considerations:**
*   **Readability:** Legible mobile-friendly fonts and line height.
*   **Conciseness:** `name_localized` and `suggestion_localized` should be brief for scannability on small screens.
*   **`explanation_localized`:** Revealed on demand, formatted for easy reading.
*   Respect `meta.user_language`.

**Interactions:**
*   **Selection:** Tap card/checkbox for multi-select. Immediate visual feedback.
*   **"Learn More" Expansion:** Smooth expand/collapse for `explanation_localized`. Clear toggle state.
*   **CTA Button:** Enabled after at least one symptom is selected. Clear label.

**Performance & Responsiveness:**
*   **List Rendering:** For 5-10 items, direct rendering is fine.
*   **Tablet/Desktop Adaptation:** Cards can flow into columns. Maintain readability and large interaction targets. Max-width for text.

**Accessibility (A11y):**
*   **Touch Targets:** Cards and "Learn More" toggles meet size requirements.
*   **ARIA Attributes:** `role="checkbox"`, `aria-checked` for selectable cards. `role="group"` for the list. `aria-expanded`, `aria-controls` for explanations.
*   **Keyboard Navigation:** Tab to navigate items, Space/Enter to select/toggle.
*   **Screen Reader:** Announce `name_localized`, `suggestion_localized`, selection state, and "Learn More" state. Instructional text first.
*   **Color Contrast:** Adhere to WCAG AA standards.
