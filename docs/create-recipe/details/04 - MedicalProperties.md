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
      "cause_name": "Estresse e ansiedade",
      "cause_suggestion": "Níveis elevados de estresse ou ansiedade devido a responsabilidades pessoais ou profissionais.",
      "explanation": "O estresse emocional pode enfraquecer o sistema imunológico, facilitando o aparecimento de herpes labial, especialmente em adultos que enfrentam múltiplas demandas diárias."
    },
    {
      "cause_name": "Falta de descanso adequado",
      "cause_suggestion": "Sono de má qualidade ou insuficiente, comum em adultos com rotinas agitadas.",
      "explanation": "O sono inadequado compromete a resistência imunológica, aumentando a vulnerabilidade a infecções herpes simplex, que causa herpes labial."
    },
    {
      "cause_name": "Dieta pobre em nutriente",
      "cause_suggestion": "Alimentação desequilibrada com baixa ingestão de vitaminas essenciais, como vitaminas do complexo B, C e zinco.",
      "explanation": "Deficiências nutricionais podem reduzir a defesa imunológica do organismo, favorecendo a reativação do vírus herpes simples."
    },
    {
      "cause_name": "Alterações hormonais",
      "cause_suggestion": "Mudanças hormonais relacionadas à idade, como menopausa ou ciclos menstruais irregulares.",
      "explanation": "Oscilações hormonais em mulheres na faixa de 47 anos podem influenciar o funcionamento do sistema imunológico e possivelmente desencadear episódios de herpes labial."
    },
    {
      "cause_name": "Estilo de vida sedentário",
      "cause_suggestion": "Baixo nível de atividade física regular, que pode comprometer a saúde geral e imunidade.",
      "explanation": "A falta de exercícios físicos pode diminuir a resposta imune, facilitando a reativação de infecções virais como o herpes simplex."
    },
    {
      "cause_name": "Fatores emocionais negativos",
      "cause_suggestion": "Períodos de preocupação, cansaço mental ou emocional intenso.",
      "explanation": "Situações de estresse emocional podem enfraquecer o sistema imunológico, promovendo a reativação do herpes labial."
    }
  ],
  "selected_symptoms": [
    {
      "symptom_name": "Lesões na pele",
      "symptom_suggestion": "Aparecimento de feridas ou bolhas na região da boca ou lábios.",
      "explanation": "Este sintoma é característico do herpes labial, especialmente quando o fator de estresse ou infecção contribuem para o aparecimento das lesões."
    },
    {
      "symptom_name": "Sensibilidade na área",
      "symptom_suggestion": "Aumento da sensibilidade ou dor na região dos lábios ou em volta, antes ou durante o surto.",
      "explanation": "A sensibilidade aumentada é comum na fase inicial de uma crise de herpes labial, especialmente em indivíduos suscetíveis ao estresse emocional ou físicos."
    },
    {
      "symptom_name": "Coceira ou queimação",
      "symptom_suggestion": "Sensação de coceira, queima ou formigamento nos lábios antes do aparecimento das feridas.",
      "explanation": "A coceira ou queimação costuma preceder as lesões típicas do herpes, sendo um sinal de ativação viral influenciada pelo estresse ou fadiga."
    },
    {
      "symptom_name": "Irritabilidade",
      "symptom_suggestion": "Sentimentos de irritabilidade ou mau humor.",
      "explanation": "Problemas emocionais, como irritabilidade, podem estar relacionados à infeção ou ao desconforto causado pelo herpes labial e seus fatores desencadeantes."
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
{
  "health_concern_in_english": "primary health complaint in or translated to EN-US",
  "therapeutic_properties": [
    {
      "property_id": "generate_a_standard_random_uuid_string_here", // A newly generated standard random UUID (e.g., "123e4567-e89b-12d3-a456-426614174000"). This ID MUST be unique for each property in this specific response.
      "property_name": "Nome da Propriedade Terapêutica no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}", // e.g., Analgésico, Relaxante Muscular, Calmante
      "property_name_in_english": "Property name in or translated to EN-US", // e.g., Analgesic, Muscle Relaxant, Calming
      "description": "Explicação concisa de como esta propriedade ajuda a abordar os 'selected_symptoms' e/ou 'selected_causes' **neste caso específico**, no idioma {{ $('Edit Fields').item.json.userInfo.user_language }}.", // Must link back to user's input.
      "causes_addressed": "Comma-separated string of `cause_name` values from the input `selected_causes` that this property primarily targets. Leave empty string if none.", // e.g., "Estresse no Trabalho"
      "symptoms_addressed": "Comma-separated string of `symptom_name` values from the input `selected_symptoms` that this property primarily targets. Leave empty string if none.", // e.g., "Dor Tensional, Tensão Muscular"
      "relevancy": integer // Classificação de 1 a 5 (5 = mais relevante/impactante para ESTA situação).
    }
    // Add more property objects (targeting 5-8 total), ordered by relevancy, following the same format. Each must have a unique, randomly generated UUID as its property_id.
  ]
}

**Notes:**

- Focus strictly on therapeutic properties; do not list specific essential oils.
- Ensure the selected properties reflect the interconnectedness of mind and body relevant to the user's inputs.
- Tailor the description for each property to explicitly connect it to the user's specific situation.
- Accurately populate causes_addressed and symptoms_addressed using the exact cause_name and symptom_name strings from the input that each property primarily targets. If a property addresses multiple, list them separated by a comma and space. - Leave the string empty if a property doesn't directly target a specific listed cause or symptom (e.g., a general systemic property).
- Adhere strictly to the Important Clarification regarding listing each property individually.
- Crucially, ensure each property object in the therapeutic_properties array includes a property_id field containing a newly generated, unique, standard random UUID string (like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). A new UUID should be generated for each property every time this prompt is executed.
```

### Response Payload:

```json
[
  {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": {
        "health_concern_in_english": "cold sores",
        "therapeutic_properties": [
          {
            "property_id": "4a02aec1-863f-49f8-b00a-816764f14d2d",
            "property_name": "Antiviral",
            "property_name_in_english": "Antiviral",
            "description": "Esta propriedade ajuda a combater infecções virais como o herpes simples, abordando diretamente o problema do herpes labial que o usuário está enfrentando.",
            "causes_addressed": "",
            "symptoms_addressed": "Lesões na pele, Coceira ou queimação",
            "relevancy": 5
          },
          {
            "property_id": "45720011-a551-46e9-b4c6-e8a40cbbc307",
            "property_name": "Calmante",
            "property_name_in_english": "Calming",
            "description": "Ajuda a reduzir os níveis de estresse e ansiedade que podem desencadear surtos de herpes labial, permitindo que o usuário encontre alívio emocional e mental.",
            "causes_addressed": "Estresse e ansiedade, Fatores emocionais negativos",
            "symptoms_addressed": "Irritabilidade",
            "relevancy": 5
          },
          {
            "property_id": "c1c35141-36d4-489e-acee-323190d2c016",
            "property_name": "Fortalecedora do sistema imunológico",
            "property_name_in_english": "Immune-Boosting",
            "description": "Contribui para o fortalecimento da resposta imunológica do organismo, ajudando a minimizar a reativação do vírus herpes simples, especialmente em usuários com dieta pobre e falta de descanso adequado.",
            "causes_addressed": "Falta de descanso adequado, Dieta pobre em nutriente",
            "symptoms_addressed": "",
            "relevancy": 4
          },
          {
            "property_id": "f18c4e87-8017-46f0-9771-572b5e5aae58",
            "property_name": "Analgesic",
            "property_name_in_english": "Analgesic",
            "description": "Proporciona alívio da dor e sensibilidade na área afetada durante os surtos de herpes labial, aliviando a sensação de desconforto.",
            "causes_addressed": "",
            "symptoms_addressed": "Sensibilidade na área",
            "relevancy": 4
          },
          {
            "property_id": "9fca0026-1467-4d2e-b8df-11d584930e61",
            "property_name": "Anti-inflamatória",
            "property_name_in_english": "Anti-inflammatory",
            "description": "Reduz a inflamação associada às lesões de herpes labial, ajudando a minimizar o desconforto físico e a promover a cicatrização.",
            "causes_addressed": "",
            "symptoms_addressed": "Lesões na pele",
            "relevancy": 3
          },
          {
            "property_id": "b519c099-d430-4698-b389-dc0cc6e2d8ab",
            "property_name": "Equilibrante do Humor",
            "property_name_in_english": "Mood Balancing",
            "description": "Auxilia na estabilização do humor, que pode ser afetado por surtos de herpes labial, proporcionando um suporte emocional necessário.",
            "causes_addressed": "Estresse e ansiedade, Fatores emocionais negativos",
            "symptoms_addressed": "Irritabilidade",
            "relevancy": 3
          },
          {
            "property_id": "8eb23ebd-d497-4c47-bcaa-11531cf672bc",
            "property_name": "Estimulante Mental",
            "property_name_in_english": "Cognitive Enhancer",
            "description": "Ajuda a melhorar a clareza mental e combater a fadiga, promovendo maior foco e energia, especialmente importante em momentos de estresse e baixa imunidade.",
            "causes_addressed": "Estilo de vida sedentário",
            "symptoms_addressed": "",
            "relevancy": 2
          },
          {
            "property_id": "efb86a82-7464-4ff5-8b6a-15455e2265c1",
            "property_name": "Sedativo",
            "property_name_in_english": "Sedative",
            "description": "Promove relaxamento, ajudando o corpo a lidar com estresse e ansiedade, que são fatores contribuintes para o aparecimento de herpes labial.",
            "causes_addressed": "Estresse e ansiedade, Fatores emocionais negativos",
            "symptoms_addressed": "",
            "relevancy": 2
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
*Note: This step is informational, not interactive for selection. The UI should reflect this.*

**Layout & UX:**
*   **Overall Screen Structure (Mobile):**
    *   **Header:** Step title (e.g., "Our Therapeutic Focus"). Progress indicator.
    *   **Context Confirmation (`echo` data):** Briefly reiterate `health_concern_input` and perhaps a count of selected causes/symptoms.
    *   **Instructional Text:** Explain what this information means (e.g., "Based on your input, our system will now look for oils with these therapeutic actions:").
    *   **`health_concern_details`:** Optionally display `original_input` and `normalized_english` if it adds clarity for the user.
    *   **List of Properties:** Vertically stacked list of `therapeutic_properties`. Each property as an informational card or rich list item (non-selectable).
    *   **Footer/CTA:** A single "Next" or "Understand, Continue" button, always enabled.
*   **Property Card/Item Design (Mobile):**
    *   **Visual Hierarchy:**
        *   `property_name_localized`: Prominent title for each property.
        *   `description_contextual_localized`: Main content, clearly explaining the property's relevance to the user's situation.
    *   **`relevancy_score`:** If displayed to the user (consider if this adds value or confusion), present it subtly (e.g., "Relevance: High" or 5/5 stars). Often, this is used for internal sorting, and the `description_contextual_localized` should convey the importance.
    *   **Addressing Causes/Symptoms:** The `description_contextual_localized` should ideally cover this. If `addresses_cause_ids` / `addresses_symptom_ids` are to be explicitly shown, this could be a small, secondary text or an optional, very brief expandable "Targets: [Symptom Name], [Cause Name]" that requires mapping IDs to names from previous state.

**Text Considerations:**
*   **Clarity:** `property_name_localized` should be understandable. `description_contextual_localized` is key; ensure it’s easy to grasp, even if it discusses therapeutic concepts.
*   **Text Density:** Break down `description_contextual_localized` into short paragraphs for mobile.
*   Use `meta.user_language`.

**Interactions:**
*   **No Selection:** This is purely informational. Cards/items are not tappable for selection.
*   **Optional Expansion:** If "Addressing Causes/Symptoms" is detailed, it might use a very light disclosure pattern, but prioritize simplicity.
*   **CTA Button:** Always enabled, as no input is required from the user on this screen.

**Performance & Responsiveness:**
*   **List Rendering:** For 5-8 items, direct rendering.
*   **Tablet/Desktop Adaptation:** List can remain single-column for focused reading or adopt a card layout if visually balanced. Max-width on text blocks for readability.

**Accessibility (A11y):**
*   **Structure:** Use appropriate heading levels for the screen title and each `property_name_localized`. The list can be a `<ul>` or `<dl>`.
*   **ARIA Attributes:** If any minor parts are expandable, use `aria-expanded`/`aria-controls`.
*   **Keyboard Navigation:** Standard content navigation (scroll, read).
*   **Screen Reader:** Announce all text content logically. Ensure clear semantic structure.
*   **Color Contrast:** High contrast for all text.

---
