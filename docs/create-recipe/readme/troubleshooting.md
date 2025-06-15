# Create Recipe Troubleshooting Guide

## Overview

This guide helps developers troubleshoot common issues with the Create Recipe AI streaming system. Based on real implementation experiences from therapeutic properties and suggested oils features, this guide covers the most critical issues and their solutions.

**🎯 Latest Update**: Added troubleshooting for state management patterns, streaming sequence issues, and progressive display problems based on recent implementations.

## 🚨 CRITICAL ISSUES - MOST COMMON PROBLEMS

Based on real implementation experiences, these are the most critical issues that cause hours of debugging:

### **1. Silent Form Submission Failure (CRITICAL)**
**Symptoms**: Button click doesn't trigger AI streaming, no errors shown, no console logs
**Root Cause**: React Hook Form + local state management conflict
**Time Lost**: 2+ hours debugging "why button doesn't work"
**Solution**: Remove react-hook-form entirely, use direct button `onClick`

### **2. Mixed State Management Patterns (CRITICAL)**
**Symptoms**: Modal only shows items at completion instead of progressively during streaming
**Root Cause**: Using store-based state for modal control but hook-based state for data updates
**Time Lost**: 1+ hour debugging progressive display
**Solution**: Use hook-based state consistently: `<AIStreamingModal isOpen={isStreaming} />`

### **3. Streaming Sequence Issues (MAJOR)**
**Symptoms**: Backend logs show progressive items but frontend modal doesn't update until completion
**Root Cause**: Backend waits for agent completion before starting streaming
**Time Lost**: 30+ minutes debugging streaming sequence
**Solution**: Start streaming immediately during agent execution

### **4. Controller Premature Closure (CRITICAL)**
**Symptoms**: "Controller is already closed" errors in backend logs
**Root Cause**: Frontend state management causes backend controller to close early
**Time Lost**: 2+ hours debugging backend streaming errors
**Solution**: Use appropriate timeout (60s+) and consistent state management

### **5. Multiple Re-renders During Navigation (CRITICAL)**
**Symptoms**: Multiple GET requests to next step page after AI streaming completes
**Root Cause**: Multiple rapid state updates + setTimeout navigation delay causing re-renders
**Time Lost**: 1+ hour debugging navigation issues
**Solution**: Consolidate state updates and remove setTimeout delays in navigation

## ⚠️ CRITICAL WARNINGS - READ FIRST

This system uses a specific workflow pattern: **AI streams data for the NEXT step while staying on the CURRENT step.**

For comprehensive guidance, see:
- [Adding New AI Streaming Steps](./adding-new-ai-streaming-steps.md)
- [Quick Reference: New Step](./quick-reference-new-step.md)
- [Implementation Lessons Learned](./implementation-lessons-learned.md)
 
## Common Issues and Solutions

### 1. AI Streaming Issues

#### Issue: Button Click Doesn't Trigger Streaming (CRITICAL)

**Symptoms:**
- Button appears to work but nothing happens
- No console logs or network requests
- Modal never opens
- No errors shown

**Root Cause:** React Hook Form + local state management conflict

**Solution:**
```typescript
// ❌ WRONG - This combination causes silent failures
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const { handleSubmit } = useForm();
const onSubmit = async (data: any) => { /* never called */ };
<form onSubmit={handleSubmit(onSubmit)}>

// ✅ CORRECT - Choose ONE approach consistently
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const onSubmit = async () => { /* direct function */ };
<button type="button" onClick={onSubmit}>Continue</button>
```

#### Issue: Modal Shows Items Only at Completion (CRITICAL)

**Symptoms:**
- Backend logs show progressive items (`itemsSent: 1, 2, 3, 4, 5`)
- Frontend modal only shows items when streaming completes
- No progressive display during streaming

**Root Cause:** Mixed state management patterns

**Solution:**
```typescript
// ❌ WRONG - Mixed patterns cause display issues
const [isModalOpen, setIsModalOpen] = useState(false); // Local state
const { isStreamingOils } = useRecipeStore(); // Store state
<AIStreamingModal isOpen={isStreamingOils} /> // Using store state

// ✅ CORRECT - Hook-based pattern (consistent)
const { isStreaming } = useAIStreaming();
<AIStreamingModal isOpen={isStreaming} />
```

