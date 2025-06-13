## Step 04: SuggestedOils

### Request Body:

```json
{
  "health_concern": "dor de cabeça",
  "gender": "female",
  "age_category": "teen",
  "age_specific": "16",
  "selected_causes": [
    {
      "id": "cause-alterações-hormonais",
      "cause_name": "Alterações hormonais",
      "cause_suggestion": "Mudanças hormonais típicas da puberdade podem aumentar a sensibilidade a dores de cabeça.",
      "explanation": "Na idade de 16 anos, flutuações hormonais são comuns e podem ser uma causa frequente de dores de cabeça em adolescentes do sexo feminino.",
      "name": "Alterações hormonais"
    },
    {
      "id": "cause-postura-inadequada",
      "cause_name": "Postura inadequada",
      "cause_suggestion": "Maus hábitos de postura ao estudar, usar celular ou assistir televisão, levando à tensão muscular.",
      "explanation": "Músculos tensos do pescoço e ombros devido à má postura podem favorecer dores de cabeça em jovens adolescentes.",
      "name": "Postura inadequada"
    }
  ],
  "selected_symptoms": [
    {
      "symptom_name": "Dores no pescoço e ombros"
    },
    {
      "symptom_name": "Sensibilidade à luz"
    },
    {
      "symptom_name": "Dor de cabeça tensionada"
    },
    {
      "symptom_name": "Dificuldade de concentração"
    }
  ],
  "therapeutic_properties": [
    {
      "property_id": "63b857de-7554-4d84-b81f-8bec911c86c9",
      "property_name": "Relaxante Muscular",
      "property_name_in_english": "Muscle Relaxant",
      "description": "Auxilia a aliviar a tensão muscular no pescoço e ombros que está ligada à postura inadequada, contribuindo para a diminuição da dor e promovendo relaxamento.",
      "causes_addressed": "Postura inadequada",
      "symptoms_addressed": "Dores no pescoço e ombros",
      "relevancy": 5
    }
  ],
  "step": "SuggestedOils",
  "user_language": "PT_BR"
}
```

### Prompt:

**Suggest Relevant Essential Oils (Safety Deferred)**

**Persona:** Act as an expert Aromatherapist and Essential Oil Specialist. Your primary focus is recommending essential oils that strongly possess a specific therapeutic property.

**Objective:** Given a specific `therapeutic_property` including its property_id) and relevant context (user info, health concern), identify and rank essential oils known to possess this property based purely on their **relevance and efficacy for that property**. Safety checks will be performed in a later, dedicated step.

**Input Data:**

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
1.  **Use function tool get_recommended_essential_oils to perform multiple relevant queries with (`therapeutic_property` AND/OR `health_concern`) for the following steps**
2.  **Target Property Identification:**
    *   Extract the `therapeutic_property` details, primarily using `property_name_in_english` AND/OR `health_concern` for searching multiple times with different queries.
    *   Crucially, note the property_id from the input therapeutic_property object.
3.  **Initial Oil Search:**
    *   Search the knowledge base for essential oils known to possess the specified `therapeutic_property`.
4.  **Relevancy Ranking & Selection:**
    *   Evaluate how strongly and effectively each identified oil exhibits the target `therapeutic_property` for addressing the `health_concern`, {{ $('Edit Fields').item.json.user.health_concern }}.
    *   Contextual Reasoning [Use Think Tool]: Now, use the [Your Thinking Tool Name Here] tool to perform complex reasoning and solidify your understanding.
    *   Rank the oils based *primarily* on the strength of each oil's efficacy in exhibiting the target `therapeutic_property` relevant to the `health_concern`
    *   Select the top **5 to 8** most relevant oils based on this ranking.
5.  **Output Generation:**
    *   Format the results in the specified JSON schema, nesting the recommended oils array within the therapeutic property object.
    *   Include the property_id received in the input therapeutic_property object at the top level of the output JSON. This ID must be exactly the same as the one received and must not be altered.
    *   Translate user-facing text fields into the target language specified by `user_language`.
    *   Ensure that the essential oil names (name_english, name_local_language) contain only the plant name and explicitly exclude the word "Oil" or its translation.

**Output Format:**

Provide the result strictly in the following JSON format. **JSON key names must be in English.** The main object represents the therapeutic property itself. The `suggested_oils` array is nested within this object. Values for user-facing text fields (`property_name`, `description`, `name_local_language`, `oil_description`) must be in the language specified by `user_language`. Order the `suggested_oils` array by `relevancy` score (highest first). **Do not include safety notes.**

```json
{
  "property_id": "The exact property_id received in the input therapeutic_property object",
  "property_name": "Nome da Propriedade Terapêutica no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}",
  "property_name_in_english": "English name of the property",
  "description": "Descrição da propriedade no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}",
  "suggested_oils": [ // Array nested inside the property object
    {
      "name_english": "Only English Name of the Essential Oil", // e.g., "English", "Spanish" **Do NOT include the word 'Oil'**
      "name_local_language": "Nome do Óleo Essencial no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}", // e.g., "Inglês", "Espanhol" **Do NOT include the word 'Oil'**
      "oil_description": "Explicação concisa de como este óleo fornece a 'therapeutic_property' alvo e por que é útil neste contexto, no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}.", // e.g., "Excelente para aliviar espasmos digestivos devido às suas fortes propriedades antiespasmódicas."
      "relevancy": integer // Classificação de 1 a 5 indicando quão fortemente este óleo possui a propriedade alvo (5 = muito relevante).
    }
    // Add more oil objects (targeting 5-8 total), ordered by relevancy, following the same format.
  ]
}

**Notes:**
- Safety Deferred: This prompt explicitly assumes safety checks are not performed here. The AI should focus solely on identifying oils known for the target property.
- Relevance is Key: The ranking (relevancy) reflects how well the oil matches the `therapeutic_property` for addressing the `health concern`, not overall suitability (which includes safety).
- Clarity: Descriptions should remain clear and concise.
- Language: Ensure user-facing text fields are in the specified user_language {{ $('Edit Fields').item.json.userInfo.user_language }}.
- Structure: Output remains nested, grouping suggested oils under the property they address.
- ID Preservation: The property_id in the output JSON must match the property_id received in the input therapeutic_property object exactly.
- When listing essential oil names (name_english, name_local_language), provide only the common plant name and omit the word "Oil" or its translation.

```
### Response Payload:

