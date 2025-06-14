# Quick Reference: Adding New AI Streaming Step

## ⚠️ CRITICAL: Understand the Workflow Pattern First

**The AI streams data for the NEXT step while staying on the CURRENT step.**

```
Current Step → User clicks Continue → AI streams NEXT step data → Modal shows → Navigate to next step
```

**Example**: Symptoms step streams therapeutic properties data, then navigates to properties step.

**You need to modify TWO components**:
1. **Current step component**: Receives pre-loaded data from previous step
2. **Previous step component**: Streams data for your new step

## 🚨 **CRITICAL WARNINGS - READ FIRST**

### **❌ DO NOT Use React Hook Form with Local State**
```typescript
// ❌ WRONG - This will cause silent form submission failures
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const { handleSubmit } = useForm(); // Don't mix these!

// ✅ CORRECT - Choose ONE approach:
// Option 1: Pure local state (recommended for streaming steps)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const onSubmit = () => { /* direct function */ };

// Option 2: Pure react-hook-form (for simple forms only)
const { handleSubmit, register } = useForm();
// No local state management
```

### **❌ DO NOT Mix State Management Patterns**
```typescript
// ❌ WRONG - Mixed patterns cause modal display issues
const [isModalOpen, setIsModalOpen] = useState(false); // Local state
const { isStreamingProperties } = useRecipeStore(); // Store state
<AIStreamingModal isOpen={isStreamingProperties} /> // Using store state
// But partialData updates don't trigger modal updates!

// ✅ CORRECT Option 1: Store-based pattern (complex steps)
const { isStreamingProperties, setStreamingProperties } = useRecipeStore();
<AIStreamingModal isOpen={isStreamingProperties} />

// ✅ CORRECT Option 2: Hook-based pattern (simple steps)
const { isStreaming } = useAIStreaming();
<AIStreamingModal isOpen={isStreaming} />
```

### **❌ DO NOT Use Default Timeouts for Complex Analysis**
```typescript
// ❌ WRONG - 30s timeout for complex AI analysis
const { startStream } = useAIStreaming({
  jsonArrayPath: 'data.therapeutic_properties'
});

// ✅ CORRECT - Configure appropriate timeout
const { startStream } = useAIStreaming({
  jsonArrayPath: 'data.therapeutic_properties',
  timeout: 60000, // 60s for complex analysis
  maxRetries: 2
});
```

## 🚀 5-Minute Setup Checklist

### 1. Create Prompt File ⚠️ **YAML FORMAT REQUIRED**
📁 `/src/features/create-recipe/prompts/your-new-step.yaml`

**CRITICAL**: Must be `.yaml` file, not `.md`! Study existing prompts for exact format.

```yaml
version: "1.0.0"
description: "Brief description of what this step analyzes"
config:
  model: "gpt-4.1-nano"  # Use gpt-4.1-nano for create-recipe, NOT gpt-4o-mini
  temperature: 0.3
  max_tokens: 4000
  response_format: "json_schema"
  timeout_seconds: 60

template: |
  # Your Prompt Title

  You are an expert analyzing {{healthConcern}} for therapeutic recommendations.

  ## Context
  - Health Concern: {{health_concern}}
  - Demographics: {{demographics.gender}}, {{demographics.age_category}}
  - Previous Data: {{selected_previous_step_items}}

  ## Task
  Analyze the provided data and identify relevant items for the next step.

  ## Response Format
  Provide a structured JSON response following this exact schema:

  ```json
  {
    "data": {
      "your_data_type": [
        {
          "id_field": "unique_identifier",
          "name_localized": "Display name in user language",
          "description_localized": "Detailed description"
        }
      ]
    }
  }
  ```

schema:
  type: "object"
  properties:
    data:
      type: "object"
      properties:
        your_data_type:
          type: "array"
          items:
            type: "object"
            properties:
              id_field:
                type: "string"
              name_localized:
                type: "string"
              description_localized:
                type: "string"
            required: ["id_field", "name_localized", "description_localized"]
      required: ["your_data_type"]
  required: ["data"]
```

**⚠️ CRITICAL PROMPT REQUIREMENTS:**
- File must be `.yaml` extension
- Use `gpt-4.1-nano` model for create-recipe
- Include `timeout_seconds: 60` for complex analysis
- Template variables must match request data structure
- Schema must match exact response format expected

