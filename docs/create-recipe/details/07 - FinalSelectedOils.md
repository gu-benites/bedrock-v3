**Step 06: `FinalSelectedOils`**

This step's entire purpose is to intelligently filter the large pool of candidates down to the final, synergistic "team" of oils that will be used in the protocol.

* *   **Persona:** Act as a an expert in essential oil synergy and holistic analysis. Your sole function is to review a list of potential oils, along with their therapeutic properties and safety data, and select the most effective and efficient combination to address the user's specific needs.
*     
* *   **Input:**
*     
*     * *   All user data (profile, selected causes/symptoms).
*     * *   The required `therapeutic_properties`.
*     * *   The full list of candidate `suggested_oils` and their relevancy scores (from Step 5).
*     * *   The structured `oil_safety_profiles` (from Step 6).
* *   **Objective:** To produce a final, curated list of 3-6 oils that are both safe for the user and provide the best possible synergistic coverage of the required therapeutic properties.
*     
* *   **Logic:**
*     
*     1. 1.  **Safety Filter:** Begin by creating a "safety-approved" list of candidate oils by removing any oils whose `contraindications` conflict with the user's profile (`age_category`, `gender`, etc.).
*     1. 2.  **Synergy & Relevancy Analysis:** From the safety-approved list, analyze which combination of oils provides the most potent and comprehensive coverage.* *   Prioritize oils that address multiple, high-relevancy therapeutic properties.
*     1.     * *   Weigh the relevancy scores of both the properties and the oils to identify the most impactful candidates.
*     1. 3.  **Selection:** Choose the final "team" of 3-6 oils that represent the optimal blend of efficacy and synergy.
* *   **Output (`oilsSelected`):** A clean JSON object containing the final list of oils. This is the definitive palette for the next step.
*     
*     JSON
*     
*     ```
*     {
*       "final_selected_oils": [
*         {
*           "name_english": "Frankincense",
*           "name_local_language": "Olíbano",
*           "safety_profile": { ... } // The complete safety profile for this oil is carried forward
*         },
*         {
*           "name_english": "Lavender",
*           "name_local_language": "Lavanda",
*           "safety_profile": { ... }
*         },
*         {
*           "name_english": "Lemon",
*           "name_local_language": "Limão",
*           "safety_profile": { "is_phototoxic": true, ... }
*         }
*       ]
*     }
*     ```
*