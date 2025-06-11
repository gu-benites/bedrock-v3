JSON output, designed with a "frontend first" mentality and adherence to high software engineering standards:

**Overall Principles Applied to All Schemas:**

*   **Standardized Envelope:** Each API response will use a consistent envelope for metadata, the actual data payload, an echo of critical request parameters. This promotes consistency, aids in debugging, and supports versioning.
*   **Unique Identifiers (UUIDs):** All core entities (causes, symptoms, properties, oils, recipes, protocols) will have a unique, stable id (UUID v4).
*   **Clear Naming Conventions:** snake\_case for all keys, as is common in many JSON-based APIs. Names are descriptive and aim to be self-documenting.
*   **Internationalization (i18n) & Localization (l10n):**
     * *   Fields intended for user display will have a \_localized suffix (e.g., name\_localized). The language is specified in the meta.user\_language field of the envelope.
     * *   Where an English canonical name is useful for system logic or as a fallback, it will be provided (e.g., name\_english).

*   **Data Integrity & Relationships:** Relationships are explicitly defined using arrays of IDs. This ensures referential integrity and allows for rich data linking.
*   **Structured for Frontend:** Data is organized to be easily consumed and rendered by a web application, minimizing frontend data transformation.
*   **Extensibility:** Schemas are designed to allow for future additions without breaking existing consumers (e.g., adding new optional fields).
*   **Atomicity:** Fields represent discrete pieces of information. Arrays of objects are used for lists over comma-separated strings.
*   **Botanical Names:** For essential oils, the name\_botanical is critical for unambiguous identification and will be a primary key.
*   **Contextual Echo:** The echo block in the envelope will include key input parameters that influenced the current step's output, aiding traceability.

## JSON Schemas for Each Step

### Step 01: PotentialCauses