### 2. Add Data Type Configuration
📁 `src/lib/ai/config/streaming-data-types.ts`

```typescript
// Add to STREAMING_DATA_TYPES object:
your_data_type: {
  idField: 'id_field',
  requiredFields: ['name_localized', 'description_localized'],
  minLengths: { name_localized: 5, description_localized: 15 },
  optionalFields: ['optional_field1', 'optional_field2'],
  displayName: 'Your Display Name'
}
```

### 3A. Create Current Step Component (Receives Pre-loaded Data)
📁 `src/features/create-recipe/components/{step-name}-selection.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';

interface YourDataType {
  item_name: string;
  description: string;
  // ... other fields
}

export function YourStepSelection() {
  const {
    // Previous step data
    healthConcern,
    demographics,
    previousStepData,

    // Current step data (pre-loaded from previous step)
    yourStepData,
    selectedItems,
    updateSelectedItems,

    // UI state
    markCurrentStepCompleted,
    setError,
    clearError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious } = useRecipeWizardNavigation();

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // 🚨 CRITICAL: Check for pre-loaded data (data comes from previous step)
  useEffect(() => {
    // Check if we have required data
    if (!healthConcern || !demographics || !previousStepData?.length) {
      return;
    }

    // Data should already be loaded from previous step
    // If not available, show message to go back
    if (yourStepData.length === 0) {
      setError('Data not found. Please go back to the previous step to generate them.');
      return;
    }

    clearError();
  }, [healthConcern, demographics, previousStepData?.length, yourStepData.length, setError, clearError]);

  // Handle item selection
  const handleItemToggle = (item: YourDataType) => {
    const newSelectedIds = new Set(selectedItemIds);
    const itemId = item.item_name;

    if (newSelectedIds.has(itemId)) {
      newSelectedIds.delete(itemId);
    } else {
      newSelectedIds.add(itemId);
    }

    setSelectedItemIds(newSelectedIds);

    // Update store with selected items
    const newSelectedItems = yourStepData.filter(item =>
      newSelectedIds.has(item.item_name)
    );
    updateSelectedItems(newSelectedItems);

    // Mark step as completed if at least one item is selected
    if (newSelectedItems.length > 0) {
      markCurrentStepCompleted();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItemIds.size === 0) {
      setError('Please select at least one item.');
      return;
    }

    if (canGoNext()) {
      await goToNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Display pre-loaded data for selection */}
      <form onSubmit={onSubmit}>
        {yourStepData.map((item, index) => (
          <div key={index} onClick={() => handleItemToggle(item)}>
            {/* Item selection UI */}
          </div>
        ))}

        <button type="submit" disabled={selectedItemIds.size === 0}>
          Continue →
        </button>
      </form>
    </div>
  );
}
```

### 3B. Update Previous Step Component (Streams Next Step Data)
📁 `src/features/create-recipe/components/{previous-step}-selection.tsx`

**⚠️ CRITICAL PATTERN CHOICE**: Choose the correct streaming pattern based on your step:

#### **Pattern A: Hook-Based Streaming (Recommended for Most Cases)**
Use for consistent state management between modal control and data updates:

```typescript
// ✅ CORRECT - Hook-based pattern (like suggested oils)
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

// Configure AI streaming with appropriate timeout
const {
  partialData,
  isStreaming,
  isComplete,
  finalData,
  error: streamingError,
  startStream,
  resetStream
} = useAIStreaming({
  jsonArrayPath: 'data.your_data_type',
  timeout: 90000, // 90s for complex analysis
  maxRetries: 2
});

// ✅ CRITICAL: Clear previous data before starting new analysis
const handleAnalyze = async () => {
  resetStream(); // Clear any previous streaming data
  await startStream('/api/ai/streaming', requestData);
};

// ✅ CRITICAL: Use hook's streaming state for modal control
<AIStreamingModal
  isOpen={isStreaming}  // ← Hook state, not store state
  analysisType="your-type"
/>

// Handle progressive data updates
useEffect(() => {
  if (partialData && Array.isArray(partialData) && partialData.length > 0) {
    const modalItems = partialData.map((item: any, index: number) => ({
      id: `item-${item.id_field || index}`,
      title: item.name_localized,
      subtitle: item.optional_field,
      description: item.description_localized,
      timestamp: new Date()
    }));
    setStreamingItems(modalItems);
  }
}, [partialData]);

// Completion handling (modal closes automatically when isStreaming becomes false)
useEffect(() => {
  if (isComplete && finalData) {
    console.log('Analysis completed successfully');
    // Modal closes automatically when isStreaming becomes false
  }
}, [isComplete, finalData]);
```

