# Debugging AI Streaming Data Flow Issues

## Overview

This document provides comprehensive debugging approaches for AI streaming data flow problems in the create-recipe workflow, based on real implementation challenges and solutions.

## Critical Issues and Solutions

### Issue 1: Relevancy Scores Showing 0/5 Instead of Actual Values

**Problem**: AI response contains correct `relevancy_score` values (5, 4, 3, 2), but frontend displays "0/5" for all properties.

**Root Cause**: Properties processed from `partialData` during streaming instead of `finalData` at completion, losing critical fields.

**Debugging Pattern**:
```javascript
// ✅ Log raw AI response to verify fields exist
useEffect(() => {
  if (propertiesPartialData) {
    console.log('📥 RAW PROPERTIES PARTIAL DATA:', propertiesPartialData);
  }
}, [propertiesPartialData]);

useEffect(() => {
  if (isComplete && finalData) {
    console.log('✅ RAW PROPERTIES FINAL DATA:', finalData);
  }
}, [isComplete, finalData]);

// ✅ Verify field mapping during transformation
const transformedProperties = propertiesPartialData.map((property, index) => {
  console.log(`🔄 Transforming property ${index}:`, {
    allOriginalFields: Object.keys(property),
    relevancy_score: property.relevancy_score,
    typeof_relevancy_score: typeof property.relevancy_score,
    fullOriginalProperty: property
  });
  
  return {
    // CRITICAL: Preserve ALL AI response fields
    relevancy_score: property.relevancy_score, // Keep original
    relevancy: property.relevancy_score, // Map for compatibility
  };
});
```

**Solution**: Dual data processing pattern
```javascript
// Process both partial data (for streaming) AND final data (for completeness)
useEffect(() => {
  if (propertiesPartialData && Array.isArray(propertiesPartialData)) {
    const transformedProperties = propertiesPartialData.map(property => ({
      property_id: property.property_id,
      relevancy_score: property.relevancy_score,
      relevancy: property.relevancy_score
    }));
    updateTherapeuticProperties(transformedProperties);
  }
}, [propertiesPartialData]);

// CRITICAL: Also process final data to ensure completeness
useEffect(() => {
  if (isComplete && finalData) {
    let finalProperties = [];
    
    if (Array.isArray(finalData)) {
      finalProperties = finalData.map(property => ({ /* complete mapping */ }));
    } else if (finalData.data?.therapeutic_properties) {
      finalProperties = finalData.data.therapeutic_properties.map(property => ({ /* complete mapping */ }));
    }
    
    if (finalProperties.length > 0) {
      updateTherapeuticProperties(finalProperties);
    }
  }
}, [isComplete, finalData]);
```

### Issue 2: Cross-References Not Displaying in Property Cards

**Problem**: AI response includes `addresses_cause_ids` and `addresses_symptom_ids` arrays, but frontend shows empty cross-reference sections.

**Root Cause**: ID mismatch between IDs sent to AI and IDs stored in frontend, preventing proper cross-reference matching.

**Debugging Pattern**:
```javascript
// ✅ Verify ID consistency before sending to AI
const requestData = {
  feature: 'create-recipe',
  step: 'therapeutic-properties',
  data: {
    selected_causes: selectedCauses.map(cause => ({
      cause_id: cause.cause_id, // Use stored ID, not generated fallback
      name_localized: cause.cause_name
    }))
  }
};

console.log('🚀 CRITICAL DEBUG - IDs being sent to AI:', {
  selectedCausesStored: selectedCauses.map(c => ({ 
    cause_id: c.cause_id, 
    cause_name: c.cause_name 
  })),
  causesBeingSent: requestData.data.selected_causes
});

// ✅ Debug cross-reference matching
const getAddressedCauses = (property) => {
  console.log('🔍 getAddressedCauses debug:', {
    property_id: property.property_id,
    addresses_cause_ids: property.addresses_cause_ids,
    selectedCauseIds: selectedCauses.map(c => c.cause_id)
  });
  
  const matchedCauses = selectedCauses.filter(cause => {
    const isMatch = property.addresses_cause_ids?.includes(cause.cause_id);
    console.log(`🔍 Checking cause match: ${cause.cause_name} (${cause.cause_id}) -> ${isMatch}`);
    return isMatch;
  });
  
  console.log(`✅ Found ${matchedCauses.length} matching causes`);
  return matchedCauses;
};
```

