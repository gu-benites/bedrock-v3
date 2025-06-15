

# OUTPUT

{
  "meta": {
    "step_name": "Identify Therapeutic Properties",
    "request_id": "123e4567-e89b-12d3-a456-426614174000",
    "timestamp_utc": "2023-10-03T14:30:00Z",
    "version": "1.0",
    "user_language": "PT_BR",
    "status": "sucesso",
    "message": "Identificação concluída com sucesso"
  },
  "data": {
    "therapeutic_properties": [
      {
        "property_id": "a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14",
        "property_name_localized": "Propriedades relaxantes musculares",
        "property_name_english": "Muscle Relaxant Properties",
        "description_contextual_localized": "Ajuda a aliviar a tensão muscular no pescoço e ombros, facilitando o relaxamento pós-trabalho.",
        "addresses_cause_ids": [
          "cause_1749968223960_0.14674385878138319",
          "cause_1749968223960_0.6355966392990287"
        ],
        "addresses_symptom_ids": [
          "symptom_1749968223960_0.9548104346199592"
        ],
        "relevancy_score": 5
      },
      {
        "property_id": "b2c3d4e5-f6g7-8h9i-10j11-k12l13m14n15",
        "property_name_localized": "Propriedades calmantes e ansiolíticas",
        "property_name_english": "Calming and Anxiolytic Properties",
        "description_contextual_localized": "Contribui a reduzir o estresse emocional e ansiedade, auxiliando na melhora do humor e alívio do estresse ocasionado pelo trabalho.",
        "addresses_cause_ids": [
          "cause_1749968223960_0.541892068011635"
        ],
        "addresses_symptom_ids": [
          "symptom_1749968223960_0.10029391174058722"
        ],
        "relevancy_score": 4
      },
      {
        "property_id": "c3d4e5f6-g7h8-9i10-j11k-12l13m14o15p16",
        "property_name_localized": "Propriedades anti-inflamatórias e analgésicas",
        "property_name_english": "Anti-inflammatory and Analgesic Properties",
        "description_contextual_localized": "Ajuda a reduzir a inflamação e dor muscular na região do pescoço e ombros, promovendo maior conforto durante o dia.",
        "addresses_cause_ids": [
          "cause_1749968223960_0.14674385878138319"
        ],
        "addresses_symptom_ids": [],
        "relevancy_score": 4
      },
      {
        "property_id": "d4e5f6g7-h8i9-10j11-k12l13m14n15o16q17",
        "property_name_localized": "Propriedades emocionalmente equilibrantes",
        "property_name_english": "Emotionally Balancing Properties",
        "description_contextual_localized": "Auxilia no gerenciamento do estresse emocional e mudanças de humor causadas por fatores ocupacionais e de postura.",
        "addresses_cause_ids": [
          "cause_1749968223960_0.541892068011635"
        ],
        "addresses_symptom_ids": [
          "symptom_1749968223960_0.10029391174058722"
        ],
        "relevancy_score": 4
      },
      {
        "property_id": "e5f6g7h8-i9j10-k11l12-m13n14o15p16q17r18",
        "property_name_localized": "Propriedades estimulantes do bem-estar mental",
        "property_name_english": "Mental Well-being Enhancing Properties",
        "description_contextual_localized": "Favorece a clareza mental e o aumento do ânimo, ajudando a combater a fadiga mental decorrente do trabalho prolongado no computador.",
        "addresses_cause_ids": [],
        "addresses_symptom_ids": [
          "symptom_1749968223960_0.10029391174058722"
        ],
        "relevancy_score": 3
      },
      {
        "property_id": "f6g7h8i9-j10k-11l12-m13n14o15p16q17r18s19",
        "property_name_localized": "Propriedades de reforço do sistema nervoso",
        "property_name_english": "Nervous System Supporting Properties",
        "description_contextual_localized": "Fortalece a resposta do sistema nervoso ao estresse, promovendo maior resistência emocional e física ao longo do dia.",
        "addresses_cause_ids": [
          "cause_1749968223960_0.541892068011635"
        ],
        "addresses_symptom_ids": [],
        "relevancy_score": 3
      }
    ]
  },
  "echo": {
    "health_concern": "Muscle tension in shoulders and neck from desk work",
    "gender": "{{gender}}",
    "age_category": "{{age_category}}",
    "age_specific": "{{age_specific}}",
    "user_language": "PT_BR",
    "selected_causes_count": 3,
    "selected_symptoms_count": 2
  }
}