#### **Pattern B: Store-Based Streaming (For Complex Workflows)**
Use when you need robust error handling and state management:

```typescript
// ✅ CORRECT - Store-based pattern (like therapeutic properties)
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

// Get store streaming state
const {
  isStreamingYourStep,
  setStreamingYourStep,
  setYourStepData
} = useRecipeStore();

// Configure AI streaming with appropriate timeout
const {
  startStream,
  partialData,
  isStreaming: isStreamingData,
  isComplete: isYourStepComplete,
  finalData: yourStepFinalData,
  error: yourStepStreamingError
} = useAIStreaming({
  jsonArrayPath: 'data.your_data_type',
  timeout: 60000, // 60s for complex analysis
  maxRetries: 2
});

const hasNavigatedRef = useRef(false);

// ✅ CRITICAL: Sync streaming state with store
useEffect(() => {
  setStreamingYourStep(isStreamingData);
}, [isStreamingData, setStreamingYourStep]);

// ✅ CRITICAL: Handle streaming errors
useEffect(() => {
  if (yourStepStreamingError) {
    console.error('Streaming error:', yourStepStreamingError);
    setError(`Failed to analyze: ${yourStepStreamingError}`);
    setStreamingYourStep(false);
    hasNavigatedRef.current = false;
  }
}, [yourStepStreamingError, setError, setStreamingYourStep]);

// Handle YOUR step streaming data updates
useEffect(() => {
  if (partialData && Array.isArray(partialData) && partialData.length > 0) {
    console.log('📥 Received streaming data:', partialData.length, 'items');

    const transformed: YourDataType[] = partialData.map((item: any) => ({
      item_name: item.name_localized,
      description: item.description_localized
    }));

    setYourStepData(transformed); // Save to store
  }
}, [partialData, setYourStepData]);

// ✅ CRITICAL: Handle streaming completion - Stop streaming and navigate
useEffect(() => {
  if (isYourStepComplete && yourStepFinalData && !hasNavigatedRef.current) {
    console.log('✅ Your step streaming completed, navigating...');
    hasNavigatedRef.current = true;

    // Stop streaming state
    setStreamingYourStep(false);

    // Navigate to your step after short delay to ensure state is updated
    setTimeout(() => {
      if (canGoNext()) {
        goToNext();
      }
    }, 100);
  }
}, [isYourStepComplete, yourStepFinalData, canGoNext, goToNext, setStreamingYourStep]);

// ✅ CRITICAL: Update onSubmit - NO REACT HOOK FORM!
const onSubmit = async () => {  // ← No event parameter for direct button onClick
  // Validate current step
  if (selectedCurrentStepItems.length === 0) {
    setError('Please select at least one item.');
    return;
  }

  try {
    markCurrentStepCompleted();
    clearError();
    hasNavigatedRef.current = false;

    // Start YOUR step streaming (stay on current page)
    setStreamingYourStep(true);  // ← Set store streaming state

    const requestData = {
      feature: 'create-recipe',
      step: 'your-step-name',
      data: {
        health_concern: healthConcern?.healthConcern || '',
        demographics: {
          gender: demographics?.gender,
          age_category: demographics?.ageCategory,
          age_specific: demographics?.specificAge?.toString()
        },
        selected_current_step_items: selectedCurrentStepItems.map(item => ({
          // Transform current step data for AI - use exact field names from prompt
          item_id: `item_${Date.now()}_${Math.random()}`,
          name_localized: item.item_name,
          description_localized: item.description
        })),
        user_language: 'PT_BR'
      }
    };

    console.log('🚀 Starting streaming with data:', requestData);
    await startStream('/api/ai/streaming', requestData);

  } catch (error) {
    console.error('Failed to start streaming:', error);
    setError('Failed to analyze next step. Please try again.');
    setStreamingYourStep(false);  // ← Reset store streaming state
    hasNavigatedRef.current = false;
  }
};

// ✅ CRITICAL: Add modal to JSX - Use store streaming state
<AIStreamingModal
  isOpen={isStreamingYourStep}  // ← Store state, not local state
  title="AI Analysis in Progress"
  description="Analyzing your selections for the next step"
  items={yourStepData.map((item, index) => ({  // ← Use store data directly
    id: `item-${index}-${item.item_name?.slice(0, 10) || 'unknown'}`,
    title: item.item_name || `Item ${index + 1}`,
    subtitle: item.optional_field || 'Item description',
    description: item.description || '',
    timestamp: new Date()
  }))}
  onClose={() => console.log('User requested to close modal')}
  maxVisibleItems={100}
  analysisType="your-type"  // ← Must match your step type
/>

// ✅ CRITICAL: Button must use direct onClick, not form submission
<button
  type="button"  // ← NOT "submit"
  onClick={onSubmit}  // ← Direct function call
  disabled={!isFormValid || isLoading}
  className="px-6 py-2 bg-primary text-primary-foreground rounded-md"
>
  {isStreamingYourStep ? 'Analyzing...' : 'Continue →'}
</button>
```

