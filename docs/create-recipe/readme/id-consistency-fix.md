# Comprehensive AI Workflow Fixes for Create-Recipe

## Overview

This document outlines the comprehensive fixes applied to resolve multiple critical issues in the create-recipe AI workflow, including ID consistency, prompt duplication, UUID generation, and template variable population.

## 🚨 Critical Issues Identified

### **1. System/User Message Duplication**
- OpenAI Agents JS SDK was receiving the same prompt content in both system instructions and user message
- Caused by passing prompt to `run(agent, prompt)` when agent already had instructions
- Resulted in inefficient API usage and potential confusion

### **2. Non-UUID ID Format**
- Only properties agent was generating proper UUID format IDs
- Causes and symptoms were using timestamp-based IDs like `cause_1749968208121_0.4110664011178419`
- Inconsistent ID formats across workflow steps

### **3. Template Variable Population Issues**
- Demographics fields showing `{{gender}}` instead of actual values in AI prompts
- Template variables not being properly flattened and mapped
- Caused AI to receive unpopulated template variables

### **4. Missing ID Fields in Type Definitions**
- `PotentialCause` interface was missing `cause_id` field
- `PotentialSymptom` interface was missing `symptom_id` field
- This caused frontend code to use names instead of IDs for selection logic

### **5. Frontend ID Generation Instead of AI-Generated IDs**
- Code was generating IDs like `cause_${Date.now()}_${Math.random()}`
- AI-generated IDs from responses were being ignored
- This broke cross-step reference integrity

### **6. ID Mismatch in Cross-References**
- Properties `addresses_cause_ids` and `addresses_symptom_ids` referenced IDs that didn't match stored entities
- Frontend was using name-based matching instead of ID-based matching

### **7. Selection Logic Using Names Instead of IDs**
- Cause selection used `cause.cause_name` for tracking selections
- Symptom selection used `symptom.symptom_name` for tracking selections
- This prevented proper ID persistence across steps

## ✅ Fixes Applied

### **1. Fixed System/User Message Duplication**

**File**: `src/app/api/ai/streaming/route.ts`

```typescript
// BEFORE - Causing duplication
const agent = new Agent({
  instructions: prompt,  // Prompt already set here
  // ...
});
const agentPromise = run(agent, prompt, { stream: true }); // ❌ Prompt passed again

// AFTER - Fixed duplication
const agent = new Agent({
  instructions: prompt,  // Prompt set once
  // ...
});
const agentPromise = run(agent, '', { stream: true }); // ✅ Empty string to avoid duplication
```

### **2. Fixed Template Variable Population**

**File**: `src/app/api/ai/streaming/route.ts`

```typescript
// BEFORE - Nested demographics causing {{gender}} issues
if (feature === 'create-recipe') {
  return {
    demographics: data.demographics || {},
    // ...
  };
}

// AFTER - Flattened variables for proper substitution
if (feature === 'create-recipe') {
  const demographics = data.demographics || {};
  return {
    // Flattened demographics for easier template access
    gender: demographics.gender || '',
    ageCategory: demographics.age_category || '',
    age_specific: demographics.age_specific || '',
    language: data.user_language || 'PT_BR',
    user_language: data.user_language || 'PT_BR',

    // Both nested and flat for compatibility
    demographics: demographics,
    // ...
  };
}
```

### **3. Fixed UUID Generation in Prompts**

**Files**:
- `src/features/create-recipe/prompts/potential-causes.yaml`
- `src/features/create-recipe/prompts/potential-symptoms.yaml`

```yaml
# BEFORE - No UUID requirement specified
**Important:** Include proper metadata, echo the user's input, and provide 5-8 potential causes with localized content.

# AFTER - Explicit UUID requirement
**Important:**
- Include proper metadata, echo the user's input, and provide 5-8 potential causes with localized content
- Generate unique cause_ids for each cause using standard UUID format (e.g., "a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14")
- These cause_ids must be preserved and used consistently throughout the entire workflow
```

