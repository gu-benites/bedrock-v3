# API Calls and Responses Documentation

- **API Integration**: Interacts with an external API (configurable via environment variables) to:
  - Fetch potential causes and symptoms.
  - Retrieve associated therapeutic properties.
  - Obtain suggestions for essential oils.

This document outlines the expected request bodies and response payloads for each step of the AromaRx API interaction.

## Environment Variables

The following environment variables must be configured:

- `CREATE_RECIPE_BASE_URL`: The base URL for the external recipe API
  - Example: `https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols`
- `CREATE_RECIPE_APIKEY`: The API key for authenticating with the external recipe API

## Example API Call

```bash
curl --location '$CREATE_RECIPE_BASE_URL' \
--header 'apikey: $CREATE_RECIPE_APIKEY' \
--header 'Content-Type: application/json' \
--data '{
  "health_concern": "dermatite atopica",
  "gender": "male",
  "age_category": "child",
  "age_specific": "8",
  "step": "PotentialCauses",
  "user_language": "PT_BR"
}'


## Step: PotentialCauses

### Request Body:

```json
{
  "health_concern": "dermatite atopica",
  "gender": "male",
  "age_category": "child",
  "age_specific": "8",
  "step": "PotentialCauses",
  "user_language": "PT_BR"
}
```

### Prompt:

**Potential Causes: Wellness Assessment Tool**

**Persona:** Act as an experienced wellness and holistic health advisor with evidence-based knowledge, skilled at correlating common health complaints with potential underlying causes based on individual profiles and lifestyle factors.

**Objective:** Analyze the provided `health_problem` and `userInfo` to generate a personalized list of the most likely potential causes or contributing factors. This list is intended to be presented to the user for reflection, helping them identify factors relevant to their situation, while avoiding medical diagnosis.

**Input Data:**

1. `health_problem`: The primary health complaint, symptom, or goal.
   * Value: `{{ $('Edit Fields').item.json.user.health_concern }}`

2. `userInfo`: A JSON object containing crucial details about the end-user. **This profile is the primary driver for personalization.**
   * Value: 
     ```json
     {{ JSON.stringify($('Edit Fields').item.json.userInfo, null, 2) }}
     ```

3. `user_language`: The target language for user-facing text in the output.
   * Value: `{{ $('Edit Fields').item.json.userInfo.user_language }}`

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

Provide the result strictly in the following JSON format. **JSON key names must be in English.** The values for `cause_name`, `cause_suggestion`, `explanation`, and any advisory notes must be in the language specified by `user_language`.

```json
{
  "potential_causes": [
    {
      "cause_name": "A very short label for the potential cause (2-4 words), in the user's language.", 
      "cause_suggestion": "A clear, concise description of the potential cause or contributing factor.",
      "explanation": "A brief (1-2 sentence) justification explaining why this specific cause is relevant considering the 'health_problem' and particularly the 'userInfo'."
    }
    // Add 5-8 causes total, following the same format
    // Add more cause objects (targeting 5-10 total), following the same format and requirements.
  ]
}
```

### Response Payload:

```json
[
  {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": {
        "potential_causes": [
          {
            "cause_name": "Dermatite atópica",
            "cause_suggestion": "Possivelmente relacionada a uma condição genética de pele que causa irritação e inflamação.",
            "explanation": "A dermatite atópica é comum em crianças e pode ser agravada por fatores ambientais, além de predisposição genética."
          },
          {
            "cause_name": "Alergias ambientais",
            "cause_suggestion": "Reações a poeira, ácaros, pelos de animais ou outros alérgenos presentes no ambiente de casa ou escola.",
            "explanation": "Ambientes com alta exposição a alérgenos são fatores conhecidos que podem desencadear ou agravar a dermatite atópica em crianças."
          },
          {
            "cause_name": "Fatores de pele seca",
            "cause_suggestion": "Falta de hidratação adequada da pele ou uso de sabonetes agressivos que removem a camada protetora da pele.",
            "explanation": "A pele seca aumenta a vulnerabilidade à irritação e infecção, contribuindo para crises de dermatite atópica, especialmente em crianças."
          },
          {
            "cause_name": "Stress emocional",
            "cause_suggestion": "Ansiedade ou estresse relacionados à rotina escolar, familiares ou mudanças na vida da criança.",
            "explanation": "Estresse emocional pode alterar as respostas imunológicas da pele, agravando condições como a dermatite atópica em crianças."
          },
          {
            "cause_name": "Mudanças climáticas",
            "cause_suggestion": "Agressões ambientais como frio ou mudança repentina de temperatura que podem piorar a condição da pele.",
            "explanation": "Climas secos ou frios podem secar ainda mais a pele, intensificando a inflamação na dermatite atópica em crianças."
          },
          {
            "cause_name": "Hábito de coçar",
            "cause_suggestion": "Rascado frequente que irrita ainda mais a pele e mantém o ciclo de inflamação.",
            "explanation": "Crianças podem coçar inconscientemente, o que perpetua a inflamação e agravamento da dermatite."
          },
          {
            "cause_name": "Alimentação inadequada",
            "cause_suggestion": "Dieta que pode incluir alimentos alergênicos ou inflamatórios, influenciando a saúde da pele.",
            "explanation": "Certos alimentos podem potencialmente desencadear reações alérgicas ou inflamatórias que pioram a dermatite atópica."
          },
          {
            "cause_name": "Falta de rotinas de cuidados com a pele",
            "cause_suggestion": "Negligência na hidratação diária ou uso de produtos suaves para pele sensível.",
            "explanation": "Uma rotina adequada de cuidados ajuda a manter a barreira da pele intacta, reduzindo crises de dermatite."
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

---

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

---

## Step: MedicalProperties

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

---

## Step: SuggestedOils

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

---

## Step: RecipeChoices

### Request Body:

```json
{
  "health_concern": "dor de cabeça",
  "gender": "female",
  "age_category": "teenager",
  "age_specific": "15",
  "selected_causes": [
    {
      "id": "cause-postura-inadequada",
      "cause_name": "Postura inadequada",
      "cause_suggestion": "Maus hábitos de postura ao estudar, usar celular ou assistir televisão, levando à tensão muscular.",
      "explanation": "Músculos tensos do pescoço e ombros devido à má postura podem favorecer dores de cabeça em jovens adolescentes."
    }
  ],
  "selected_symptoms": [
    {
      "symptom_name": "Dores no pescoço e ombros"
    },
    {
      "symptom_name": "Dor de cabeça tensionada"
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
    },
    {
      "property_id": "2e0faab8-0a38-49e5-95bc-9a8611117da0",
      "property_name": "Vasodilatador",
      "property_name_in_english": "Vasodilator",
      "description": "Promove a dilatação dos vasos sanguíneos, que pode ajudar a aliviar a pressão e a dor associadas a dores de cabeça.",
      "causes_addressed": "Tensão e estresse",
      "symptoms_addressed": "Dor de cabeça tensionada",
      "relevancy": 4
    }
  ],
  "suggested_oils_for_properties": [
    {
      "property_id": "63b857de-7554-4d84-b81f-8bec911c86c9",
      "property_name": "Relaxante Muscular",
      "property_name_in_english": "Muscle Relaxant",
      "description": "Auxilia a aliviar a tensão muscular no pescoço e ombros que está ligada à postura inadequada, contribuindo para a diminuição da dor e promovendo relaxamento.",
      "suggested_oils": [
        {
          "name_english": "Lavender",
          "name_local_language": "Lavanda",
          "oil_description": "A lavanda é conhecida por suas propriedades relaxantes musculares e calmantes, ajudando a aliviar tensões no pescoço e ombros.",
          "relevancy": 5
        },
        {
          "name_english": "Marjoram",
          "name_local_language": "Manjerona",
          "oil_description": "A manjerona possui propriedades analgésicas e relaxantes musculares, sendo eficaz para aliviar dores e tensões nos músculos do pescoço e ombros.",
          "relevancy": 4
        }
      ]
    },
    {
      "property_id": "2e0faab8-0a38-49e5-95bc-9a8611117da0",
      "property_name": "Vasodilatador",
      "property_name_in_english": "Vasodilator",
      "description": "Promove a dilatação dos vasos sanguíneos, que pode ajudar a aliviar a pressão e a dor associadas a dores de cabeça.",
      "suggested_oils": [
        {
          "name_english": "Peppermint",
          "name_local_language": "Hortelã-pimenta",
          "oil_description": "A hortelã-pimenta tem efeito refrescante e pode ajudar a dilatar os vasos sanguíneos, aliviando dores de cabeça tensionais.",
          "relevancy": 5
        },
        {
          "name_english": "Rosemary",
          "name_local_language": "Alecrim",
          "oil_description": "O alecrim melhora a circulação sanguínea e pode ajudar a aliviar dores de cabeça relacionadas à tensão muscular.",
          "relevancy": 4
        }
      ]
    }
  ],
  "step": "RecipeChoices",
  "user_language": "PT_BR"
}
```

### Prompt:


### Response Payload:

```json
{
  "choices": [
    {
      "title": "Blend Relaxante para Alívio de Dor de Cabeça",
      "description": "Uma combinação de óleos essenciais para aliviar a tensão muscular e promover o relaxamento, ajudando a reduzir dores de cabeça tensionais.",
      "steps": [
        "Dilua 2 gotas de Lavanda, 1 gota de Hortelã-pimenta e 1 gota de Manjerona em 1 colher de sopa de óleo carreador (como óleo de coco fracionado ou jojoba).",
        "Aplique a mistura nas têmporas, nuca e ombros com movimentos circulares suaves.",
        "Respire profundamente o aroma para benefícios adicionais.",
        "Repita a aplicação a cada 3-4 horas conforme necessário."
      ],
      "oils": [
        {
          "name_english": "Lavender",
          "name_local_language": "Lavanda",
          "oil_description": "A lavanda é conhecida por suas propriedades relaxantes musculares e calmantes, ajudando a aliviar tensões no pescoço e ombros.",
          "relevancy": 5
        },
        {
          "name_english": "Peppermint",
          "name_local_language": "Hortelã-pimenta",
          "oil_description": "A hortelã-pimenta tem efeito refrescante e pode ajudar a dilatar os vasos sanguíneos, aliviando dores de cabeça tensionais.",
          "relevancy": 5
        },
        {
          "name_english": "Marjoram",
          "name_local_language": "Manjerona",
          "oil_description": "A manjerona possui propriedades analgésicas e relaxantes musculares, sendo eficaz para aliviar dores e tensões nos músculos do pescoço e ombros.",
          "relevancy": 4
        }
      ],
      "time_of_day": "evening"
    },
    {
      "title": "Blend Circulatório para Alívio de Dor de Cabeça",
      "description": "Uma mistura de óleos essenciais focada em melhorar a circulação e promover vasodilatação para aliviar dores de cabeça.",
      "steps": [
        "Dilua 2 gotas de Hortelã-pimenta, 1 gota de Alecrim e 1 gota de Lavanda em 1 colher de sopa de óleo carreador.",
        "Aplique na testa, têmporas e atrás das orelhas com movimentos suaves.",
        "Para intensificar o efeito, coloque 3-4 gotas da mesma mistura em um difusor e mantenha no ambiente por 30 minutos.",
        "Use quando sentir os primeiros sinais de dor de cabeça."
      ],
      "oils": [
        {
          "name_english": "Peppermint",
          "name_local_language": "Hortelã-pimenta",
          "oil_description": "A hortelã-pimenta tem efeito refrescante e pode ajudar a dilatar os vasos sanguíneos, aliviando dores de cabeça tensionais.",
          "relevancy": 5
        },
        {
          "name_english": "Rosemary",
          "name_local_language": "Alecrim",
          "oil_description": "O alecrim melhora a circulação sanguínea e pode ajudar a aliviar dores de cabeça relacionadas à tensão muscular.",
          "relevancy": 4
        },
        {
          "name_english": "Lavender",
          "name_local_language": "Lavanda",
          "oil_description": "A lavanda é conhecida por suas propriedades relaxantes musculares e calmantes, ajudando a aliviar tensões no pescoço e ombros.",
          "relevancy": 5
        }
      ],
      "time_of_day": "morning"
    }
  ]
}
```

### Important Note:

The RecipeChoices step automatically uses ALL therapeutic properties from the medicalPropertiesResult without requiring user selection. When the "Gerar Sugestões" button is clicked in the PropertiesOilsStep, the system will automatically set all therapeutic properties as selected and include them in the API request.
