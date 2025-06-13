### **Step 05: `OilSafetyConstraints`**

This step is a focused, data-retrieval task. Its sole purpose is to gather objective safety information for the each of the potential candidate oils.

* *   **Persona:** Act as a technical Essential Oil Safety Database. Your role is to provide factual safety data for a given list of oils based on the user's age category, without interpretation or advice.
*     
* *   **Input:**
*     
*     * *   A consolidated list of all unique candidate oils from Step 04.
*     * *   The user's `age_category` from the `userInfo` (e.g., "child", "teen", "adult").
* *   **Objective:** For each essential oil in the input list, retrieve its key safety and application constraints.
*     
* *   **Output Format:** A structured JSON object where each key is an oil name, and the value is its safety profile. Recommended dilution, internal usage, phototoxic.
*

{
  "oil_safety_profiles": [
    {
      "id": "UUID",
      "name_english": "Peppermint",
      "dilution": neutral,
      "is_phototoxic": false,
      "internal_use_advisory": "boolean"
    },
    // ... more oil profiles
  ]
}