#### Issue: Streaming Not Starting

**Symptoms:**
- Loading indicator shows but no data appears
- Console shows "Failed to start streaming" errors
- Component remains in loading state indefinitely

**Possible Causes:**
- **Prompt Configuration Errors:** Incorrect file format, location, or content in the prompt `.yaml` file
- Missing or invalid health concern data
- Demographics data not properly formatted
- Network connectivity issues
- API endpoint not responding

**Solutions:**

1. **Check Required Data:**
```typescript
// Verify health concern exists
console.log('Health concern:', healthConcern);
if (!healthConcern?.healthConcern) {
  console.error('Health concern is missing');
}

// Verify demographics format
console.log('Demographics:', demographics);
const requiredFields = ['gender', 'ageCategory', 'specificAge'];
const missingFields = requiredFields.filter(field => !demographics?.[field]);
if (missingFields.length > 0) {
  console.error('Missing demographics fields:', missingFields);
}
```

2. **Check Network Connectivity:**
```typescript
// Test API endpoint
try {
  const response = await fetch('/api/health/streaming');
  if (!response.ok) {
    console.error('API endpoint not available');
  }
} catch (error) {
  console.error('Network error:', error);
}
```

3. **Verify Step Configuration:**
```typescript
import { getStepConfig } from '../config/step-mapping';

const config = getStepConfig('potential-causes');
if (!config) {
  console.error('Step configuration not found');
} else {
  console.log('Step config:', config);
}
```

#### Issue: Partial Data Not Updating

**Symptoms:**
- Streaming starts but UI doesn't update with partial data
- Console shows data being received but components don't re-render
- Final data appears but progressive updates missing

**Solutions:**

1. **Check useEffect Dependencies:**
```typescript
// Ensure proper dependencies
useEffect(() => {
  if (partialData && Array.isArray(partialData)) {
    console.log('Processing partial data:', partialData);
    setStepData(partialData);
  }
}, [partialData]); // Make sure partialData is in dependencies
```

2. **Verify Data Transformation:**
```typescript
// Check if transformation is working
useEffect(() => {
  if (partialData) {
    console.log('Raw partial data:', partialData);
    const transformed = transformData(partialData, stepId);
    console.log('Transformed data:', transformed);
    setStepData(transformed);
  }
}, [partialData, stepId]);
```

3. **Check State Updates:**
```typescript
// Ensure state is updating correctly
const [stepData, setStepData] = useState([]);

useEffect(() => {
  console.log('Step data updated:', stepData);
}, [stepData]);
```

### 2. Data Transformation Issues

#### Issue: Data Format Mismatch

**Symptoms:**
- Components receive data but display incorrectly
- Missing fields in UI components
- Type errors in console

**Solutions:**

1. **Verify Transformation Function:**
```typescript
// Test transformation manually
const testData = {
  cause_id: 'test',
  name_localized: 'Test Cause',
  suggestion_localized: 'Test suggestion',
  explanation_localized: 'Test explanation'
};

const transformed = DATA_TRANSFORMATIONS.POTENTIAL_CAUSES.transform(testData);
console.log('Transformation result:', transformed);

// Expected output:
// {
//   cause_name: 'Test Cause',
//   cause_suggestion: 'Test suggestion',
//   explanation: 'Test explanation'
// }
```

2. **Check JSON Path Configuration:**
```typescript
// Verify jsonArrayPath is correct
const config = getStepConfig(stepId);
console.log('JSON array path:', config?.jsonArrayPath);

// For potential-causes, should be: 'data.potential_causes'
// For potential-symptoms, should be: 'data.potential_symptoms'
```

3. **Handle Missing Fields:**
```typescript
// Add fallbacks for missing data
const safeTransform = (item: any) => ({
  cause_name: item.name_localized || item.cause_id || 'Unknown cause',
  cause_suggestion: item.suggestion_localized || 'No suggestion available',
  explanation: item.explanation_localized || 'No explanation available'
});
```

### 3. State Management Issues

#### Issue: Store Not Updating

