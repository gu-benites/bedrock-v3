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

These schemas provide a robust, clear, and extensible framework for AI-Powered superior experience for both developers integrating with the API and end-users interacting with the web application.