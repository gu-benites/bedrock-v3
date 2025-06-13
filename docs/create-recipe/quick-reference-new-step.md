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

## 🚀 5-Minute Setup Checklist

### 1. Create Prompt File
📁 `src/features/create-recipe/prompts/prompt-for-{step-name}.md`

```yaml
---
model: gpt-4o-mini
temperature: 0.3
max_tokens: 4000
response_format: json
feature: create-recipe
step: {step-name}
description: "Brief description"
version: "1.0.0"
---

# Your Prompt Title

## Context
- Health Concern: {{healthConcern}}
- Demographics: {{demographics.gender}}, {{demographics.ageCategory}}
- Previous Data: {{previousStepData}}

## Response Format
```json
{
  "data": {
    "your_data_type": [
      {
        "id_field": "unique_id",
        "name_localized": "Display name",
        "description_localized": "Description"
      }
    ]
  }
}
```
```

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

```typescript
// Add to the PREVIOUS step component (the one that streams data for YOUR step)

import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

// Add AI streaming hook for YOUR step
const {
  startStream,
  partialData,
  isStreaming: isStreamingYourStep,
  isComplete: isYourStepComplete,
  finalData: yourStepFinalData,
  error: yourStepStreamingError
} = useAIStreaming({
  jsonArrayPath: 'data.your_data_type'
});

const [streamingItems, setStreamingItems] = useState<any[]>([]);
const hasNavigatedRef = useRef(false);

// Handle YOUR step streaming data updates
useEffect(() => {
  if (partialData && Array.isArray(partialData) && partialData.length > 0) {
    const transformed: YourDataType[] = partialData.map((item: any) => ({
      item_name: item.name_localized,
      description: item.description_localized
    }));

    setYourStepData(transformed); // Save to store

    const modalItems = partialData.map((item: any) => ({
      title: item.name_localized,
      subtitle: item.optional_field || 'Subtitle',
      description: item.description_localized,
      timestamp: new Date()
    }));
    setStreamingItems(modalItems);
  }
}, [partialData, setYourStepData]);

// Handle YOUR step streaming completion - Navigate to your step
useEffect(() => {
  if (isYourStepComplete && yourStepFinalData && !hasNavigatedRef.current) {
    console.log('✅ Your step streaming completed, navigating...');
    hasNavigatedRef.current = true;

    // Navigate to your step
    if (canGoNext()) {
      goToNext();
    }
  }
}, [isYourStepComplete, yourStepFinalData, canGoNext, goToNext]);

// Update onSubmit to start YOUR step streaming
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

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
    const requestData = {
      feature: 'create-recipe',
      step: 'your-step-name',
      data: {
        health_concern: healthConcern?.healthConcern || '',
        demographics: {
          gender: demographics?.gender,
          age_category: demographics?.ageCategory
        },
        selected_current_step_items: selectedCurrentStepItems.map(item => ({
          // Transform current step data for AI
        })),
        user_language: 'PT_BR'
      }
    };

    await startStream('/api/ai/streaming', requestData);

  } catch (error) {
    console.error('Failed to start your step streaming:', error);
    setError('Failed to analyze next step. Please try again.');
    hasNavigatedRef.current = false;
  }
};

// Add modal to JSX
<AIStreamingModal
  isOpen={isStreamingYourStep}
  title="AI Analysis in Progress"
  description="Analyzing your selections for the next step"
  items={streamingItems}
  onClose={() => console.log('User requested to close modal')}
  maxVisibleItems={100}
  analysisType="your-type"
/>
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

### ❌ Common Mistakes

1. **Missing `isComplete`** → Modal won't close
2. **Missing `analysisType`** → Hardcoded modal content
3. **Wrong data type config** → Streaming won't work
4. **Missing completion handler** → Poor UX

## 🧪 Testing Checklist

- [ ] Modal opens when analysis starts
- [ ] Real-time data appears in terminal
- [ ] Modal closes automatically when done
- [ ] Data saved to store correctly
- [ ] Navigation works to next step
- [ ] Error handling works
- [ ] Modal content is dynamic (not "Potential Causes")

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