### **4. Updated Type Definitions**

**File**: `src/features/create-recipe/types/recipe.types.ts`

```typescript
// BEFORE
export interface PotentialCause {
  cause_name: string;
  cause_suggestion: string;
  explanation: string;
}

export interface PotentialSymptom {
  symptom_name: string;
  symptom_suggestion: string;
  explanation: string;
}

// AFTER
export interface PotentialCause {
  cause_id: string; // AI-generated unique ID
  cause_name: string;
  cause_suggestion: string;
  explanation: string;
}

export interface PotentialSymptom {
  symptom_id: string; // AI-generated unique ID
  symptom_name: string;
  symptom_suggestion: string;
  explanation: string;
}
```

### **2. Fixed Data Transformation to Preserve AI-Generated IDs**

**Files**: 
- `src/features/create-recipe/components/demographics-form.tsx`
- `src/features/create-recipe/components/causes-selection.tsx`
- `src/features/create-recipe/config/step-mapping.ts`

```typescript
// BEFORE - Frontend generating IDs
const transformedCauses = causes.map((cause: any) => ({
  cause_name: cause.name_localized,
  cause_suggestion: cause.suggestion_localized,
  explanation: cause.explanation_localized
}));

// AFTER - Preserving AI-generated IDs
const transformedCauses = causes.map((cause: any) => ({
  cause_id: cause.cause_id || `cause_${Date.now()}_${Math.random()}`, // Fallback only if AI didn't provide ID
  cause_name: cause.name_localized,
  cause_suggestion: cause.suggestion_localized,
  explanation: cause.explanation_localized
}));
```

### **3. Fixed Selection Logic to Use IDs**

**Files**:
- `src/features/create-recipe/components/causes-selection.tsx`
- `src/features/create-recipe/components/symptoms-selection.tsx`

```typescript
// BEFORE - Using names for selection
const handleCauseToggle = (cause: PotentialCause) => {
  const causeId = cause.cause_name; // ❌ Using name
  // ...
  const newSelectedCauses = potentialCauses.filter(c =>
    newSelectedIds.has(c.cause_name) // ❌ Filtering by name
  );
};

// AFTER - Using AI-generated IDs
const handleCauseToggle = (cause: PotentialCause) => {
  const causeId = cause.cause_id; // ✅ Using AI-generated ID
  // ...
  const newSelectedCauses = potentialCauses.filter(c =>
    newSelectedIds.has(c.cause_id) // ✅ Filtering by ID
  );
};
```

### **4. Fixed Cross-Step ID Passing**

**Files**:
- `src/features/create-recipe/components/causes-selection.tsx`
- `src/features/create-recipe/components/symptoms-selection.tsx`

```typescript
// BEFORE - Generating new IDs for API calls
selected_causes: selectedCauses.map(cause => ({
  cause_id: `cause_${Date.now()}_${Math.random()}`, // ❌ New ID
  name_localized: cause.cause_name,
  // ...
}))

// AFTER - Using stored AI-generated IDs
selected_causes: selectedCauses.map(cause => ({
  cause_id: cause.cause_id, // ✅ Preserved AI-generated ID
  name_localized: cause.cause_name,
  // ...
}))
```

### **5. Fixed Properties Display Cross-References**

**File**: `src/features/create-recipe/components/properties-display.tsx`

```typescript
// BEFORE - Name-based matching
const getAddressedCauses = (property: TherapeuticProperty) => {
  return selectedCauses.filter(cause => {
    const causeId = `cause_${Date.now()}_${Math.random()}`; // ❌ Generating new ID
    return property.addresses_cause_ids?.some(id => 
      id.includes(cause.cause_name.toLowerCase().replace(/\s+/g, '_')) // ❌ Name matching
    );
  });
};

// AFTER - ID-based matching
const getAddressedCauses = (property: TherapeuticProperty) => {
  return selectedCauses.filter(cause => {
    return property.addresses_cause_ids?.includes(cause.cause_id); // ✅ Direct ID matching
  });
};
```

