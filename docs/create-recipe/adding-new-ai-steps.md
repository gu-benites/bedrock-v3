# Adding New AI Steps to Create Recipe

This document outlines the process for adding new AI steps to the Create Recipe feature. The system has been designed with dynamic adaptability to make adding new steps as simple as configuration changes.

## Overview

The Create Recipe feature uses a dynamic step system that allows new AI steps to be added through configuration rather than code changes. The system includes:

- **Dynamic Step Mapping**: Configuration-based step definitions
- **Generic Components**: Reusable components that work with any step
- **Data Transformations**: Automatic conversion between data formats
- **Validation Rules**: Configurable validation for each step
- **Dependency Management**: Automatic handling of step dependencies

## Quick Start: Adding a New Step

To add a new AI step, you need to:

1. **Add Step Configuration** in `src/features/create-recipe/config/step-mapping.ts`
2. **Create Prompt File** in `src/features/recipe-wizard/prompts/`
3. **Update Store Types** (if needed) in `src/features/create-recipe/types/recipe.types.ts` # NOTE: This file is no longer used. Update src/features/create-recipe/store/recipe-store.ts directly
4. **Add Store Properties** (if needed) in `src/features/create-recipe/store/recipe-store.ts`
5. **Create Tests** for the new step

## Detailed Steps

### 1. Add Step Configuration

Edit `src/features/create-recipe/config/step-mapping.ts` and add your step to `STEP_CONFIGURATIONS`:

```typescript
'your-new-step': {
  stepId: 'your-new-step',
  displayName: 'Your New Step',
  promptName: 'your-new-step', // Name of the prompt file (without .yaml)
  jsonArrayPath: 'data.your_step_data', // Path to extract data from AI response
  transformations: [DATA_TRANSFORMATIONS.YOUR_NEW_STEP], // Data transformation
  dependencies: ['health-concern', 'demographics', 'potential-causes'], // Required previous steps
  storeProperty: 'yourStepData', // Store property name for the data
  selectedProperty: 'selectedYourStepData', // Store property for selected items
  validation: {
    minSelection: 1,
    maxSelection: 5,
    required: true
  }
}
```

### 2. Add Data Transformation

Add a transformation function to `DATA_TRANSFORMATIONS`:

```typescript
YOUR_NEW_STEP: {
  from: 'recipe-wizard',
  to: 'create-recipe',
  transform: (item: any) => ({
    // Transform recipe-wizard format to create-recipe format
    item_name: item.name_localized || item.item_id || 'Unknown item',
    item_description: item.description_localized || '',
    explanation: item.explanation_localized || ''
  })
}
```

### 3. Create Prompt File

Create a new YAML file in `src/features/recipe-wizard/prompts/your-new-step.yaml`:

```yaml
# Prompt configuration for your new step
name: "Your New Step"
description: "Generate your new step data based on user input"
version: "1.0.0"

# Model configuration
model:
  name: "gpt-4"
  temperature: 0.7
  max_tokens: 2000

# JSON Schema for the output
schema:
  type: "object"
  properties:
    data:
      type: "object"
      properties:
        your_step_data:
          type: "array"
          items:
            type: "object"
            properties:
              item_id:
                type: "string"
              name_localized:
                type: "string"
              description_localized:
                type: "string"
              explanation_localized:
                type: "string"
            required: ["item_id", "name_localized"]
      required: ["your_step_data"]
  required: ["data"]

# Prompt template
prompt: |
  Based on the user's health concern and previous selections, generate relevant items for your new step.
  
  Health Concern: {{healthConcern}}
  Demographics: {{demographics}}
  Previous Selections: {{previousSelections}}
  
  Generate 5-10 relevant items that would be appropriate for this user's situation.
  
  Return the data in the specified JSON format.
```

### 4. Update Store Types (if needed)

If your step requires new data types, add them to `src/features/create-recipe/types/recipe.types.ts`:

```typescript
export interface YourStepItem {
  item_name: string;
  item_description: string;
  explanation: string;
}

// Add to RecipeWizardState interface
export interface RecipeWizardState {
  // ... existing properties
  yourStepData: YourStepItem[];
  selectedYourStepData: YourStepItem[];
}

// Add to RecipeWizardActions interface
export interface RecipeWizardActions {
  // ... existing actions
  setYourStepData: (data: YourStepItem[]) => void;
  updateSelectedYourStepData: (selected: YourStepItem[]) => void;
}
```

### 5. Update Store Implementation (if needed)

Add the new properties and actions to `src/features/create-recipe/store/recipe-store.ts`:

```typescript
// Add to initial state
const initialState = {
  // ... existing state
  yourStepData: [],
  selectedYourStepData: [],
};

// Add actions
const actions = {
  // ... existing actions
  setYourStepData: (data: YourStepItem[]) => {
    set((state) => ({
      yourStepData: data,
      lastUpdated: new Date()
    }));
  },
  
  updateSelectedYourStepData: (selected: YourStepItem[]) => {
    set((state) => ({
      selectedYourStepData: selected,
      lastUpdated: new Date()
    }));
  },
};
```

### 6. Use the Generic Component

The system automatically works with the generic step selector. To use it in your flow:

```typescript
import { GenericStepSelector } from '../components/generic-step-selector';

// In your component
<GenericStepSelector 
  stepId="your-new-step"
  title="Custom Title (optional)"
  description="Custom description (optional)"
/>
```

### 7. Create Tests

Create tests for your new step in `src/features/create-recipe/config/step-mapping.test.ts`:

```typescript
describe('Your New Step', () => {
  it('should have valid configuration', () => {
    const config = getStepConfig('your-new-step');
    expect(config).toBeDefined();
    expect(config?.stepId).toBe('your-new-step');
  });

  it('should transform data correctly', () => {
    const testData = [{
      item_id: 'test',
      name_localized: 'Test Item',
      description_localized: 'Test description'
    }];
    
    const transformed = transformData(testData, 'your-new-step');
    expect(transformed[0]).toEqual({
      item_name: 'Test Item',
      item_description: 'Test description',
      explanation: ''
    });
  });
});
```

## Advanced Features

### Custom Item Rendering

You can provide custom rendering for your step items:

```typescript
<GenericStepSelector 
  stepId="your-new-step"
  renderItem={(item, isSelected, onToggle) => (
    <div onClick={onToggle} className={isSelected ? 'selected' : ''}>
      <h3>{item.item_name}</h3>
      <p>{item.item_description}</p>
      {/* Custom rendering logic */}
    </div>
  )}
/>
```

### Complex Dependencies

Steps can depend on multiple previous steps:

```typescript
dependencies: ['health-concern', 'demographics', 'potential-causes', 'potential-symptoms']
```

### Multiple Transformations

You can apply multiple transformations:

```typescript
transformations: [
  DATA_TRANSFORMATIONS.YOUR_STEP_PRIMARY,
  DATA_TRANSFORMATIONS.YOUR_STEP_SECONDARY
]
```

## System Architecture

### Flow Overview

1. **User completes previous steps** → Dependencies satisfied
2. **Generic component loads** → Checks step configuration
3. **Dynamic processor starts** → Validates dependencies, prepares request
4. **AI streaming begins** → Calls `/api/ai/streaming` with step parameter
5. **PromptManager loads prompt** → Based on step configuration
6. **AI generates data** → According to prompt schema
7. **Data transformation** → Recipe-wizard format → Create-recipe format
8. **Component renders** → Generic component displays items
9. **User selects items** → Validation according to step rules
10. **Store updates** → Selected items saved to store
11. **Navigation** → Proceeds to next step

### Key Components

- **`step-mapping.ts`**: Central configuration for all steps
- **`dynamic-step-processor.ts`**: Generic processing logic
- **`generic-step-selector.tsx`**: Reusable UI component
- **`prompt-manager.ts`**: Dynamic prompt loading
- **`/api/ai/streaming`**: Generic API endpoint

## Best Practices

