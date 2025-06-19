# State Persistence System

## Overview

The state persistence system provides automatic form data recovery and state management for the create-recipe workflow using sessionStorage. This ensures users don't lose their progress when refreshing the page or navigating away temporarily.

## Architecture

### Core Components

1. **SessionStorageManager** (`src/lib/storage/session-storage-manager.ts`)
   - Low-level storage operations with compression and encryption
   - Data integrity verification with checksums
   - Automatic cleanup of expired data
   - Usage analytics and monitoring

2. **Recipe State Persistence Hook** (`src/features/create-recipe/hooks/use-recipe-state-persistence.ts`)
   - High-level persistence for recipe wizard state
   - Auto-save functionality with debouncing
   - Form draft management for individual steps
   - Recovery and restoration capabilities

3. **Visual Components**
   - `PersistenceStatusIndicator` - Shows save status and recovery options
   - `PersistenceManagementPanel` - Comprehensive persistence management
   - `PersistenceStatusBadge` - Simple save status indicator

## Features

### Automatic State Persistence

```typescript
const { saveState, restoreState, clearPersistedState } = useRecipeStatePersistence({
  enabled: true,
  autoSave: true,
  saveInterval: 3000, // Save every 3 seconds
  excludeFields: ['isLoading', 'error', 'streamingError'], // Don't persist transient state
  onRestore: (data) => console.log('Data restored:', data),
  onSave: (data) => console.log('Data saved:', data)
});
```

### Form Draft Management

```typescript
const { getInitialFormData, saveFormDraft } = useFormPersistence('demographics', formData);

// Auto-save form data when it changes
useEffect(() => {
  if (formData && Object.keys(formData).length > 0) {
    const timeoutId = setTimeout(() => {
      saveFormDraft('demographics', formData);
    }, 1000); // Debounce saves

    return () => clearTimeout(timeoutId);
  }
}, [formData, saveFormDraft]);
```

### Data Integrity and Security

```typescript
interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string; // Data integrity verification
}

// Configuration options
interface StorageConfig {
  prefix: string;           // Storage key prefix
  version: string;          // Data version for compatibility
  maxAge: number;          // Data expiration time
  compression: boolean;     // Enable data compression
  encryption: boolean;      // Enable basic encryption
}
```

## Implementation Guide

### 1. Basic State Persistence

```typescript
// In your component
import { useRecipeStatePersistence } from '../hooks/use-recipe-state-persistence';

const MyComponent = () => {
  const { saveState, restoreState } = useRecipeStatePersistence({
    enabled: true,
    autoSave: true,
    saveInterval: 5000
  });

  // State is automatically saved and restored
  return <div>Your component content</div>;
};
```

### 2. Form-Specific Persistence

```typescript
// For individual form steps
import { useFormPersistence } from '../hooks/use-recipe-state-persistence';

const DemographicsForm = () => {
  const [formData, setFormData] = useState({});
  
  const { getInitialFormData } = useFormPersistence('demographics', formData);

  // Restore form data on mount
  useEffect(() => {
    const savedData = getInitialFormData();
    if (savedData) {
      setFormData(savedData);
    }
  }, [getInitialFormData]);

  return <form>...</form>;
};
```

### 3. Visual Status Indicators

```typescript
// Simple status badge
import { PersistenceStatusBadge } from '@/components/storage/persistence-status-indicator';

const FormHeader = () => (
  <div className="flex items-center justify-between">
    <h2>Form Title</h2>
    <PersistenceStatusBadge />
  </div>
);

// Detailed status indicator
import { PersistenceStatusIndicator } from '@/components/storage/persistence-status-indicator';

const FormContainer = () => (
  <div>
    <PersistenceStatusIndicator 
      showDetails={true}
      onRestore={() => window.location.reload()}
      onClear={() => sessionStorageManager.clear()}
    />
    <form>...</form>
  </div>
);
```

## Configuration Options

### Storage Manager Configuration

```typescript
const sessionStorageManager = new SessionStorageManager({
  prefix: 'bedrock_recipe_',     // Storage key prefix
  version: '1.0.0',              // Data version
  maxAge: 24 * 60 * 60 * 1000,   // 24 hours expiration
  compression: true,              // Enable compression
  encryption: false               // Disable encryption for development
});
```

### Persistence Hook Configuration

```typescript
const persistenceConfig = {
  enabled: true,                  // Enable/disable persistence
  autoSave: true,                 // Automatic saving
  saveInterval: 3000,             // Save every 3 seconds
  excludeFields: [                // Fields to exclude from persistence
    'isLoading',
    'error',
    'streamingError'
  ],
  onRestore: (data) => {          // Callback when data is restored
    console.log('Data restored:', data);
  },
  onSave: (data) => {             // Callback when data is saved
    console.log('Data saved:', data);
  },
  onError: (error) => {           // Error handling
    console.error('Persistence error:', error);
  }
};
```