### 4. Update Store
📁 `src/features/create-recipe/store/recipe-store.ts`

```typescript
interface RecipeState {
  // Add your step data
  yourStepData: YourDataType[];
  selectedYourStepItems: YourDataType[];
  isStreamingYourStep: boolean;
}

interface RecipeActions {
  // Add your step actions
  setYourStepData: (data: YourDataType[]) => void;
  updateSelectedYourStepItems: (items: YourDataType[]) => void;
  setStreamingYourStep: (streaming: boolean) => void;
}

// In the store implementation:
const useRecipeStore = create<RecipeState & RecipeActions>((set) => ({
  // State
  yourStepData: [],
  selectedYourStepItems: [],
  isStreamingYourStep: false,
  
  // Actions
  setYourStepData: (data) => set({ yourStepData: data }),
  updateSelectedYourStepItems: (items) => set({ selectedYourStepItems: items }),
  setStreamingYourStep: (streaming) => set({ isStreamingYourStep: streaming }),
}));
```

## 🔥 Critical Success Factors

### ✅ Must-Have Patterns

1. **Always include `isComplete` and `finalData`**:
```typescript
const { startStream, partialData, isStreaming, isComplete, finalData } = useAIStreaming({
  jsonArrayPath: 'data.your_data_type'
});
```

2. **Always handle completion to close modal**:
```typescript
useEffect(() => {
  if (isComplete && finalData) {
    setIsModalOpen(false);  // ← Auto-close modal
  }
}, [isComplete, finalData]);
```

3. **Always set `analysisType` on modal**:
```typescript
<AIStreamingModal
  analysisType="your-type"  // ← Makes modal dynamic
  // ... other props
/>
```

4. **Always mark step as completed**:
```typescript
useEffect(() => {
  if (selectedItems.length > 0) {
    markCurrentStepCompleted();  // ← Enable navigation
  }
}, [selectedItems, markCurrentStepCompleted]);
```

### ❌ Common Mistakes & Fixes

#### **1. Silent Form Submission Failure**
**Problem**: Button click doesn't trigger AI streaming
**Cause**: React Hook Form + local state conflict
**Fix**: Remove react-hook-form, use direct button onClick

#### **2. Controller Closure Errors**
**Problem**: "Controller is already closed" in backend logs
**Cause**: Local modal state management + timeout issues
**Fix**: Use store-based streaming state + increase timeout

#### **3. Modal Won't Close**
**Problem**: Modal stays open after streaming completes
**Cause**: Missing `isComplete` handling
**Fix**: Add completion effect to stop streaming state

#### **4. Hardcoded Modal Content**
**Problem**: Modal shows wrong analysis type
**Cause**: Missing `analysisType` prop
**Fix**: Set correct `analysisType` on modal

#### **5. Prompt Not Found**
**Problem**: API returns "Prompt not found"
**Cause**: Wrong file format or location
**Fix**: Use `.yaml` file in correct directory

#### **6. Timeout Errors**
**Problem**: Streaming fails after 30 seconds
**Cause**: Default timeout too short for complex analysis
**Fix**: Set `timeout: 60000` in useAIStreaming config

## 🧪 **COMPREHENSIVE VALIDATION CHECKLIST**

