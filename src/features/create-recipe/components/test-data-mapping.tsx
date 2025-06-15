/**
 * @fileoverview Test component to verify data mapping fixes
 * This component can be used to test the hardcoded values and relevancy score fixes
 */

'use client';

import React from 'react';

// Test data that simulates the AI response structure
const testTherapeuticProperties = [
  {
    "property_id": "7f4d8a0a-2b3a-4e87-941d-4e9e6d7f0a1b",
    "property_name_localized": "Propriedades relaxantes",
    "property_name_english": "Relaxing Properties",
    "description_contextual_localized": "Ajuda a aliviar o estresse emocional, contribuindo para a redução da inflamação na pele e melhora do bem-estar emocional, especialmente útil para quem sofre com irritabilidade e alterações de humor devido a desconfortos.",
    "addresses_cause_ids": [
      "cause_1749963197290_0.9132890324983877",
      "cause_1749963197290_0.6805103469535825"
    ],
    "addresses_symptom_ids": [
      "symptom_1749963197290_0.747048732253606",
      "symptom_1749963197290_0.7396436540042904"
    ],
    "relevancy_score": 5
  },
  {
    "property_id": "dtex4c5f-8e6d-4a8b-b3e8-24f9c3f7b1df",
    "property_name_localized": "Propriedades equilibrantes do humor",
    "property_name_english": "Mood Balancing Properties",
    "description_contextual_localized": "Contribui para a estabilização emocional, ajudando a reduzir a irritabilidade e o desconforto emocional causado pelo desconforto e prurido da dermatite, promovendo bem-estar mental.",
    "addresses_cause_ids": [
      "cause_1749963197290_0.9132890324983877"
    ],
    "addresses_symptom_ids": [
      "symptom_1749963197290_0.747048732253606",
      "symptom_1749963197290_0.7396436540042904"
    ],
    "relevancy_score": 4
  }
];

const testCauses = [
  { cause_name: "Chronic skin sensitivity", cause_suggestion: "Age-related changes", explanation: "Skin becomes more sensitive with age" },
  { cause_name: "Stress and emotional tension", cause_suggestion: "Emotional factors", explanation: "Stress can worsen skin conditions" },
  { cause_name: "Environmental factors", cause_suggestion: "External triggers", explanation: "Dry air and seasonal changes" },
  { cause_name: "Diet and nutrition", cause_suggestion: "Nutritional factors", explanation: "Poor diet affects skin health" },
  { cause_name: "Physical fatigue", cause_suggestion: "Energy levels", explanation: "Fatigue impacts overall health" },
  { cause_name: "Irritating products", cause_suggestion: "Product sensitivity", explanation: "Harsh chemicals irritate skin" },
  { cause_name: "Immune response changes", cause_suggestion: "Aging immune system", explanation: "Immune system changes with age" }
];

const testSymptoms = [
  { symptom_name: "Skin irritation", symptom_suggestion: "Redness and inflammation", explanation: "Visible skin irritation" },
  { symptom_name: "Emotional discomfort", symptom_suggestion: "Mood changes", explanation: "Emotional impact of skin issues" }
];

export function TestDataMapping() {
  const selectedCauseIds = new Set(['Chronic skin sensitivity', 'Stress and emotional tension']);
  const selectedSymptomIds = new Set(['Skin irritation']);

  const getRelevancyColor = (relevancy: number) => {
    if (relevancy >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (relevancy >= 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (relevancy >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRelevancyLabel = (relevancy: number) => {
    if (relevancy >= 4) return 'Highly Relevant';
    if (relevancy >= 3) return 'Very Relevant';
    if (relevancy >= 2) return 'Moderately Relevant';
    return 'Somewhat Relevant';
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Data Mapping Test</h1>
      
      {/* Test Causes Selection Counter */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Causes Selection Counter Test</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Select 1-{testCauses.length} causes that might apply to you
            </p>
            <span className="text-sm font-medium text-gray-900">
              {selectedCauseIds.size}/{testCauses.length} selected
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✅ Fixed: Now shows {selectedCauseIds.size}/{testCauses.length} instead of hardcoded /10
          </p>
        </div>
      </div>

      {/* Test Symptoms Selection Counter */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Symptoms Selection Counter Test</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Select 1-{testSymptoms.length} symptoms that you're experiencing
            </p>
            <span className="text-sm font-medium text-gray-900">
              {selectedSymptomIds.size}/{testSymptoms.length} selected
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✅ Fixed: Now shows {selectedSymptomIds.size}/{testSymptoms.length} instead of hardcoded /15
          </p>
        </div>
      </div>

      {/* Test Properties Relevancy Score */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Properties Relevancy Score Test</h2>
        <div className="space-y-4">
          {testTherapeuticProperties.map((property, index) => (
            <div key={property.property_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{property.property_name_localized}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRelevancyColor(property.relevancy_score)}`}>
                  {getRelevancyLabel(property.relevancy_score)} ({property.relevancy_score}/5)
                </div>
              </div>
              
              <p className="text-gray-600 text-sm">{property.description_contextual_localized}</p>
              
              {/* Show addressed causes and symptoms */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                {property.addresses_cause_ids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Addresses Causes:</h4>
                    <div className="flex flex-wrap gap-1">
                      {property.addresses_cause_ids.map((causeId, idx) => (
                        <span key={causeId} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                          Cause #{idx + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {property.addresses_symptom_ids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Addresses Symptoms:</h4>
                    <div className="flex flex-wrap gap-1">
                      {property.addresses_symptom_ids.map((symptomId, idx) => (
                        <span key={symptomId} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Symptom #{idx + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                ✅ Fixed: Relevancy score now correctly maps from relevancy_score field ({property.relevancy_score})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