**Symptoms:**
- Data processed correctly but store doesn't update
- Components don't re-render with new data
- State appears stale

**Solutions:**

1. **Check Store Actions:**
```typescript
// Verify store actions are being called
const { setPotentialCauses, setStreamingCauses } = useRecipeStore();

// Add logging to verify calls
const handleDataUpdate = (data: any[]) => {
  console.log('Updating store with data:', data);
  setPotentialCauses(data);
  console.log('Store updated');
};
```

2. **Verify Store Selectors:**
```typescript
// Check if selectors are working
const potentialCauses = useRecipeStore(state => state.potentialCauses);
const isStreaming = useRecipeStore(state => state.isStreamingCauses);

console.log('Current causes:', potentialCauses);
console.log('Is streaming:', isStreaming);
```

3. **Check Store Subscription:**
```typescript
// Ensure component is subscribed to correct store slice
const {
  potentialCauses,
  isStreamingCauses,
  streamingError
} = useRecipeStore();

// Log when store values change
useEffect(() => {
  console.log('Store values changed:', {
    causesCount: potentialCauses.length,
    isStreaming: isStreamingCauses,
    error: streamingError
  });
}, [potentialCauses, isStreamingCauses, streamingError]);
```

### 4. Component Rendering Issues

#### Issue: Generic Component Not Rendering

**Symptoms:**
- GenericStepSelector component appears empty
- No items displayed despite data being available
- Component renders but without content

**Solutions:**

1. **Check Component Props:**
```typescript
// Verify all required props are passed
<GenericStepSelector 
  stepId="potential-causes"  // Required
  title="Custom Title"       // Optional
  description="Custom desc"  // Optional
  className="custom-class"   // Optional
/>
```

2. **Verify Data Structure:**
```typescript
// Check if data has correct structure for rendering
const stepData = useRecipeStore(state => state.potentialCauses);

console.log('Step data for rendering:', stepData);
console.log('Data structure check:', {
  isArray: Array.isArray(stepData),
  length: stepData?.length,
  firstItem: stepData?.[0],
  hasRequiredFields: stepData?.[0]?.cause_name ? true : false
});
```

3. **Check Item ID Generation:**
```typescript
// Verify getItemId function works correctly
const getItemId = (item: any): string => {
  const id = item.cause_name || item.symptom_name || item.property_name || item.id || item.name;
  console.log('Generated item ID:', id, 'for item:', item);
  return id || JSON.stringify(item);
};
```

### 5. Navigation Issues

#### Issue: Cannot Navigate to Next Step

**Symptoms:**
- Continue button remains disabled
- Form validation fails
- Navigation doesn't proceed despite valid selection

**Solutions:**

1. **Check Validation Rules:**
```typescript
// Verify validation configuration
const config = getStepConfig(stepId);
console.log('Validation rules:', config?.validation);

// Check current selection count
const selectedCount = selectedItemIds.size;
console.log('Selection validation:', {
  selected: selectedCount,
  min: config?.validation.minSelection,
  max: config?.validation.maxSelection,
  isValid: selectedCount >= (config?.validation.minSelection || 1) &&
           selectedCount <= (config?.validation.maxSelection || 10)
});
```

2. **Check Navigation Permissions:**
```typescript
// Verify navigation hook state
const { canGoNext, canGoPrevious } = useRecipeWizardNavigation();
console.log('Navigation state:', { canGoNext, canGoPrevious });
```

3. **Check Step Completion:**
```typescript
// Verify step is marked as completed
const { markCurrentStepCompleted } = useRecipeWizardNavigation();

// Ensure this is called when minimum selection is met
useEffect(() => {
  if (selectedItems.length >= minSelection) {
    console.log('Marking step as completed');
    markCurrentStepCompleted();
  }
}, [selectedItems.length, minSelection]);
```

### 6. Error Handling Issues

#### Issue: Errors Not Displaying Properly

**Symptoms:**
- Errors occur but user doesn't see error messages
- Console shows errors but UI doesn't reflect them
- Error state not clearing properly

**Solutions:**