```json
[
  {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": {
        "property_id": "2e0faab8-0a38-49e5-95bc-9a8611117da0",
        "property_name": "Vasodilatador",
        "property_name_in_english": "Vasodilator",
        "description": "Promove a dilatação dos vasos sanguíneos, que pode ajudar a aliviar a pressão e a dor associadas a dores de cabeça.",
        "suggested_oils": [
          {
            "name_english": "Nardo",
            "name_local_language": "Nardo",
            "oil_description": "O óleo essencial de nardo é imunoestimulante, fortalecendo o sistema imunológico e auxiliando na vasodilatação, sendo útil para quem precisa regular a pressão arterial e melhorar a circulação, além de ser benéfico para micro varizes, hemorróidas, inchaços ou retenção de líquidos.",
            "relevancy": 5
          },
          {
            "name_english": "Hortelã",
            "name_local_language": "Hortelã",
            "oil_description": "O óleo essencial de hortelã ajuda na circulação sanguínea e pode atuar na vasodilatação, sendo útil na melhora da pressão arterial e circulação, além de oferecer efeito refrescante e analgésico.",
            "relevancy": 4
          },
          {
            "name_english": "Cipreste",
            "name_local_language": "Cipreste",
            "oil_description": "O óleo essencial de cipreste contribui para melhorar a circulação sanguínea e é conhecido por suas propriedades vasodilatadoras, sendo eficaz no tratamento de varizes, microvarizes e problemas circulatórios.",
            "relevancy": 4
          },
          {
            "name_english": "Lavanda",
            "name_local_language": "Lavanda",
            "oil_description": "A lavanda possui propriedades relaxantes que auxiliam na circulação e no equilíbrio da pressão arterial, além de promover sensação de relaxamento geral.",
            "relevancy": 3
          },
          {
            "name_english": "Gerânio",
            "name_local_language": "Gerânio",
            "oil_description": "O óleo de gerânio ajuda na circulação sanguínea e na tonificação vascular, contribuindo para a vasodilatação e o alívio de tensões vasculares.",
            "relevancy": 3
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
*Note: This step represents a "divergent" phase, showing a broad list of oils for a *specific property* before safety filtering. It might be an internal step or shown for transparency. If shown, managing user expectations is key.*

**Layout & UX:**
*   **Overall Screen Structure (Mobile):**
    *   **Header:** Step title, possibly dynamic (e.g., "Potential Oils for '[Property Name]'"). Progress indicator.
    *   **Context Display (`therapeutic_property_context`):** Prominently display the `property_name_localized` and `description_localized` of the property these oils are suggested for. This is crucial context.
    *   **Instructional Text:** Very clear messaging (e.g., "Here's a broad list of oils known for this action. These are *potential candidates* and will be filtered for safety and synergy in later steps. No selection is needed here.").
    *   **List of Suggested Oils:** Vertically stacked list of `suggested_oils`. Each oil as an informational card/item (non-selectable).
    *   **Footer/CTA:** "Next" or "Continue to Safety Analysis" button. If this view iterates per property, the CTA might be "View Oils for Next Property" or "All Properties Reviewed, Continue".
*   **Oil Card/Item Design (Mobile):**
    *   **Visual Hierarchy:**
        *   `name_localized`: Main title for the oil.
        *   `name_botanical`: Secondary, smaller text below or next to `name_localized` for clarity.
        *   `match_rationale_localized`: Key information explaining why this oil is listed for the current property.
    *   **`relevancy_to_property_score`:** Display subtly if deemed useful (e.g., "Match: 4/5").
    *   **Progressive Disclosure for `known_active_compounds_indicative`:** This is likely advanced info. If shown, use a "View Key Compounds" toggle revealing the list. Most users might not need this.

**Text Considerations:**
*   **Clarity:** Ensure `name_localized` and `name_botanical` are distinct. `match_rationale_localized` should be concise and focused on the oil-property link.
*   **Text Density:** Keep rationale brief. If `known_active_compounds_indicative` are listed, they should be in a simple, scannable list format when revealed.
*   Use `meta.user_language`.

**Interactions:**
*   **No Selection:** Items are not selectable.
*   **Optional Expansion for Compounds:** If `known_active_compounds_indicative` are displayed, use a clear toggle.
*   **CTA Button:** Always enabled. Its action depends on whether the system iterates through properties here or proceeds to the next phase.

**Performance & Responsiveness:**
*   **List Rendering:** 5-8 oils per property is manageable. If this view ever aggregated oils for *all* properties before safety (unlikely based on schema), then virtualization/pagination would be needed.
*   **Tablet/Desktop Adaptation:** Single column for readability or a simple card grid. Max-width on text.

**Accessibility (A11y):**
*   **Structure:** Headings for property context and oil names. List structure for oils.
*   **ARIA Attributes:** `aria-expanded`/`aria-controls` if compounds list is expandable.
*   **Keyboard Navigation:** Standard content navigation.
*   **Screen Reader:** Announce property context first, then each oil's `name_localized`, `name_botanical`, and `match_rationale_localized`. Announce state of any expandable sections.
*   **Color Contrast:** Ensure all text is easily readable.