### **📋 Pre-Implementation Checklist**
- [ ] Studied existing working steps (demographics, causes, symptoms)
- [ ] Chosen correct streaming pattern (store-based vs hook-based)
- [ ] Determined appropriate timeout for analysis complexity
- [ ] Verified prompt file format and location requirements

### **🔧 Implementation Checklist**
- [ ] Created `.yaml` prompt file (not `.md`)
- [ ] Used `gpt-4.1-nano` model in prompt config
- [ ] Added data type configuration to streaming-data-types.ts
- [ ] Used store-based streaming state (not local modal state)
- [ ] Configured appropriate timeout in useAIStreaming
- [ ] Added error handling for streaming failures
- [ ] Removed react-hook-form if using local state management
- [ ] Set correct `analysisType` on AIStreamingModal
- [ ] Added completion handler to stop streaming state

### **🧪 Testing Checklist**
- [ ] Button click triggers AI streaming (check console logs)
- [ ] Modal opens with correct title and analysis type
- [ ] Real-time data appears in modal terminal
- [ ] Modal closes automatically when streaming completes
- [ ] Data saved to store correctly
- [ ] Navigation works to next step
- [ ] Error handling works (network failures, timeout)
- [ ] No "Controller is already closed" errors in backend
- [ ] Modal content is dynamic (not hardcoded)
- [ ] Timeout sufficient for analysis complexity

### **🔍 Debug Checklist (If Issues Occur)**
- [ ] Check browser console for JavaScript errors
- [ ] Check network tab for API request/response
- [ ] Check backend logs for streaming errors
- [ ] Verify prompt file can be loaded by prompt manager
- [ ] Test with shorter timeout to isolate timeout issues
- [ ] Verify data type configuration matches AI response
- [ ] Check store state updates in React DevTools

## 🎯 **STREAMING PATTERN DECISION TREE**

### **When to Use Store-Based Pattern (Recommended)**
✅ **Use for complex AI analysis steps like therapeutic properties**
- Analysis takes >30 seconds
- Need consistent error handling
- Multiple components need streaming state
- Want seamless user experience

**Example**: Therapeutic properties, essential oils recommendations

### **When to Use Hook-Based Pattern**
✅ **Use for simpler analysis steps**
- Analysis takes <30 seconds
- Self-contained component
- Simple error handling sufficient

**Example**: Quick symptom analysis, simple data transformations

### **Pattern Comparison**

| Aspect | Store-Based | Hook-Based |
|--------|-------------|------------|
| State Management | `isStreamingProperties` in store | `isStreaming` from hook |
| Modal Control | `<AIStreamingModal isOpen={isStreamingProperties} />` | `<AIStreamingModal isOpen={isModalOpen} />` |
| Error Handling | Centralized in store | Local component handling |
| Timeout Config | Required (60s+) | Default (30s) usually OK |
| Complexity | Higher setup | Simpler setup |
| Reliability | More robust | Basic functionality |

## 🎯 Available Analysis Types

- `"causes"` → "Potential Causes Analysis"
- `"symptoms"` → "Potential Symptoms Analysis"
- `"properties"` → "Therapeutic Properties Analysis"
- `"oils"` → "Essential Oils Analysis"

Add new types by updating the `getDefaultContent()` function in `AIStreamingModal`.

## 📚 Full Documentation

For complete details, see: `docs/create-recipe/adding-new-ai-streaming-steps.md`

## 🎯 Correct Workflow Pattern

**IMPORTANT**: Follow the demographics → causes pattern exactly:

```
Demographics → Click Continue → AI streams causes → Modal shows → Navigate to causes ✅
Causes → Select causes → Click Continue → AI streams symptoms → Modal shows → Navigate to symptoms ✅
Symptoms → Select symptoms → Click Continue → AI streams next step → Modal shows → Navigate to next ✅
```

### ✅ Correct Pattern:
1. **User clicks Continue** on current step
2. **Save data** and mark step completed
3. **Start AI streaming** for NEXT step (stay on current page)
4. **Show modal** with streaming progress
5. **When complete** → Navigate to next step

### ❌ Wrong Pattern:
1. User clicks Continue
2. Navigate to next step immediately
3. Auto-load data on next step mount ← **This breaks UX flow**

**Key**: The AI streams the data for the NEXT step while staying on the CURRENT step, just like demographics does for causes.

---

**🚀 Ready to add your new step? Follow this checklist and you'll have a working AI streaming step in 5 minutes!**