1. **Check Error State Management:**
```typescript
// Verify error handling in store
const { error, streamingError, setError, clearError } = useRecipeStore();

console.log('Error state:', { error, streamingError });

// Ensure errors are being set correctly
const handleError = (errorMessage: string) => {
  console.log('Setting error:', errorMessage);
  setError(errorMessage);
};
```

2. **Check Error Display Logic:**
```typescript
// Verify error display conditions
const shouldShowError = error || streamingError;
console.log('Should show error:', shouldShowError);

// Check error display component
{(error || streamingError) && (
  <div className="error-display">
    <p>{error || streamingError}</p>
  </div>
)}
```

3. **Check Error Clearing:**
```typescript
// Ensure errors are cleared appropriately
useEffect(() => {
  // Clear errors when starting new operation
  clearError();
  clearStreamingError();
}, [stepId]); // Clear when step changes
```

## Debugging Tools

### 1. Console Debugging

```typescript
// Add comprehensive logging
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CreateRecipe Debug] ${message}`, data);
  }
};

// Use throughout components
debugLog('Component mounted', { stepId, healthConcern });
debugLog('Streaming started', { requestData });
debugLog('Data received', { partialData, finalData });
```

### 2. React DevTools

- Install React Developer Tools browser extension
- Check component state and props in real-time
- Monitor store state changes
- Inspect hook values and updates

### 3. Network Debugging

```typescript
// Monitor API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch request:', args);
  const response = await originalFetch(...args);
  console.log('Fetch response:', response);
  return response;
};
```

### 4. Store Debugging

```typescript
// Add store debugging
const useRecipeStoreWithDebug = () => {
  const store = useRecipeStore();
  
  useEffect(() => {
    console.log('Store state changed:', store);
  }, [store]);
  
  return store;
};
```

## Performance Issues

### Issue: Slow Rendering with Large Datasets

**Solutions:**

1. **Implement Virtual Scrolling:**
```typescript
// For large lists, use virtual scrolling
import { FixedSizeList as List } from 'react-window';

const ItemRenderer = ({ index, style }: any) => (
  <div style={style}>
    <ItemComponent item={stepData[index]} />
  </div>
);

<List
  height={400}
  itemCount={stepData.length}
  itemSize={100}
>
  {ItemRenderer}
</List>
```

2. **Optimize Re-renders:**
```typescript
// Use React.memo for expensive components
const ItemComponent = React.memo(({ item, isSelected, onToggle }) => {
  return (
    <div onClick={onToggle}>
      {/* Component content */}
    </div>
  );
});
```

3. **Debounce Updates:**
```typescript
// Debounce rapid updates
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (data) => setStepData(data),
  100 // 100ms debounce
);
```

## Getting Help

### 1. Check Test Coverage

The system has **69 passing tests** that can help identify issues:

```bash
# Run specific test suites
npm test -- src/features/create-recipe/components/
npm test -- src/features/create-recipe/config/
npm test -- src/features/create-recipe/utils/
```

### 2. Review Documentation

- **API Documentation**: `docs/api/ai-streaming-endpoint.md`
- **Architecture Guide**: `docs/architecture/ai-streaming-architecture.md`
- **Adding New Steps**: `docs/create-recipe/adding-new-ai-steps.md`

### 3. Check Health Endpoints

```typescript
// Verify system health
const checkHealth = async () => {
  try {
    const response = await fetch('/api/health/streaming');
    const health = await response.json();
    console.log('System health:', health);
  } catch (error) {
    console.error('Health check failed:', error);
  }
};
```

### 4. Enable Debug Mode

```typescript
// Add to environment variables
NEXT_PUBLIC_DEBUG_AI_STREAMING=true

// Use in components
if (process.env.NEXT_PUBLIC_DEBUG_AI_STREAMING) {
  console.log('Debug mode enabled');
  // Additional debugging logic
}
```

## Prevention Tips

1. **Always validate data structure** before processing
2. **Use TypeScript** for type safety
3. **Add comprehensive error handling** for all async operations
4. **Test with various data scenarios** including edge cases
5. **Monitor performance** with large datasets
6. **Keep dependencies updated** for security and performance
7. **Use the provided test suites** to verify functionality

The Create Recipe system is designed to be robust and self-healing, but following these troubleshooting steps will help resolve issues quickly and maintain system reliability.