```
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

### Step 02: PotentialSymptoms

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

### Step 03: MedicalProperties

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
    "health_concern_details": {
      "original_input": "herpes labial",
      "normalized_english": "cold sores"
    },
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

### Step 04: SuggestedOils

```
{
  "meta": {
    "step_name": "SuggestOilsForProperty",
    "request_id": "c3d4e5f6-a7b8-9012-3456-789012cdef01",
    "timestamp_utc": "2024-05-21T10:15:00Z",
    "version": "api_v1.0_step_v1.2",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully suggested oils for the specified property."
  },
  "data": {
    "therapeutic_property_context": {
      "property_id": "63b857de-7554-4d84-b81f-8bec911c86c9",
      "property_name_localized": "Relaxante Muscular",
      "property_name_english": "Muscle Relaxant",
      "description_localized": "Auxilia a aliviar a tensão muscular no pescoço e ombros que está ligada à postura inadequada, contribuindo para a diminuição da dor e promovendo relaxamento."
    },
    "suggested_oils": [
      {
        "oil_id": "oil-uuid-nardostachys-jatamansi", // A system-level unique ID for this oil entity
        "name_english": "Spikenard", // Corrected English name
        "name_botanical": "Nardostachys jatamansi", // Primary identifier
        "name_localized": "Nardo",
        "match_rationale_localized": "O óleo essencial de nardo é imunoestimulante... sendo útil para quem precisa regular a pressão arterial...",
        "relevancy_to_property_score": 5, // (1-5) How well this oil matches THIS property for the concern
        "known_active_compounds_indicative": ["Valerenal", "Valeranone", "Jatamansone"] // Optional, for synergy analysis
      },
      {
        "oil_id": "oil-uuid-mentha-piperita",
        "name_english": "Peppermint",
        "name_botanical": "Mentha piperita",
        "name_localized": "Hortelã-pimenta",
        "match_rationale_localized": "O óleo essencial de hortelã ajuda na circulação sanguínea e pode atuar na vasodilatação...",
        "relevancy_to_property_score": 4,
        "known_active_compounds_indicative": ["Menthol", "Menthone", "1,8-Cineole"]
      }
      // ... 5-8 oils, ordered by relevancy_to_property_score
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
    "selected_symptom_ids": ["symptom_id_for_lesoes", "symptom_id_for_coceira", "symptom_id_for_irritabilidade"],
	  "therapeutic_property_id": ["property_id_for_relaxante_muscular"]
  }
}
```

### Step 05: OilSafetyConstraints

```
{
  "meta": {
    "step_name": "RetrieveOilSafetyConstraints",
    "request_id": "d4e5f6a7-b8c9-0123-4567-890123def012",
    "timestamp_utc": "2024-05-21T10:20:00Z",
    "version": "api_v1.0_step_v1.3",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully retrieved safety constraints for the requested oils."
  },
  "data": {
    "oil_safety_profiles": [
      {
        "oil_id": "oil-uuid-mentha-piperita", // Consistent ID from previous step
        "name_english": "Peppermint",
        "name_botanical": "Mentha piperita", // Primary identifier
        "name_localized": "Hortelã-pimenta",
        "safety_summary_for_user_localized": "Seguro para adolescentes quando diluído adequadamente. Evitar perto do rosto em crianças pequenas. Uso interno com cautela.",
        "dilution_guidelines": {
          "max_recommended_topical_dilution_percent_for_user": 3.0, // Example for teen
          "max_recommended_topical_dilution_percent_adult_general": 5.0,
          "notes_localized": "Pode causar sensação de frio intenso. Para peles sensíveis, comece com diluições menores."
        },
        "phototoxicity": {
          "is_phototoxic": false,
          "details_localized": "Não é considerado fototóxico."
        },
        "internal_use": {
          "advisory_code": "CAUTION_PROFESSIONAL_GUIDANCE", // e.g., NOT_RECOMMENDED, PROFESSIONAL_GUIDANCE_ONLY, GENERALLY_SAFE_WITH_CAUTION_FOR_ADULTS
          "details_localized": "Uso interno apenas com orientação profissional qualificada, especialmente para adolescentes. Evitar em crianças menores de 6 anos."
        },
        "contraindications_specific_to_user_profile": [ // Based on age_category, gender, etc.
          { "code": "AVOID_NEAR_FACE_YOUNG_CHILDREN", "text_localized": "Evitar aplicação próxima ao rosto de bebês e crianças pequenas (risco de apneia ou broncoespasmo induzido por mentol)." }
        ],
        "general_contraindications_precautions": [
          { "code": "G6PD_DEFICIENCY", "text_localized": "Contraindicado para pessoas com deficiência de G6PD." },
          { "code": "CARDIAC_FIBRILLATION", "text_localized": "Usar com cautela em pessoas com fibrilação cardíaca." },
          { "code": "SKIN_SENSITIVITY", "text_localized": "Pode causar irritação na pele em indivíduos sensíveis; realize um teste de contato."}
        ],
        "age_specific_restrictions": [
            { "code": "NOT_FOR_CHILDREN_UNDER_X_YEARS_TOPICAL", "text_localized": "Não recomendado topicamente para crianças menores de 3 anos sem diluição extrema e orientação profissional."}
        ],
        "pregnancy_lactation_advisory_localized": "Evitar durante a gravidez e lactação, ou usar apenas com orientação médica."
      }
      // ... one profile for each unique oil requested
    ]
  },
  "echo": {
    "requested_oil_identifiers": [ // List of unique oil identifiers (e.g., botanical names or oil_ids) received
        {"name_english": "Peppermint", "name_botanical": "Mentha piperita"},
        {"name_english": "Lavender", "name_botanical": "Lavandula angustifolia"}
    ],
    "user_age_category": "teen"
  },
  "ui_hints": {
    "user_guidance_localized": "As informações de segurança para os óleos potenciais foram recuperadas. (Esta etapa é interna.)"
  }
}
```

### Step 06: FinalSelectedOils

```
{
  "meta": {
    "step_name": "SelectFinalSynergisticOils",
    "request_id": "e5f6a7b8-c9d0-1234-5678-901234ef0123",
    "timestamp_utc": "2024-05-21T10:25:00Z",
    "version": "api_v1.0_step_v1.2",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully selected final synergistic oils."
  },
  "data": {
    "selection_overview": {
      "strategy_summary_localized": "Selecionamos uma equipe sinérgica de 3 óleos seguros para sua faixa etária (adolescente), focando nas propriedades analgésicas, relaxantes musculares e redutoras de estresse para 'dor de cabeça'.",
      "targeted_property_ids": ["property_id_analgesic", "property_id_muscle_relaxant", "property_id_calming"]
    },
    "final_synergistic_oils": [ // 3-6 oils
      {
        "oil_id": "oil-uuid-lavandula-angustifolia",
        "name_english": "Lavender",
        "name_botanical": "Lavandula angustifolia",
        "name_localized": "Lavanda",
        "reason_for_selection_localized": "Excelente para aliviar a tensão, promover o relaxamento e possui propriedades analgésicas. Muito seguro para adolescentes.",
        "contributes_to_properties": [
          {
            "property_id": "property_id_calming",
            "property_name_localized": "Calmante",
            "contribution_level": "Primary" // Primary, Secondary, Supportive
          },
          {
            "property_id": "property_id_analgesic",
            "property_name_localized": "Analgésico",
            "contribution_level": "Secondary"
          }
        ],
        "key_active_compounds_for_synergy_indicative": ["Linalool", "Linalyl acetate"], // From earlier step, if available
        "carried_safety_profile_for_protocol": { // Distilled for recipe formulation
          "max_safe_topical_dilution_percent_for_user": 3.0, // For teen, for this oil
          "is_phototoxic": false,
          "phototoxicity_warning_localized": null,
          "key_warnings_for_recipe_localized": [],
          "internal_use_permissible_for_protocol": true // Based on safety analysis for this user and oil
        }
      },
      {
        "oil_id": "oil-uuid-mentha-piperita",
        "name_english": "Peppermint",
        "name_botanical": "Mentha piperita",
        "name_localized": "Hortelã-pimenta",
        "reason_for_selection_localized": "Eficaz para dores de cabeça tensionais devido às suas propriedades analgésicas e de resfriamento. Ajuda a aliviar a tensão muscular.",
        "contributes_to_properties": [
          {
            "property_id": "property_id_analgesic",
            "property_name_localized": "Analgésico",
            "contribution_level": "Primary"
          },
          {
            "property_id": "property_id_muscle_relaxant",
            "property_name_localized": "Relaxante Muscular",
            "contribution_level": "Primary"
          }
        ],
        "key_active_compounds_for_synergy_indicative": ["Menthol", "Menthone"],
        "carried_safety_profile_for_protocol": {
          "max_safe_topical_dilution_percent_for_user": 2.5, // Example, might be lower than general teen if blended
          "is_phototoxic": false,
          "phototoxicity_warning_localized": null,
          "key_warnings_for_recipe_localized": ["Evitar contato com os olhos.", "Pode causar sensação de frio intenso."],
          "internal_use_permissible_for_protocol": false // Example: decided against for this protocol
        }
      }
      // ... more oils
    ]
  },
  "echo": {
    // Echo of key inputs like required therapeutic properties, user profile summary, etc.
    "user_age_category": "teen",
    "health_concern_input": "dor de cabeça"
  },
  "ui_hints": {
    "user_guidance_localized": "Com base em suas necessidades e segurança, esta é a equipe de óleos essenciais que usaremos para criar seu protocolo personalizado. (Esta etapa é informativa.)",
    "display_as": "summary_card_list_of_oils_with_reasons"
  }
}
```

### Step 07: DailyRecipesProtocol

```
{
  "meta": {
    "step_name": "FormulateDailyRecipesProtocol",
    "request_id": "f6a7b8c9-d0e1-2345-6789-012345ef0123",
    "protocol_id": "proto-uuid-unique-for-this-instance-123",
    "timestamp_utc": "2024-05-21T10:30:00Z",
    "version": "api_v1.0_step_v1.3",
    "user_language": "PT_BR",
    "status": "success",
    "message": "Successfully formulated the daily recipes protocol."
  },
  "data": {
    "protocol_title_localized": "Seu Protocolo Holístico Personalizado para Dermatite Atópica",
    "protocol_introduction_localized": "Este protocolo foi cuidadosamente elaborado para ajudar a aliviar os sintomas da dermatite atópica, combinando óleos essenciais seguros e eficazes para uso diário. Siga as instruções para melhores resultados e consulte as precauções gerais.",
    "protocol_duration_suggestion_localized": "Recomendamos seguir este protocolo diariamente por 2-3 semanas para avaliar os benefícios. Após este período, você pode continuar se os resultados forem positivos ou consultar um profissional para ajustes.",
    
    "general_precautions_localized": [
      { "id": "medical_advice_disclaimer", "text_localized": "Este protocolo é para fins informativos e não substitui o aconselhamento médico profissional. Consulte sempre seu médico para questões de saúde." },
      { "id": "patch_test", "text_localized": "Realize sempre um teste de contato (patch test) com qualquer nova mistura em uma pequena área da pele 24 horas antes do uso completo." },
      { "id": "discontinue_if_irritation", "text_localized": "Se ocorrer irritação, interrompa o uso, lave a área com óleo vegetal (ex: coco, oliva), depois água e sabão, e procure aconselhamento se necessário." },
      { "id": "keep_away_from_children_pets", "text_localized": "Mantenha os óleos essenciais e misturas fora do alcance de crianças e animais de estimação." },
      { "id": "avoid_eyes_mucous_membranes", "text_localized": "Evite contato direto com os olhos e membranas mucosas." },
      { "id": "consult_if_conditions", "text_localized": "Se estiver grávida, amamentando, tiver uma condição médica preexistente ou estiver tomando medicamentos, consulte um profissional de saúde qualificado antes de usar óleos essenciais." }
    ],

    "daily_regimen": [
      {
        "period_tag": "MORNING", // MORNING, DAYTIME, EVENING, NIGHT
        "period_display_name_localized": "Manhã",
        "period_icon_suggestion": "sun-bright", // For UI
        "period_goal_localized": "Acalmar a pele, reduzir a inflamação e proteger durante o dia.",
        "recipes": [
          {
            "recipe_id": "recipe-uuid-morning-topical-calm",
            "recipe_title_localized": "Sinergia Calmante Matinal para a Pele",
            "recipe_intent_localized": "Proporciona alívio e proteção à pele sensível no início do dia.",
            "application_method": {
              "method_code": "TOPICAL_GENTLE_APPLICATION", // TOPICAL_MASSAGE, DIFFUSION_ULTRASONIC, INHALATION_STEAM, INGESTION_CAPSULE etc.
              "method_name_localized": "Aplicação Tópica Suave",
              "icon_suggestion": "hand-sparkles"
            },
            "ingredients": [
              {
                "type": "ESSENTIAL_OIL",
                "oil_id": "oil-uuid-lavandula-angustifolia", // Link back to oil's canonical ID
                "name_localized": "Lavanda (Lavandula angustifolia)",
                "quantity": { "value": 1, "unit_code": "drop", "unit_localized": "gota" }
              },
              {
                "type": "ESSENTIAL_OIL",
                "oil_id": "oil-uuid-chamaemelum-nobile",
                "name_localized": "Camomila Romana (Chamaemelum nobile)",
                "quantity": { "value": 1, "unit_code": "drop", "unit_localized": "gota" }
              },
              {
                "type": "CARRIER_OIL",
                "name_localized": "Óleo de Jojoba (ou Calêndula)",
                "quantity": { "value": 10, "unit_code": "ml", "unit_localized": "ml", "approx_equivalent_localized": "aprox. 2 colheres de chá" }
              }
            ],
            "equipment_needed_localized": ["Recipiente de vidro pequeno e limpo para mistura (opcional, pode misturar na palma da mão para uso imediato)."],
            "preparation_steps_localized": [
              "Se for preparar uma quantidade maior para alguns dias: Em um pequeno recipiente de vidro limpo, adicione as gotas dos óleos essenciais.",
              "Acrescente o óleo carreador.",
              "Misture suavemente.",
              "Para uso imediato: coloque o óleo carreador na palma da mão e adicione as gotas dos óleos essenciais."
            ],
            "application_instructions_localized": [
              "Após o banho ou limpeza da pele, com a pele ainda ligeiramente úmida para melhor absorção.",
              "Aplique uma fina camada da mistura nas áreas afetadas.",
              "Massageie com extrema delicadeza, com movimentos circulares, até a absorção."
            ],
            "calculated_dilution_percent": 0.5, // (1+1 drops in 10ml = 2 drops in 200 drops carrier ~1%)
            "recipe_specific_warnings_localized": [], // e.g., ["Evitar exposição solar direta na área de aplicação por 12h (fototoxicidade)."] if applicable
            "storage_instructions_localized": "Se preparado em quantidade, guarde em frasco âmbar, em local fresco e escuro, por até 1-2 semanas."
          }
        ]
      },
      {
        "period_tag": "NIGHT",
        "period_display_name_localized": "Noite",
        "period_icon_suggestion": "moon-stars",
        "period_goal_localized": "Promover um sono reparador e acalmar a pele durante a noite.",
        "recipes": [
          {
            "recipe_id": "recipe-uuid-night-diffusion-sleep",
            "recipe_title_localized": "Difusão Noturna para Sono Reparador e Pele Calma",
            "recipe_intent_localized": "Cria um ambiente tranquilo, ajuda a reduzir a coceira noturna e facilita um sono descansado.",
            "application_method": {
              "method_code": "DIFFUSION_ULTRASONIC_ROOM",
              "method_name_localized": "Difusão Ultrassônica Ambiental",
              "icon_suggestion": "diffuser-mist"
            },
            "ingredients": [
              {
                "type": "ESSENTIAL_OIL",
                "oil_id": "oil-uuid-boswellia-carterii",
                "name_localized": "Olíbano (Boswellia carterii)",
                "quantity": { "value": 2, "unit_code": "drop", "unit_localized": "gotas" }
              },
              {
                "type": "ESSENTIAL_OIL",
                "oil_id": "oil-uuid-lavandula-angustifolia",
                "name_localized": "Lavanda (Lavandula angustifolia)",
                "quantity": { "value": 3, "unit_code": "drop", "unit_localized": "gotas" }
              }
            ],
            "equipment_needed_localized": ["Difusor ultrassônico de óleos essenciais."],
            "preparation_steps_localized": [
              "Adicione água filtrada ao seu difusor ultrassônico até a marca indicada pelo fabricante.",
              "Pingue as gotas dos óleos essenciais diretamente na água."
            ],
            "application_instructions_localized": [
              "Ligue o difusor no quarto cerca de 30 minutos antes de dormir.",
              "Deixe difundir por 1-3 horas. Certifique-se de que o ambiente é bem ventilado e que a difusão não é excessiva para o tamanho do cômodo e sensibilidade do usuário (especialmente crianças)."
            ],
            "calculated_dilution_percent": null, // Not applicable for diffusion
            "recipe_specific_warnings_localized": ["Não deixe o difusor ligado durante toda a noite em quartos pequenos ou sem ventilação adequada, especialmente para crianças.", "Limpe seu difusor regularmente conforme as instruções do fabricante."]
          }
        ]
      }
      // Potentially DAYTIME recipes as well
    ],

    "holistic_recommendations_localized": [
      { "category_id": "hydration", "category_name_localized": "Hidratação da Pele", "recommendation_localized": "Mantenha a pele bem hidratada com emolientes neutros e sem perfume várias vezes ao dia, especialmente após o banho.", "icon_suggestion": "water-droplet"},
      { "category_id": "diet", "category_name_localized": "Alimentação Consciente", "recommendation_localized": "Observe se certos alimentos parecem piorar a dermatite (ex: laticínios, glúten, processados). Considere alimentos ricos em ômega-3 (peixes, linhaça) e probióticos (iogurte natural, kefir) para suporte à saúde da pele.", "icon_suggestion": "apple-whole"},
      { "category_id": "clothing", "category_name_localized": "Vestuário Adequado", "recommendation_localized": "Prefira roupas de algodão macias, orgânicas e folgadas. Evite lã e tecidos sintéticos que possam irritar a pele. Lave roupas novas antes de usar.", "icon_suggestion": "t-shirt"},
      { "category_id": "environment", "category_name_localized": "Ambiente Doméstico", "recommendation_localized": "Mantenha o ambiente doméstico limpo, com controle de poeira e ácaros. Evite o uso de produtos de limpeza e higiene com fragrâncias fortes, corantes ou irritantes. Use umidificador se o ar for muito seco.", "icon_suggestion": "house-heart"}
    ],
    
    "final_disclaimer_and_next_steps_localized": "Lembre-se que os óleos essenciais são um suporte complementar e os resultados podem variar. Continue seguindo as orientações do seu médico ou dermatologista. Se os sintomas persistirem ou piorarem, procure aconselhamento profissional. Ajuste o protocolo conforme sua experiência e sensibilidade."
  },
  "echo": {
    "health_concern_input": "dermatite atopica",
    "user_info_input": { "age_category": "child", "age_specific": "8" },
    "final_selected_oil_ids": ["oil-uuid-lavandula-angustifolia", "oil-uuid-chamaemelum-nobile", "oil-uuid-boswellia-carterii"]
  }
}
```

These schemas provide a robust, clear, and extensible framework for AI-Powered Recipe Protocol Generator, ensuring data integrity and a superior experience for both developers integrating with the API and end-users interacting with the web application.