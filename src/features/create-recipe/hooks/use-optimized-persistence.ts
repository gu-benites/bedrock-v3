/**
 * Optimized Persistence Hook
 * Advanced state persistence with intelligent strategies and performance optimization
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { createRecipePersistenceEngine, OptimizedPersistenceEngine } from '@/lib/storage/optimized-persistence-engine';
import type { RecipeWizardState } from '../types/recipe.types';

interface OptimizedPersistenceConfig {
  enabled: boolean;
  autoRestore: boolean;
  trackChanges: boolean;
  performanceMode: 'aggressive' | 'balanced' | 'conservative';
  onRestoreComplete?: (data: any) => void;
  onSaveComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface PersistenceStats {
  saveCount: number;
  restoreCount: number;
  errorCount: number;
  averageSaveTime: number;
  averageRestoreTime: number;
  compressionRatio: number;
  lastSaveSize: number;
  isEnabled: boolean;
}

export const useOptimizedPersistence = (config: Partial<OptimizedPersistenceConfig> = {}) => {
  const fullConfig: OptimizedPersistenceConfig = {
    enabled: true,
    autoRestore: true,
    trackChanges: true,
    performanceMode: 'balanced',
    ...config
  };

  const store = useRecipeStore();
  const engineRef = useRef<OptimizedPersistenceEngine>();
  const isRestoringRef = useRef(false);
  const lastStateRef = useRef<string>('');
  const changeTrackingRef = useRef<Map<string, any>>(new Map());

  // Initialize persistence engine
  const engine = useMemo(() => {
    if (!engineRef.current) {
      engineRef.current = createRecipePersistenceEngine();
    }
    return engineRef.current;
  }, []);

  /**
   * Get current persistable state
   */
  const getPersistableState = useCallback((): Partial<RecipeWizardState> => {
    const state = store;
    
    // Exclude transient fields
    const excludeFields = [
      'isLoading',
      'error',
      'streamingError',
      'isStreamingCauses',
      'isStreamingSymptoms',
      'isStreamingProperties',
      'isStreamingOils'
    ];

    const persistableState: any = {};
    Object.keys(state).forEach(key => {
      if (!excludeFields.includes(key) && typeof (state as any)[key] !== 'function') {
        persistableState[key] = (state as any)[key];
      }
    });

    return persistableState;
  }, [store]);

  /**
   * Save state with optimized strategy
   */
  const saveState = useCallback(async (): Promise<boolean> => {
    if (!fullConfig.enabled || isRestoringRef.current) return false;

    try {
      const state = getPersistableState();
      const success = await engine.saveState(state);
      
      if (success) {
        lastStateRef.current = JSON.stringify(state);
        fullConfig.onSaveComplete?.(state);
      }

      return success;
    } catch (error) {
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [fullConfig, engine, getPersistableState]);

  /**
   * Save specific field with strategy
   */
  const saveField = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    if (!fullConfig.enabled || isRestoringRef.current) return false;

    try {
      const state = getPersistableState();
      return await engine.saveField(fieldName, value, state);
    } catch (error) {
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [fullConfig, engine, getPersistableState]);

  /**
   * Restore state from persistence
   */
  const restoreState = useCallback(async (): Promise<boolean> => {
    if (!fullConfig.enabled) return false;

    try {
      isRestoringRef.current = true;
      const restoredData = await engine.restoreState();
      
      if (!restoredData) {
        isRestoringRef.current = false;
        return false;
      }

      // Apply restored data to store
      Object.entries(restoredData).forEach(([key, value]) => {
        if (key in store && typeof (store as any)[key] !== 'function') {
          (store as any)[key] = value;
        }
      });

      lastStateRef.current = JSON.stringify(restoredData);
      fullConfig.onRestoreComplete?.(restoredData);
      
      isRestoringRef.current = false;
      return true;
    } catch (error) {
      isRestoringRef.current = false;
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [fullConfig, engine, store]);

  /**
   * Clear all persisted data
   */
  const clearPersistedData = useCallback(async (): Promise<boolean> => {
    try {
      const success = await engine.clearAll();
      if (success) {
        lastStateRef.current = '';
        changeTrackingRef.current.clear();
      }
      return success;
    } catch (error) {
      fullConfig.onError?.(error as Error);
      return false;
    }
  }, [engine, fullConfig]);

  /**
   * Track field changes for intelligent persistence
   */
  const trackFieldChange = useCallback((fieldName: string, newValue: any, oldValue: any) => {
    if (!fullConfig.trackChanges) return;

    const changeInfo = {
      timestamp: Date.now(),
      newValue,
      oldValue,
      changeType: oldValue === undefined ? 'create' : newValue === undefined ? 'delete' : 'update'
    };

    changeTrackingRef.current.set(fieldName, changeInfo);

    // Trigger field-specific save based on performance mode
    switch (fullConfig.performanceMode) {
      case 'aggressive':
        // Save immediately for all changes
        saveField(fieldName, newValue);
        break;
      
      case 'balanced':
        // Save immediately for important fields, debounced for others
        const importantFields = ['healthConcern', 'demographics', 'currentStep'];
        if (importantFields.includes(fieldName)) {
          saveField(fieldName, newValue);
        }
        break;
      
      case 'conservative':
        // Only save on explicit save calls
        break;
    }
  }, [fullConfig, saveField]);

  /**
   * Get persistence statistics
   */
  const getStats = useCallback((): PersistenceStats => {
    const metrics = engine.getMetrics();
    const storageStats = engine.getStorageStats();

    return {
      saveCount: metrics.saveCount,
      restoreCount: metrics.restoreCount,
      errorCount: metrics.errorCount,
      averageSaveTime: storageStats.averageSaveTime,
      averageRestoreTime: storageStats.averageRestoreTime,
      compressionRatio: storageStats.compressionRatio,
      lastSaveSize: storageStats.totalSize,
      isEnabled: fullConfig.enabled
    };
  }, [engine, fullConfig.enabled]);

  /**
   * Check if state has changed since last save
   */
  const hasStateChanged = useCallback((): boolean => {
    const currentState = JSON.stringify(getPersistableState());
    return currentState !== lastStateRef.current;
  }, [getPersistableState]);

  /**
   * Get field change history
   */
  const getFieldChangeHistory = useCallback((fieldName?: string) => {
    if (fieldName) {
      return changeTrackingRef.current.get(fieldName);
    }
    return Object.fromEntries(changeTrackingRef.current);
  }, []);

  // Auto-restore on mount
  useEffect(() => {
    if (fullConfig.autoRestore && fullConfig.enabled) {
      restoreState();
    }
  }, [fullConfig.autoRestore, fullConfig.enabled, restoreState]);

  // Track store changes for intelligent persistence
  useEffect(() => {
    if (!fullConfig.trackChanges || !fullConfig.enabled) return;

    const currentState = getPersistableState();
    const currentStateString = JSON.stringify(currentState);
    
    // Only track if state actually changed
    if (currentStateString !== lastStateRef.current && !isRestoringRef.current) {
      // Compare with previous state to identify changed fields
      try {
        const previousState = lastStateRef.current ? JSON.parse(lastStateRef.current) : {};
        
        Object.keys(currentState).forEach(key => {
          const newValue = (currentState as any)[key];
          const oldValue = previousState[key];
          
          if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            trackFieldChange(key, newValue, oldValue);
          }
        });
      } catch (error) {
        // If comparison fails, just save the current state
        saveState();
      }
    }
  }, [store, fullConfig, getPersistableState, trackFieldChange, saveState]);

  // Periodic save based on performance mode
  useEffect(() => {
    if (!fullConfig.enabled) return;

    let interval: NodeJS.Timeout;

    switch (fullConfig.performanceMode) {
      case 'aggressive':
        // Save every 1 second if changed
        interval = setInterval(() => {
          if (hasStateChanged()) {
            saveState();
          }
        }, 1000);
        break;
      
      case 'balanced':
        // Save every 5 seconds if changed
        interval = setInterval(() => {
          if (hasStateChanged()) {
            saveState();
          }
        }, 5000);
        break;
      
      case 'conservative':
        // Save every 30 seconds if changed
        interval = setInterval(() => {
          if (hasStateChanged()) {
            saveState();
          }
        }, 30000);
        break;
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fullConfig, hasStateChanged, saveState]);

  // Save on page unload
  useEffect(() => {
    if (!fullConfig.enabled) return;

    const handleBeforeUnload = () => {
      if (hasStateChanged()) {
        // Synchronous save on page unload
        const state = getPersistableState();
        try {
          sessionStorage.setItem('recipe_wizard_emergency_backup', JSON.stringify(state));
        } catch (error) {
          console.error('Failed to create emergency backup:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [fullConfig.enabled, hasStateChanged, getPersistableState]);

  return {
    // Core operations
    saveState,
    saveField,
    restoreState,
    clearPersistedData,

    // State queries
    hasStateChanged,
    getStats,
    getFieldChangeHistory,

    // Configuration
    isEnabled: fullConfig.enabled,
    performanceMode: fullConfig.performanceMode,

    // Advanced features
    trackFieldChange,
    engine
  };
};

/**
 * Performance monitoring for persistence operations
 */
export class PersistencePerformanceMonitor {
  private operationTimes = new Map<string, number[]>();
  private operationCounts = new Map<string, number>();

  recordOperation(operationName: string, duration: number): void {
    // Update counts
    const currentCount = this.operationCounts.get(operationName) || 0;
    this.operationCounts.set(operationName, currentCount + 1);

    // Track timing
    const times = this.operationTimes.get(operationName) || [];
    times.push(duration);
    if (times.length > 100) times.shift();
    this.operationTimes.set(operationName, times);

    // Log slow operations
    if (duration > 50 && process.env.NODE_ENV === 'development') {
      console.warn(`🐌 Slow persistence: ${operationName} took ${duration.toFixed(2)}ms`);
    }
  }

  getReport(): {
    operationName: string;
    totalOperations: number;
    averageTime: number;
    maxTime: number;
  }[] {
    const report: any[] = [];

    for (const [operationName, count] of this.operationCounts) {
      const times = this.operationTimes.get(operationName) || [];
      const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;

      report.push({
        operationName,
        totalOperations: count,
        averageTime,
        maxTime
      });
    }

    return report.sort((a, b) => b.averageTime - a.averageTime);
  }

  clearMetrics(): void {
    this.operationTimes.clear();
    this.operationCounts.clear();
  }
}

// Global persistence performance monitor
export const persistencePerformanceMonitor = new PersistencePerformanceMonitor();

/**
 * Higher-order function to add monitoring to persistence operations
 */
export const withPersistenceMonitoring = <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  return operation().finally(() => {
    const duration = performance.now() - startTime;
    persistencePerformanceMonitor.recordOperation(operationName, duration);
  });
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).persistencePerformanceMonitor = persistencePerformanceMonitor;
}