1. **Use descriptive step IDs**: `potential-symptoms` not `step2`
2. **Follow naming conventions**: `camelCase` for properties, `kebab-case` for IDs
3. **Include comprehensive validation**: Min/max selections, required fields
4. **Write thorough tests**: Cover configuration, transformation, and validation
5. **Document prompt schemas**: Clear descriptions in YAML files
6. **Handle missing data**: Graceful fallbacks in transformations
7. **Consider dependencies**: Logical flow between steps
8. **Test with real data**: Verify transformations work with actual AI responses

## Troubleshooting

### Common Issues

1. **Step not appearing**: Check dependencies are satisfied
2. **Data not transforming**: Verify transformation function and jsonArrayPath
3. **Validation failing**: Check min/max selection rules
4. **Prompt not loading**: Ensure YAML file exists and is valid
5. **Store not updating**: Verify store properties and actions are defined

### Debugging

1. **Check browser console**: Look for error messages
2. **Verify step configuration**: Use `getStepConfig('your-step')`
3. **Test transformation**: Use `transformData(testData, 'your-step')`
4. **Validate selection**: Use `validateSelection('your-step', items)`
5. **Check dependencies**: Use `canExecuteStep('your-step', completedSteps)`

## Migration Notes

This system was designed during the migration from recipe-wizard to create-recipe. The dynamic approach ensures:

- **No hardcoded logic**: All step behavior is configuration-driven
- **Reusable components**: Generic components work with any step
- **Easy maintenance**: Adding steps requires minimal code changes
- **Consistent UX**: All steps follow the same interaction patterns
- **Comprehensive testing**: Automated tests cover all step functionality

### Real-World Migration Examples

**Before Migration (recipe-wizard approach):**
```typescript
// Hardcoded component for each step
function PotentialCausesComponent() {
  const [causes, setCauses] = useState([]);

  useEffect(() => {
    // Hardcoded API call
    fetch('/api/recipe-wizard/potential-causes', {
      method: 'POST',
      body: JSON.stringify({ healthConcern, demographics })
    })
    .then(res => res.json())
    .then(data => setCauses(data.potential_causes));
  }, []);

  return (
    <div>
      {/* Hardcoded UI for causes */}
      {causes.map(cause => (
        <CauseItem key={cause.cause_id} cause={cause} />
      ))}
    </div>
  );
}
```

**After Migration (create-recipe approach):**
```typescript
// Generic component works for any step
function AIStepPage({ stepId }: { stepId: string }) {
  return (
    <GenericStepSelector
      stepId={stepId}  // Just pass the step ID!
      // Everything else is automatic:
      // - API calls
      // - Data transformation
      // - UI rendering
      // - Validation
      // - Error handling
    />
  );
}

// Usage for any step:
<AIStepPage stepId="potential-causes" />
<AIStepPage stepId="potential-symptoms" />
<AIStepPage stepId="therapeutic-properties" />
```

### Migration Benefits Achieved

1. **69 Passing Tests**: Comprehensive test coverage ensures reliability
2. **Zero Hardcoding**: All behavior driven by configuration
3. **Future-Ready**: New steps require only configuration changes
4. **Consistent UX**: All steps follow the same interaction patterns
5. **Better Performance**: Streaming provides real-time feedback

## Future Enhancements

Potential improvements to the system:

1. **Visual step builder**: UI for creating step configurations
2. **Prompt template editor**: Visual editor for prompt YAML files
3. **Advanced validation**: Custom validation functions per step
4. **Conditional steps**: Steps that appear based on previous selections
5. **Multi-language support**: Localized prompts and transformations
6. **Analytics integration**: Track step completion and user behavior
7. **A/B testing**: Different prompts or configurations for testing

## Support

For questions or issues with adding new AI steps:

1. Check this documentation first
2. Review existing step configurations for examples
3. Run the test suite to verify your changes
4. Check the browser console for error messages
5. Refer to the API mapping document for data schemas

The dynamic step system is designed to be developer-friendly and maintainable. Following these guidelines will ensure your new steps integrate seamlessly with the existing system.
