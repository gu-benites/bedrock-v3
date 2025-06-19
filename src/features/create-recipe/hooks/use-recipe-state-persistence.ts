/**
 * Recipe State Persistence Hook
 * Handles automatic state persistence and recovery for the create-recipe workflow
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { sessionStorageManager } from '@/lib/storage/session-storage-manager';
import type { RecipeWizardState } from '../types/recipe.types';

interface PersistenceConfig {
  enabled: boolean;
  autoSave: boolean;
  saveInterval: number; // milliseconds
  excludeFields: string[];
  onRestore?: (data: Partial<RecipeWizardState>) => void;
  onSave?: (data: Partial<RecipeWizardState>) => void;
  onError?: (error: Error) => void;
}

interface PersistenceMetadata {
  lastSaved: number;
  saveCount: number;
  restoreCount: number;
  sessionId: string;
  version: string;
}

const STORAGE_KEYS = {
  RECIPE_STATE: 'recipe_wizard_state',
  METADATA: 'recipe_persistence_metadata',
  FORM_DRAFTS: 'recipe_form_drafts'
} as const;

export const useRecipeStatePersistence = (config: Partial<PersistenceConfig> = {}) => {
  const fullConfig: PersistenceConfig = {
    enabled: true,
    autoSave: true,
    saveInterval: 5000, // Save every 5 seconds
    excludeFields: ['isLoading', 'error', 'streamingError'], // Don't persist transient state
    ...config
  };

  const store = useRecipeStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedStateRef = useRef<string>('');
  const metadataRef = useRef<PersistenceMetadata>({
    lastSaved: 0,
    saveCount: 0,
    restoreCount: 0,
    sessionId: store.sessionId,
    version: '1.0.0'
  });

  /**
   * Get persistable state (excluding transient fields)
   */
  const getPersistableState = useCallback((): Partial<RecipeWizardState> => {
    const state = store;
    const persistableState: any = {};

    Object.keys(state).forEach(key => {
      if (!fullConfig.excludeFields.includes(key) && typeof (state as any)[key] !== 'function') {
        persistableState[key] = (state as any)[key];
      }
    });

    return persistableState;
  }, [store, fullConfig.excludeFields]);

  /**
   * Save state to sessionStorage
   */
  const saveState = useCallback(async (): Promise<boolean> => {
    if (!fullConfig.enabled) return false;

    try {
      const persistableState = getPersistableState();
      const stateString = JSON.stringify(persistableState);

      // Skip save if state hasn't changed
      if (stateString === lastSavedStateRef.current) {
        return true;
      }

      const success = sessionStorageManager.setItem(STORAGE_KEYS.RECIPE_STATE, persistableState);
      
      if (success) {
        lastSavedStateRef.current = stateString;
        metadataRef.current.lastSaved = Date.now();
        metadataRef.current.saveCount++;

        // Save metadata
        sessionStorageManager.setItem(STORAGE_KEYS.METADATA, metadataRef.current);

        // Call onSave callback
        fullConfig.onSave?.(persistableState);

        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Recipe state saved to sessionStorage', {
            size: stateString.length,
            saveCount: metadataRef.current.saveCount
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to save recipe state:', error);
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [fullConfig, getPersistableState]);

  /**
   * Restore state from sessionStorage
   */
  const restoreState = useCallback(async (): Promise<boolean> => {
    if (!fullConfig.enabled) return false;

    try {
      const savedState = sessionStorageManager.getItem<Partial<RecipeWizardState>>(STORAGE_KEYS.RECIPE_STATE);
      const savedMetadata = sessionStorageManager.getItem<PersistenceMetadata>(STORAGE_KEYS.METADATA);

      if (!savedState) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📂 No saved recipe state found');
        }
        return false;
      }

      // Restore metadata
      if (savedMetadata) {
        metadataRef.current = {
          ...savedMetadata,
          restoreCount: savedMetadata.restoreCount + 1
        };
      }

      // Apply saved state to store
      Object.entries(savedState).forEach(([key, value]) => {
        if (key in store && typeof (store as any)[key] !== 'function') {
          (store as any)[key] = value;
        }
      });

      // Update last saved state reference
      lastSavedStateRef.current = JSON.stringify(getPersistableState());

      // Call onRestore callback
      fullConfig.onRestore?.(savedState);

      if (process.env.NODE_ENV === 'development') {
        console.log('📂 Recipe state restored from sessionStorage', {
          restoredFields: Object.keys(savedState),
          restoreCount: metadataRef.current.restoreCount,
          age: Date.now() - metadataRef.current.lastSaved
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to restore recipe state:', error);
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [fullConfig, store, getPersistableState]);

  /**
   * Clear persisted state
   */
  const clearPersistedState = useCallback((): boolean => {
    try {
      sessionStorageManager.removeItem(STORAGE_KEYS.RECIPE_STATE);
      sessionStorageManager.removeItem(STORAGE_KEYS.METADATA);
      sessionStorageManager.removeItem(STORAGE_KEYS.FORM_DRAFTS);
      
      lastSavedStateRef.current = '';
      metadataRef.current = {
        lastSaved: 0,
        saveCount: 0,
        restoreCount: 0,
        sessionId: store.sessionId,
        version: '1.0.0'
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cleared persisted recipe state');
      }

      return true;
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
      return false;
    }
  }, [store.sessionId]);

  /**
   * Save form draft for specific step
   */
  const saveFormDraft = useCallback((step: string, formData: any): boolean => {
    if (!fullConfig.enabled) return false;

    try {
      const drafts = sessionStorageManager.getItem<Record<string, any>>(STORAGE_KEYS.FORM_DRAFTS) || {};
      drafts[step] = {
        data: formData,
        timestamp: Date.now(),
        sessionId: store.sessionId
      };

      const success = sessionStorageManager.setItem(STORAGE_KEYS.FORM_DRAFTS, drafts);

      if (process.env.NODE_ENV === 'development' && success) {
        console.log(`💾 Form draft saved for step: ${step}`);
      }

      return success;
    } catch (error) {
      console.error('Failed to save form draft:', error);
      return false;
    }
  }, [fullConfig.enabled, store.sessionId]);

  /**
   * Get form draft for specific step
   */
  const getFormDraft = useCallback((step: string): any | null => {
    if (!fullConfig.enabled) return null;

    try {
      const drafts = sessionStorageManager.getItem<Record<string, any>>(STORAGE_KEYS.FORM_DRAFTS) || {};
      const draft = drafts[step];

      if (draft && draft.sessionId === store.sessionId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📂 Form draft found for step: ${step}`, {
            age: Date.now() - draft.timestamp
          });
        }
        return draft.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get form draft:', error);
      return null;
    }
  }, [fullConfig.enabled, store.sessionId]);

  /**
   * Get persistence statistics
   */
  const getPersistenceStats = useCallback(() => {
    const storageStats = sessionStorageManager.getUsageStats();
    
    return {
      ...metadataRef.current,
      storageStats,
      hasPersistedState: sessionStorageManager.hasItem(STORAGE_KEYS.RECIPE_STATE),
      lastSavedAge: metadataRef.current.lastSaved > 0 ? Date.now() - metadataRef.current.lastSaved : null
    };
  }, []);

  /**
   * Schedule auto-save
   */
  const scheduleAutoSave = useCallback(() => {
    if (!fullConfig.autoSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState();
    }, fullConfig.saveInterval);
  }, [fullConfig.autoSave, fullConfig.saveInterval, saveState]);

  // Auto-save when state changes
  useEffect(() => {
    if (fullConfig.autoSave) {
      scheduleAutoSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [store, scheduleAutoSave, fullConfig.autoSave]);

  // Restore state on mount
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (fullConfig.enabled) {
        saveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [fullConfig.enabled, saveState]);

  // Save state when page becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && fullConfig.enabled) {
        saveState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fullConfig.enabled, saveState]);

  return {
    saveState,
    restoreState,
    clearPersistedState,
    saveFormDraft,
    getFormDraft,
    getPersistenceStats,
    isEnabled: fullConfig.enabled,
    metadata: metadataRef.current
  };
};

/**
 * Hook for form-specific persistence
 */
export const useFormPersistence = (stepName: string, formData: any) => {
  const { saveFormDraft, getFormDraft } = useRecipeStatePersistence();

  // Auto-save form data when it changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        saveFormDraft(stepName, formData);
      }, 1000); // Debounce saves

      return () => clearTimeout(timeoutId);
    }
  }, [formData, stepName, saveFormDraft]);

  // Get initial form data
  const getInitialFormData = useCallback(() => {
    return getFormDraft(stepName);
  }, [stepName, getFormDraft]);

  return {
    getInitialFormData,
    saveFormDraft: (data: any) => saveFormDraft(stepName, data)
  };
};
