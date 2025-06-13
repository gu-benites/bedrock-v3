# Adding New AI Streaming Steps to Create-Recipe Workflow

## ⚠️ CRITICAL: Understand the Workflow Pattern First

**The AI streams data for the NEXT step while staying on the CURRENT step.**

This is the ONLY correct pattern used throughout the create-recipe workflow:

```
Demographics → Click Continue → AI streams causes → Modal shows → Navigate to causes ✅
Causes → Click Continue → AI streams symptoms → Modal shows → Navigate to symptoms ✅
Symptoms → Click Continue → AI streams properties → Modal shows → Navigate to properties ✅
```

**Key Principle**: When adding a new step, you modify the PREVIOUS step to stream your data, not your step to auto-load data.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
3. [Code Examples](#code-examples)
4. [Testing Guidelines](#testing-guidelines)
5. [Common Pitfalls and Troubleshooting](#common-pitfalls-and-troubleshooting)

## Architecture Overview

### Create-Recipe Workflow Architecture

The create-recipe workflow follows a linear, step-by-step pattern with **seamless AI streaming integration**:

```
Health Concern → Demographics → Potential Causes → Symptoms → [New Step] → Recipe
```

#### Seamless User Experience:
- **No manual AI trigger buttons** - Analysis starts automatically when navigating to a step
- **Continuous flow** - Users never have to manually request AI analysis
- **Progressive disclosure** - Each step builds on the previous step's data automatically

#### Key Components:
- **Store**: `src/features/create-recipe/store/recipe-store.ts` - Zustand store for state management
- **Navigation**: `src/features/create-recipe/hooks/use-recipe-navigation.ts` - Step navigation logic
- **Components**: `src/features/create-recipe/components/` - Individual step components
- **AI Streaming**: Generic infrastructure for real-time AI data processing

#### Expected Workflow Behavior:
```
Demographics Form → Click Continue → AI streams causes → Modal shows → Navigate to causes
                                                                            ↓
Causes Page → Select causes → Click Continue → AI streams symptoms → Modal shows → Navigate to symptoms
                                                                                        ↓
Symptoms Page → Select symptoms → Click Continue → AI streams next step → Modal shows → Navigate to next
```

**Key Pattern**: User clicks Continue → AI streams NEXT step data → Modal shows → Auto-navigate when complete

#### Data Flow:
1. User completes a step → Data saved to store → Mark step completed
2. User clicks Continue → AI streams NEXT step data → Streaming modal opens (stay on current page)
3. AI streams structured data → Real-time UI updates in modal
4. Streaming completes → Modal closes automatically → Navigate to next step with pre-loaded data

### AI Streaming Infrastructure

```
API Route (/api/ai/streaming) ← OpenAI Agents JS SDK
    ↓
useAIStreaming Hook ← SSE Connection
    ↓
AIStreamingModal ← Real-time Updates
    ↓
Step Component ← Processed Data
```

#### Core Files:
- **API Route**: `src/app/api/ai/streaming/route.ts` - Generic streaming endpoint
- **Hook**: `src/lib/ai/hooks/use-ai-streaming.ts` - Reusable streaming logic
- **Modal**: `src/components/ui/ai-streaming-modal.tsx` - Dynamic streaming UI
- **Config**: `src/lib/ai/config/streaming-data-types.ts` - Data type definitions

## Step-by-Step Implementation Guide

### A. Prompt Management

#### 1. Prompt File Location
Place feature-specific prompts in:
```
src/features/create-recipe/prompts/
├── prompt-for-potential-causes.md
├── prompt-for-potential-symptoms.md
└── prompt-for-therapeutic-properties.md  ← New step
```

#### 2. YAML Prompt Structure
Create `prompt-for-therapeutic-properties.md`:

```yaml
---
# AI Configuration
model: gpt-4.1-nano
temperature: 0.3
max_tokens: 4000
response_format: json

# Prompt Metadata
feature: create-recipe
step: therapeutic-properties
description: "Analyze symptoms to identify relevant therapeutic properties"
version: "1.0.0"
---

# Therapeutic Properties Analysis

You are an expert aromatherapist analyzing symptoms to identify therapeutic properties that essential oils should have to address the user's health concerns.

## Context
- Health Concern: {{healthConcern}}
- User Demographics: {{demographics.gender}}, {{demographics.ageCategory}}
- Selected Symptoms: {{selectedSymptoms}}

## Task
Analyze the provided symptoms and identify 8-12 therapeutic properties that essential oils should possess to effectively address these symptoms.

## Response Format
Return a JSON object with this exact structure:

```json
{
  "data": {
    "therapeutic_properties": [
      {
        "property_id": "unique_identifier",
        "name_localized": "Property name in user's language",
        "description_localized": "Detailed description of how this property helps",
        "relevancy": 0.95,
        "symptoms_addressed": ["symptom1", "symptom2"],
        "mechanism": "How this property works therapeutically"
      }
    ]
  }
}
```

## Guidelines
- Focus on evidence-based therapeutic properties
- Ensure each property directly addresses at least one selected symptom
- Provide clear, actionable descriptions
- Use appropriate language for the user's demographics
- Include relevancy scores (0.0-1.0) based on symptom match
```

#### 3. Prompt Template Variables
Available variables for substitution:
- `{{healthConcern}}` - User's main health concern
- `{{demographics.gender}}` - User's gender
- `{{demographics.ageCategory}}` - User's age category
- `{{selectedSymptoms}}` - Array of selected symptoms
- `{{selectedCauses}}` - Array of selected causes (for symptoms step)

### B. Data Type Configuration

Add new data type to `src/lib/ai/config/streaming-data-types.ts`:

```typescript
export const STREAMING_DATA_TYPES: Record<string, DataTypeConfig> = {
  // ... existing types ...
  
  therapeutic_properties: {
    idField: 'property_id',
    requiredFields: ['name_localized', 'description_localized'],
    minLengths: { 
      name_localized: 5, 
      description_localized: 15 
    },
    optionalFields: ['relevancy', 'symptoms_addressed', 'mechanism'],
    displayName: 'Therapeutic Property'
  }
};
```

#### Configuration Options:
- **idField**: Unique identifier field name
- **requiredFields**: Fields that must be present and non-empty
- **minLengths**: Minimum character lengths for validation
- **optionalFields**: Fields to include if present in AI response
- **displayName**: Human-readable name for logging and UI

### C. Component Implementation

**CRITICAL**: You need to implement TWO components for each new step:

1. **Current Step Component**: Receives and displays pre-loaded data
2. **Previous Step Component**: Modified to stream data for your new step

#### C1. Current Step Component (Receives Pre-loaded Data)

Create `src/features/create-recipe/components/therapeutic-properties.tsx`:

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';

interface TherapeuticProperty {
  property_name: string;
  description: string;
  relevancy?: number;
}

export function TherapeuticPropertiesSelection() {
  const {
    healthConcern,
    demographics,
    selectedSymptoms,
    therapeuticProperties, // Pre-loaded from symptoms step
    selectedProperties,
    updateSelectedProperties,
    markCurrentStepCompleted,
    setError,
    clearError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious } = useRecipeWizardNavigation();
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());

  // Check for pre-loaded data (data comes from previous step)
  useEffect(() => {
    if (!healthConcern || !demographics || selectedSymptoms.length === 0) {
      return;
    }

    // Properties should already be loaded from symptoms step
    if (therapeuticProperties.length === 0) {
      setError('Therapeutic properties not found. Please go back to the symptoms step.');
      return;
    }

    clearError();
  }, [healthConcern, demographics, selectedSymptoms.length, therapeuticProperties.length, setError, clearError]);

  // Handle property selection
  const handlePropertyToggle = (property: TherapeuticProperty) => {
    const newSelectedIds = new Set(selectedPropertyIds);
    const propertyId = property.property_name;

    if (newSelectedIds.has(propertyId)) {
      newSelectedIds.delete(propertyId);
    } else {
      newSelectedIds.add(propertyId);
    }

    setSelectedPropertyIds(newSelectedIds);

    const newSelectedProperties = therapeuticProperties.filter(p =>
      newSelectedIds.has(p.property_name)
    );
    updateSelectedProperties(newSelectedProperties);

    if (newSelectedProperties.length > 0) {
      markCurrentStepCompleted();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPropertyIds.size === 0) {
      setError('Please select at least one therapeutic property.');
      return;
    }

    if (canGoNext()) {
      await goToNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Display pre-loaded properties for selection */}
      <form onSubmit={onSubmit}>
        {therapeuticProperties.map((property, index) => (
          <div key={index} onClick={() => handlePropertyToggle(property)}>
            {/* Property selection UI */}
          </div>
        ))}

        <button type="submit" disabled={selectedPropertyIds.size === 0}>
          Continue →
        </button>
      </form>
    </div>
  );
}
```

#### C2. Previous Step Component (Modified to Stream Your Data)

Modify `src/features/create-recipe/components/symptoms-selection.tsx`:

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain } from 'lucide-react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';
import { cn } from '@/lib/utils';

// Define the data interface
interface TherapeuticProperty {
  property_name: string;
  description: string;
  relevancy?: number;
  symptoms_addressed?: string[];
  mechanism?: string;
}

// Form validation schema
const propertiesSchema = z.object({
  selectedProperties: z.array(z.string()).min(1, 'Select at least one property')
});

type PropertiesFormData = z.infer<typeof propertiesSchema>;

export function TherapeuticPropertiesSelection() {
  // Store state
  const {
    healthConcern,
    demographics,
    selectedSymptoms,
    therapeuticProperties,
    setTherapeuticProperties,
    selectedProperties,
    updateSelectedProperties,
    error,
    setError,
    clearError,
    isLoading,
    setStreamingProperties,
    markCurrentStepCompleted
  } = useRecipeStore();

  // Navigation
  const {
    canGoPrevious,
    canGoNext,
    goToPrevious,
    goToNext
  } = useRecipeWizardNavigation();

  // Local state
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamingItems, setStreamingItems] = useState<any[]>([]);

  // AI Streaming setup - CRITICAL: Include isComplete and finalData
  const { 
    startStream, 
    partialData, 
    isStreaming, 
    isComplete, 
    finalData, 
    error: streamingError 
  } = useAIStreaming({
    jsonArrayPath: 'data.therapeutic_properties'
  });

  // Form setup
  const { handleSubmit, formState: { isValid } } = useForm<PropertiesFormData>({
    resolver: zodResolver(propertiesSchema),
    mode: 'onChange'
  });

  /**
   * Handle streaming data updates - Transform properties data
   */
  useEffect(() => {
    if (partialData && Array.isArray(partialData) && partialData.length > 0) {
      console.log('📥 Received streaming properties:', partialData.length, 'total');

      // Transform to match TherapeuticProperty interface
      const transformedProperties: TherapeuticProperty[] = partialData.map((property: any) => ({
        property_name: property.name_localized,
        description: property.description_localized,
        relevancy: property.relevancy,
        symptoms_addressed: property.symptoms_addressed,
        mechanism: property.mechanism
      }));

      setTherapeuticProperties(transformedProperties);

      // Transform for modal display
      const modalItems = partialData.map((property: any) => ({
        title: property.name_localized,
        subtitle: property.mechanism || 'Therapeutic mechanism',
        description: property.description_localized,
        timestamp: new Date()
      }));
      setStreamingItems(modalItems);
    }
  }, [partialData, setTherapeuticProperties]);

  /**
   * CRITICAL: Handle streaming completion - Close modal automatically
   */
  useEffect(() => {
    if (isComplete && finalData) {
      console.log('✅ Properties streaming completed with final data:', finalData);
      
      // Close modal automatically when streaming is complete
      setIsModalOpen(false);
      
      // Process final data if needed (fallback)
      // ... similar to symptoms component
    }
  }, [isComplete, finalData, setTherapeuticProperties]);

  /**
   * Sync streaming state with store
   */
  useEffect(() => {
    setStreamingProperties(isStreaming);
  }, [isStreaming, setStreamingProperties]);

  /**
   * Check for pre-loaded properties (data comes from previous step)
   */
  useEffect(() => {
    // Check if we have required data
    if (!healthConcern || !demographics || selectedSymptoms.length === 0) {
      return;
    }

    // Properties should already be loaded from previous step
    // If not available, show message to go back
    if (therapeuticProperties.length === 0 && !isStreaming) {
      setError('Therapeutic properties not found. Please go back to the previous step to generate them.');
      return;
    }

    clearError();
  }, [healthConcern, demographics, selectedSymptoms.length, therapeuticProperties.length, isStreaming, setError, clearError]);

  /**
   * Load therapeutic properties using AI streaming (auto-triggered on mount)
   */
  const loadTherapeuticProperties = useCallback(async () => {
    if (!healthConcern || !demographics || selectedSymptoms.length === 0) {
      return;
    }

    if (therapeuticProperties.length > 0 || isStreaming) {
      return; // Already loaded or loading
    }

    clearError();
    setIsModalOpen(true);

    try {
      const requestData = {
        feature: 'create-recipe',
        step: 'therapeutic-properties',
        data: {
          health_concern: healthConcern?.healthConcern || '',
          demographics: {
            gender: demographics.gender,
            age_category: demographics.ageCategory,
            age_specific: demographics.specificAge?.toString()
          },
          selected_symptoms: selectedSymptoms.map(symptom => ({
            symptom_id: `symptom_${Date.now()}_${Math.random()}`,
            name_localized: symptom.symptom_name,
            suggestion_localized: symptom.symptom_suggestion,
            explanation_localized: symptom.explanation
          })),
          user_language: 'PT_BR'
        }
      };

      console.log('🚀 Starting properties analysis with data:', requestData);
      await startStream('/api/ai/streaming', requestData);
    } catch (error) {
      console.error('Failed to start properties streaming:', error);
      setError('Failed to load therapeutic properties. Please try again.');
      setIsModalOpen(false);
    }
  }, [healthConcern, demographics, selectedSymptoms, therapeuticProperties.length, startStream, setError, clearError]);

  // ... rest of component logic (selection handling, form submission, etc.)

  return (
    <div data-testid="therapeutic-properties" className="space-y-6">
      {/* Component content */}
      
      {/* CRITICAL: AI Streaming Modal with correct analysisType */}
      <AIStreamingModal
        isOpen={isModalOpen}
        title="AI Analysis in Progress"
        description="Identifying therapeutic properties to address your symptoms"
        items={streamingItems}
        onClose={() => setIsModalOpen(false)}
        maxVisibleItems={100}
        analysisType="properties"  {/* This makes the modal dynamic */}
      />
    </div>
  );
}
```

### D. Store Integration

Add to `src/features/create-recipe/store/recipe-store.ts`:

```typescript
interface RecipeState {
  // ... existing state ...
  
  // Therapeutic Properties
  therapeuticProperties: TherapeuticProperty[];
  selectedProperties: TherapeuticProperty[];
  isStreamingProperties: boolean;
}

interface RecipeActions {
  // ... existing actions ...
  
  // Therapeutic Properties Actions
  setTherapeuticProperties: (properties: TherapeuticProperty[]) => void;
  updateSelectedProperties: (properties: TherapeuticProperty[]) => void;
  setStreamingProperties: (streaming: boolean) => void;
}

// Implementation
const useRecipeStore = create<RecipeState & RecipeActions>((set, get) => ({
  // ... existing state ...
  
  // Therapeutic Properties
  therapeuticProperties: [],
  selectedProperties: [],
  isStreamingProperties: false,
  
  // Actions
  setTherapeuticProperties: (properties) => set({ therapeuticProperties: properties }),
  updateSelectedProperties: (properties) => set({ selectedProperties: properties }),
  setStreamingProperties: (streaming) => set({ isStreamingProperties: streaming }),
}));
```

### E. Modal Configuration

The `AIStreamingModal` component automatically adapts based on the `analysisType` prop:

```typescript
<AIStreamingModal
  isOpen={isModalOpen}
  title="AI Analysis in Progress"
  description="Identifying therapeutic properties to address your symptoms"
  items={streamingItems}
  onClose={() => setIsModalOpen(false)}
  maxVisibleItems={100}
  analysisType="properties"  // Key for dynamic content
/>
```

#### Available Analysis Types:
- `"causes"` - Potential Causes Analysis
- `"symptoms"` - Potential Symptoms Analysis
- `"properties"` - Therapeutic Properties Analysis
- `"oils"` - Essential Oils Analysis

#### Custom Modal Content:
You can override default content:

```typescript
<AIStreamingModal
  // ... other props ...
  analysisType="properties"
  terminalTitle="Custom Properties Analysis"
  terminalSubtitle="Finding the best therapeutic properties for you"
  loadingMessage="analyzing your symptoms..."
  progressMessage="Discovering more properties..."
/>
```

## Code Examples

### Complete New Step Implementation

Here's a complete example for adding a "Essential Oils" step:

#### 1. Prompt File: `src/features/create-recipe/prompts/prompt-for-essential-oils.md`

```yaml
---
model: gpt-4o-mini
temperature: 0.3
max_tokens: 4000
response_format: json
feature: create-recipe
step: essential-oils
description: "Recommend essential oils based on therapeutic properties"
version: "1.0.0"
---

# Essential Oils Recommendation

You are an expert aromatherapist recommending specific essential oils based on required therapeutic properties.

## Context
- Health Concern: {{healthConcern}}
- Demographics: {{demographics.gender}}, {{demographics.ageCategory}}
- Required Properties: {{selectedProperties}}

## Task
Recommend 10-15 essential oils that possess the required therapeutic properties.

## Response Format
```json
{
  "data": {
    "essential_oils": [
      {
        "oil_id": "lavender_001",
        "name_localized": "Lavender (Lavandula angustifolia)",
        "description_localized": "Calming and anti-inflammatory essential oil",
        "properties": ["anti-inflammatory", "calming", "antimicrobial"],
        "relevancy": 0.95,
        "safety_notes": "Generally safe for topical use when diluted"
      }
    ]
  }
}
```

## Guidelines
- Recommend oils with proven therapeutic benefits
- Include safety considerations
- Prioritize oils that match multiple required properties
- Consider user demographics for safety recommendations
```

#### 2. Data Type Configuration

```typescript
// Add to src/lib/ai/config/streaming-data-types.ts
essential_oils: {
  idField: 'oil_id',
  requiredFields: ['name_localized', 'description_localized'],
  minLengths: {
    name_localized: 3,
    description_localized: 10
  },
  optionalFields: ['properties', 'relevancy', 'safety_notes'],
  displayName: 'Essential Oil'
}
```

#### 3. Component Implementation

```typescript
// src/features/create-recipe/components/essential-oils-selection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import AIStreamingModal from '@/components/ui/ai-streaming-modal';

interface EssentialOil {
  oil_name: string;
  description: string;
  properties?: string[];
  relevancy?: number;
  safety_notes?: string;
}

export function EssentialOilsSelection() {
  const {
    healthConcern,
    demographics,
    selectedProperties,
    essentialOils,
    setEssentialOils,
    setStreamingOils,
    clearError
  } = useRecipeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamingItems, setStreamingItems] = useState<any[]>([]);

  // CRITICAL: Include isComplete and finalData
  const {
    startStream,
    partialData,
    isStreaming,
    isComplete,
    finalData,
    error: streamingError
  } = useAIStreaming({
    jsonArrayPath: 'data.essential_oils'
  });

  // Handle streaming data updates
  useEffect(() => {
    if (partialData && Array.isArray(partialData) && partialData.length > 0) {
      const transformedOils: EssentialOil[] = partialData.map((oil: any) => ({
        oil_name: oil.name_localized,
        description: oil.description_localized,
        properties: oil.properties,
        relevancy: oil.relevancy,
        safety_notes: oil.safety_notes
      }));

      setEssentialOils(transformedOils);

      const modalItems = partialData.map((oil: any) => ({
        title: oil.name_localized,
        subtitle: oil.safety_notes || 'Essential oil recommendation',
        description: oil.description_localized,
        timestamp: new Date()
      }));
      setStreamingItems(modalItems);
    }
  }, [partialData, setEssentialOils]);

  // CRITICAL: Handle completion - Close modal automatically
  useEffect(() => {
    if (isComplete && finalData) {
      console.log('✅ Oils streaming completed');
      setIsModalOpen(false);
    }
  }, [isComplete, finalData]);

  // Sync streaming state
  useEffect(() => {
    setStreamingOils(isStreaming);
  }, [isStreaming, setStreamingOils]);

  const loadEssentialOils = useCallback(async () => {
    if (!healthConcern || !demographics || selectedProperties.length === 0) {
      return;
    }

    clearError();
    setIsModalOpen(true);

    try {
      const requestData = {
        feature: 'create-recipe',
        step: 'essential-oils',
        data: {
          health_concern: healthConcern?.healthConcern || '',
          demographics: {
            gender: demographics.gender,
            age_category: demographics.ageCategory
          },
          selected_properties: selectedProperties.map(prop => ({
            property_id: `prop_${Date.now()}_${Math.random()}`,
            name_localized: prop.property_name,
            description_localized: prop.description
          })),
          user_language: 'PT_BR'
        }
      };

      await startStream('/api/ai/streaming', requestData);
    } catch (error) {
      console.error('Failed to start oils streaming:', error);
      setIsModalOpen(false);
    }
  }, [healthConcern, demographics, selectedProperties, startStream, clearError]);

  return (
    <div className="space-y-6">
      {/* Component content */}

      {/* CRITICAL: Correct analysisType */}
      <AIStreamingModal
        isOpen={isModalOpen}
        title="AI Analysis in Progress"
        description="Recommending essential oils with your required properties"
        items={streamingItems}
        onClose={() => setIsModalOpen(false)}
        maxVisibleItems={100}
        analysisType="oils"
      />
    </div>
  );
}
```

## Testing Guidelines

### 1. Unit Testing

Test the component in isolation:

```typescript
// src/features/create-recipe/components/__tests__/therapeutic-properties.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TherapeuticPropertiesSelection } from '../therapeutic-properties';

// Mock the AI streaming hook
jest.mock('@/lib/ai/hooks/use-ai-streaming', () => ({
  useAIStreaming: () => ({
    startStream: jest.fn(),
    partialData: [],
    isStreaming: false,
    isComplete: false,
    finalData: null,
    error: null
  })
}));

describe('TherapeuticPropertiesSelection', () => {
  it('should trigger AI analysis when button is clicked', async () => {
    render(<TherapeuticPropertiesSelection />);

    const analyzeButton = screen.getByText('Analyze Therapeutic Properties');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('AI Analysis in Progress')).toBeInTheDocument();
    });
  });

  it('should close modal automatically when streaming completes', async () => {
    // Test isComplete handling
  });
});
```

### 2. Integration Testing

Test the full workflow:

```typescript
// Test navigation between steps
// Test data persistence in store
// Test AI streaming end-to-end
```

### 3. Manual Testing Checklist

- [ ] Modal opens when AI analysis starts
- [ ] Real-time data appears in modal terminal
- [ ] Modal closes automatically when streaming completes
- [ ] Data is saved to store correctly
- [ ] Navigation to next step works
- [ ] Error handling works (network failures, AI errors)
- [ ] Modal content is dynamic (not hardcoded)

## Common Pitfalls and Troubleshooting

### 1. Modal Won't Close Automatically

**Problem**: Modal stays open after streaming completes

**Cause**: Missing `isComplete` handling in component

**Solution**:
```typescript
// WRONG - Missing isComplete
const { startStream, partialData, isStreaming } = useAIStreaming({
  jsonArrayPath: 'data.therapeutic_properties'
});

// CORRECT - Include isComplete and finalData
const {
  startStream,
  partialData,
  isStreaming,
  isComplete,     // ← Add this
  finalData,      // ← Add this
  error
} = useAIStreaming({
  jsonArrayPath: 'data.therapeutic_properties'
});

// Add completion handler
useEffect(() => {
  if (isComplete && finalData) {
    setIsModalOpen(false);  // ← Close modal automatically
  }
}, [isComplete, finalData]);
```

### 2. Hardcoded Modal Content

**Problem**: Modal shows "Potential Causes Analysis" for all steps

**Cause**: Missing `analysisType` prop

**Solution**:
```typescript
// WRONG - No analysisType
<AIStreamingModal
  isOpen={isModalOpen}
  title="AI Analysis in Progress"
  items={streamingItems}
/>

// CORRECT - Add analysisType
<AIStreamingModal
  isOpen={isModalOpen}
  title="AI Analysis in Progress"
  items={streamingItems}
  analysisType="properties"  // ← Add this
/>
```

### 3. Data Type Not Recognized

**Problem**: AI streaming doesn't process new data type

**Cause**: Missing configuration in `streaming-data-types.ts`

**Solution**:
```typescript
// Add to STREAMING_DATA_TYPES in src/lib/ai/config/streaming-data-types.ts
your_new_type: {
  idField: 'your_id_field',
  requiredFields: ['name_localized', 'description_localized'],
  minLengths: { name_localized: 5, description_localized: 15 },
  optionalFields: ['optional_field1', 'optional_field2'],
  displayName: 'Your Display Name'
}
```

### 4. Navigation Issues

**Problem**: Can't navigate to next step after completion

**Cause**: Step not marked as completed

**Solution**:
```typescript
// Mark step as completed when data is selected
useEffect(() => {
  if (selectedItems.length > 0) {
    markCurrentStepCompleted();  // ← Add this
  }
}, [selectedItems, markCurrentStepCompleted]);
```

### 5. Prompt Not Found

**Problem**: API returns "Prompt not found" error

**Cause**: Incorrect prompt file location or naming

**Solution**:
- Ensure prompt file is in `src/features/create-recipe/prompts/`
- Follow naming convention: `prompt-for-{step-name}.md`
- Check YAML frontmatter has correct `feature` and `step` values

### 6. AI Response Format Issues

**Problem**: Streaming data is not processed correctly

**Cause**: AI response doesn't match expected JSON structure

**Solution**:
- Verify prompt includes exact JSON schema
- Check `jsonArrayPath` matches response structure
- Add validation in data type configuration
- Test prompt with OpenAI Playground first

---

## Quick Reference

### Essential Files for New Step:
1. `src/features/create-recipe/prompts/prompt-for-{step}.md`
2. `src/lib/ai/config/streaming-data-types.ts` (add config)
3. `src/features/create-recipe/components/{step}-selection.tsx`
4. `src/features/create-recipe/store/recipe-store.ts` (add state)

### Critical Code Patterns:
- Always include `isComplete` and `finalData` in `useAIStreaming`
- Always add completion handler to close modal
- Always set `analysisType` prop on `AIStreamingModal`
- Always mark step as completed when data is selected
- Always follow the correct workflow pattern: stream NEXT step data from CURRENT step

### Testing Priorities:
1. Modal closes automatically
2. Data flows correctly between steps
3. Error handling works
4. Navigation works properly

This documentation provides everything needed to add new AI streaming steps to the create-recipe workflow while maintaining consistency and avoiding common pitfalls.
```