## Data Flow

### Save Process

1. **Trigger**: Form data changes or auto-save interval
2. **Filter**: Exclude transient fields (loading, errors)
3. **Serialize**: Convert to JSON string
4. **Checksum**: Generate data integrity hash
5. **Compress**: Apply compression if enabled
6. **Encrypt**: Apply encryption if enabled
7. **Store**: Save to sessionStorage with metadata

### Restore Process

1. **Retrieve**: Get data from sessionStorage
2. **Decrypt**: Apply decryption if enabled
3. **Decompress**: Apply decompression if enabled
4. **Verify**: Check version compatibility and data integrity
5. **Validate**: Ensure data hasn't expired
6. **Apply**: Restore data to store state

## Monitoring and Analytics

### Storage Usage Analytics

```typescript
const usageStats = sessionStorageManager.getUsageStats();
console.log('Storage Analytics:', {
  totalItems: usageStats.totalItems,
  totalSize: usageStats.totalSize,
  usagePercentage: usageStats.usagePercentage,
  oldestItem: usageStats.oldestItem,
  newestItem: usageStats.newestItem
});
```

### Persistence Statistics

```typescript
const { getPersistenceStats } = useRecipeStatePersistence();
const stats = getPersistenceStats();
console.log('Persistence Stats:', {
  lastSaved: stats.lastSaved,
  saveCount: stats.saveCount,
  restoreCount: stats.restoreCount,
  hasPersistedState: stats.hasPersistedState
});
```

### Visual Management Panel

**Keyboard Shortcut**: `Ctrl+Shift+D`

Features:
- Storage usage overview
- Individual item management
- Data export/import
- Cleanup expired items
- Analytics and insights

## Best Practices

### 1. Selective Persistence

```typescript
// ✅ Good: Exclude transient state
const config = {
  excludeFields: ['isLoading', 'error', 'streamingError', 'tempData']
};

// ❌ Bad: Persist everything
const config = {
  excludeFields: []
};
```

### 2. Debounced Saves

```typescript
// ✅ Good: Debounce form saves
useEffect(() => {
  const timeoutId = setTimeout(() => {
    saveFormDraft(stepName, formData);
  }, 1000);
  return () => clearTimeout(timeoutId);
}, [formData]);

// ❌ Bad: Save on every change
useEffect(() => {
  saveFormDraft(stepName, formData);
}, [formData]);
```

### 3. Error Handling

```typescript
// ✅ Good: Handle persistence errors gracefully
const config = {
  onError: (error) => {
    console.error('Persistence failed:', error);
    // Show user-friendly message
    showNotification('Auto-save temporarily unavailable');
  }
};

// ❌ Bad: Ignore errors
const config = {
  onError: undefined
};
```

### 4. Data Validation

```typescript
// ✅ Good: Validate restored data
const { restoreState } = useRecipeStatePersistence({
  onRestore: (data) => {
    if (validateRestoredData(data)) {
      applyRestoredData(data);
    } else {
      console.warn('Invalid restored data, using defaults');
    }
  }
});
```

## Performance Considerations

### Storage Optimization

- **Compression**: Reduces storage size by ~30-50%
- **Selective Fields**: Only persist necessary data
- **Cleanup**: Automatic removal of expired data
- **Debouncing**: Prevents excessive save operations

### Memory Management

- **Lazy Loading**: Load persistence data only when needed
- **Cleanup Intervals**: Regular cleanup of expired items
- **Size Monitoring**: Track storage usage and warn when approaching limits

## Troubleshooting

### Common Issues

1. **Data Not Persisting**
   - Check if sessionStorage is available
   - Verify configuration is correct
   - Check browser storage limits

2. **Restored Data Invalid**
   - Version mismatch between saved and current data
   - Data corruption or checksum failure
   - Expired data automatically cleaned up

3. **Performance Issues**
   - Too frequent saves (reduce save interval)
   - Large data objects (exclude unnecessary fields)
   - Storage quota exceeded (implement cleanup)

### Debug Commands

```javascript
// Check storage status
console.log(sessionStorageManager.getUsageStats());

// View all stored items
console.log(sessionStorageManager.getMetadata());

// Export all data
const data = sessionStorageManager.exportData();
console.log('Exported data:', data);

// Clear all data
sessionStorageManager.clear();
```

## Security Considerations

### Data Protection

- **Basic Encryption**: XOR-based obfuscation (not cryptographically secure)
- **Local Storage**: Data stays in browser, not transmitted
- **Automatic Cleanup**: Expired data is automatically removed
- **No Sensitive Data**: Avoid persisting passwords or tokens

### Privacy

- **Session-Only**: Data cleared when browser session ends
- **User Control**: Users can clear data manually
- **Transparent**: Clear indication of what data is saved

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