**Solution**: Ensure ID consistency throughout pipeline
```javascript
// ❌ WRONG - Creates different IDs
selected_causes: selectedCauses.map(cause => ({
  cause_id: cause.cause_id || `cause_${Date.now()}_${Math.random()}`, // Fallback creates new ID
  name_localized: cause.cause_name
}))

// ✅ CORRECT - Uses consistent stored IDs
selected_causes: selectedCauses.map(cause => ({
  cause_id: cause.cause_id, // Use the AI-generated ID from storage
  name_localized: cause.cause_name
}))
```

## Effective Debugging Patterns

### 1. Raw Data Logging
```javascript
// Always log raw AI responses to see exactly what's returned
console.log('📥 RAW PROPERTIES PARTIAL DATA:', propertiesPartialData);
console.log('✅ RAW PROPERTIES FINAL DATA:', finalData);
```

### 2. Field Mapping Analysis
```javascript
// Show ALL fields in AI response to identify missing mappings
console.log(`🔄 Transforming property ${index}:`, {
  allOriginalFields: Object.keys(property),
  fullOriginalProperty: property,
  // Specific field checks
  relevancy_score: property.relevancy_score,
  addresses_cause_ids: property.addresses_cause_ids
});
```

### 3. ID Consistency Verification
```javascript
// Compare IDs being sent to AI vs stored IDs
console.log('🚀 CRITICAL DEBUG - IDs being sent to AI:', {
  storedData: storedItems.map(item => ({ id: item.id, name: item.name })),
  sentData: requestData.data.items.map(item => ({ id: item.id, name: item.name }))
});
```

### 4. Cross-Reference Validation
```javascript
// Debug ID matching for cross-references with detailed logging
const matchedItems = storedItems.filter(item => {
  const isMatch = property.addresses_item_ids?.includes(item.id);
  console.log(`🔍 Checking match: ${item.name} (${item.id}) -> ${isMatch}`);
  return isMatch;
});
```

## Prevention Guidelines

1. **Always Process Final Data**: Don't rely solely on partial streaming data
2. **Preserve All AI Fields**: Map both original field names and compatibility aliases
3. **Verify ID Consistency**: Ensure same IDs used throughout entire pipeline
4. **Comprehensive Logging**: Add detailed debugging for data transformation steps
5. **Field Validation**: Check that all expected AI response fields are present after transformation

## Debug Log Patterns

### Good Patterns (Working)
```javascript
🔄 Transforming property 0: {
  relevancy_score: 5,
  addresses_cause_ids: ["a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14"],
  allOriginalFields: ["property_id", "property_name_localized", "relevancy_score", ...]
}

🔍 Checking cause match: Dietary changes (a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14) -> true
✅ Found 2 matching causes for property Propriedades calmantes
```

### Bad Patterns (Broken)
```javascript
🔄 Transforming property 0: {
  relevancy_score: undefined,
  addresses_cause_ids: [],
  allOriginalFields: ["property_name", "description"] // Missing fields
}

🔍 Checking cause match: Dietary changes (a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14) -> false
❌ No addresses_cause_ids found for property
```

## Implementation Checklist

### Before Implementation
- [ ] Verify AI response structure matches expected schema
- [ ] Check that all required fields are included in transformation
- [ ] Ensure ID consistency throughout the pipeline
- [ ] Configure appropriate timeouts for analysis complexity

### During Debugging
- [ ] Log raw AI response data (`📥 RAW DATA`)
- [ ] Verify field mapping (`🔄 Transforming`)
- [ ] Check ID consistency (`🚀 CRITICAL DEBUG`)
- [ ] Validate cross-reference matching (`🔍 Cross-reference debug`)
- [ ] Confirm final data processing (`✅ Found X matching`)

### After Implementation
- [ ] Test with real AI responses (not mock data)
- [ ] Verify all fields display correctly in UI
- [ ] Test cross-reference functionality
- [ ] Validate error handling and edge cases

This debugging approach ensures robust AI streaming data flow and prevents common field preservation and ID consistency issues.