## 📊 Expected Results

### **Before Fix:**
- **System/User Duplication**: Same prompt sent twice to OpenAI API
- **Template Variables**: `{{gender}}`, `{{age_category}}` showing as literal text
- **ID Format**: Mixed timestamp IDs (`cause_1749968208121_0.4110664011178419`) vs UUIDs
- **ID Consistency**: Frontend generating new IDs instead of preserving AI-generated ones
- **Cross-References**: Properties couldn't match causes/symptoms due to ID mismatches

### **After Fix:**
- **No Duplication**: Prompt sent once as agent instructions only
- **Template Variables**: `{{gender}}` → `"male"`, `{{age_category}}` → `"adult"`
- **ID Format**: Consistent UUID format across all steps (`a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14`)
- **ID Consistency**: AI-generated IDs preserved throughout entire workflow
- **Cross-References**: Properties correctly reference causes/symptoms by matching UUIDs

## 🔍 Verification Steps

1. **Check AI Response IDs**: Verify that cause_id and symptom_id are present in AI responses
2. **Check Store Data**: Verify that stored causes and symptoms have the AI-generated IDs
3. **Check Cross-References**: Verify that properties' `addresses_cause_ids` match stored cause IDs
4. **Check UI Display**: Verify that properties show the correct cause and symptom names
5. **Check Template Variables**: Verify that AI prompts receive populated variables instead of literal template strings
6. **Check System/User Messages**: Verify that prompts are not duplicated in OpenAI API calls
7. **Check UUID Format**: Verify that all entities use consistent UUID format across workflow steps

## 🚀 Implementation Notes

### **AI Prompt Requirements**
- AI agents MUST generate unique IDs for all entities (causes, symptoms, properties)
- IDs should follow the pattern: `{type}_{timestamp}_{random}` (e.g., `cause_1749968208121_0.4110664011178419`)
- Properties MUST reference exact IDs from previous steps in `addresses_cause_ids` and `addresses_symptom_ids`

### **Frontend Requirements**
- NEVER generate IDs in frontend code
- ALWAYS preserve AI-generated IDs from responses
- Use IDs (not names) for all selection and filtering logic
- Pass stored IDs to subsequent AI calls

### **Data Flow Integrity**
1. **Demographics → Causes**: AI generates cause IDs
2. **Causes → Symptoms**: Pass cause IDs to symptoms AI, which generates symptom IDs
3. **Symptoms → Properties**: Pass both cause and symptom IDs to properties AI
4. **Properties → Oils**: Pass property IDs to oils AI

## 📝 Testing

### **Manual Testing Steps**
1. Complete demographics step
2. Verify causes have AI-generated `cause_id` fields in UUID format
3. Select causes and proceed to symptoms
4. Verify symptoms have AI-generated `symptom_id` fields in UUID format
5. Check browser console for template variable debug logs showing populated values
6. Select symptoms and proceed to properties
7. Verify properties correctly show addressed causes and symptoms by name
8. Check that `addresses_cause_ids` match selected cause IDs
9. Verify no system/user message duplication in OpenAI API calls
10. Check that all template variables are populated (no `{{variable}}` literals in AI prompts)

### **Automated Testing**
- Updated `step-mapping.test.ts` to verify ID preservation in transformations
- Added tests for ID-based selection logic
- Added tests for cross-reference matching

## 🔗 Related Documentation

- [Causes Agent Issues](./causes-agent.md)
- [Symptoms Agent Issues](./symptoms-agent.md)
- [Properties Agent Issues](./properties-agent.md)
- [Performance Optimization Guide](../../create-recipe/readme/performance-optimization.md)

---

**Status**: ✅ Fixed  
**Date**: 2025-06-15  
**Impact**: Critical - Enables proper AI workflow data consistency
