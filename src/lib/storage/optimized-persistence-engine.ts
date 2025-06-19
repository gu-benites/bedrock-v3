/**
 * Optimized Persistence Engine
 * Advanced state persistence with intelligent caching, compression, and performance optimization
 */

import { produce } from 'immer';
import { sessionStorageManager } from './session-storage-manager';

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================

export interface PersistenceStrategy {
  type: 'immediate' | 'debounced' | 'batched' | 'selective';
  interval?: number;
  batchSize?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface PersistenceRule {
  field: string;
  strategy: PersistenceStrategy;
  condition?: (value: any, state: any) => boolean;
  transform?: (value: any) => any;
  restore?: (value: any) => any;
}

export interface PersistenceConfig {
  storeName: string;
  version: string;
  rules: PersistenceRule[];
  enableCompression: boolean;
  enableEncryption: boolean;
  maxAge: number;
  fallbackStorage?: 'localStorage' | 'indexedDB';
  onError?: (error: Error) => void;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
}

export interface PersistenceMetrics {
  saveCount: number;
  restoreCount: number;
  errorCount: number;
  totalSaveTime: number;
  totalRestoreTime: number;
  compressionRatio: number;
  lastSaveSize: number;
  lastRestoreSize: number;
}

// ============================================================================
// OPTIMIZED PERSISTENCE ENGINE
// ============================================================================

export class OptimizedPersistenceEngine {
  private config: PersistenceConfig;
  private metrics: PersistenceMetrics;
  private saveQueue: Map<string, any> = new Map();
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private lastSavedState: Map<string, string> = new Map();
  private compressionCache: Map<string, string> = new Map();

  constructor(config: PersistenceConfig) {
    this.config = config;
    this.metrics = {
      saveCount: 0,
      restoreCount: 0,
      errorCount: 0,
      totalSaveTime: 0,
      totalRestoreTime: 0,
      compressionRatio: 1,
      lastSaveSize: 0,
      lastRestoreSize: 0
    };
  }

  /**
   * Save state with optimized strategy
   */
  async saveState(state: any): Promise<boolean> {
    const startTime = performance.now();

    try {
      const processedData = await this.processStateForSaving(state);
      const success = await this.persistData(processedData);

      if (success) {
        this.metrics.saveCount++;
        this.metrics.totalSaveTime += performance.now() - startTime;
        this.metrics.lastSaveSize = JSON.stringify(processedData).length;
        this.config.onSave?.(processedData);
      }

      return success;
    } catch (error) {
      this.metrics.errorCount++;
      this.config.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Restore state with optimization
   */
  async restoreState(): Promise<any | null> {
    const startTime = performance.now();

    try {
      const rawData = await this.retrieveData();
      if (!rawData) return null;

      const processedData = await this.processStateForRestoring(rawData);
      
      this.metrics.restoreCount++;
      this.metrics.totalRestoreTime += performance.now() - startTime;
      this.metrics.lastRestoreSize = JSON.stringify(rawData).length;
      this.config.onRestore?.(processedData);

      return processedData;
    } catch (error) {
      this.metrics.errorCount++;
      this.config.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Save specific field with strategy
   */
  async saveField(fieldName: string, value: any, state: any): Promise<boolean> {
    const rule = this.config.rules.find(r => r.field === fieldName);
    if (!rule) return false;

    // Check condition
    if (rule.condition && !rule.condition(value, state)) {
      return false;
    }

    // Transform value if needed
    const transformedValue = rule.transform ? rule.transform(value) : value;

    switch (rule.strategy.type) {
      case 'immediate':
        return this.saveFieldImmediate(fieldName, transformedValue);

      case 'debounced':
        return this.saveFieldDebounced(fieldName, transformedValue, rule.strategy.interval || 1000);

      case 'batched':
        return this.saveFieldBatched(fieldName, transformedValue, rule.strategy.batchSize || 5);

      case 'selective':
        return this.saveFieldSelective(fieldName, transformedValue, state);

      default:
        return false;
    }
  }

  /**
   * Process state for saving with rules
   */
  private async processStateForSaving(state: any): Promise<any> {
    const processedState: any = {};

    for (const rule of this.config.rules) {
      const value = this.getNestedValue(state, rule.field);
      if (value !== undefined) {
        // Apply condition check
        if (rule.condition && !rule.condition(value, state)) {
          continue;
        }

        // Apply transformation
        const transformedValue = rule.transform ? rule.transform(value) : value;
        this.setNestedValue(processedState, rule.field, transformedValue);
      }
    }

    return processedState;
  }

  /**
   * Process state for restoring with rules
   */
  private async processStateForRestoring(rawData: any): Promise<any> {
    const processedState: any = {};

    for (const rule of this.config.rules) {
      const value = this.getNestedValue(rawData, rule.field);
      if (value !== undefined) {
        // Apply restore transformation
        const restoredValue = rule.restore ? rule.restore(value) : value;
        this.setNestedValue(processedState, rule.field, restoredValue);
      }
    }

    return processedState;
  }

  /**
   * Immediate field save
   */
  private async saveFieldImmediate(fieldName: string, value: any): Promise<boolean> {
    const key = `${this.config.storeName}_field_${fieldName}`;
    return sessionStorageManager.setItem(key, value);
  }

  /**
   * Debounced field save
   */
  private async saveFieldDebounced(fieldName: string, value: any, delay: number): Promise<boolean> {
    const timeoutKey = `${this.config.storeName}_${fieldName}`;
    
    // Clear existing timeout
    if (this.saveTimeouts.has(timeoutKey)) {
      clearTimeout(this.saveTimeouts.get(timeoutKey)!);
    }

    // Set new timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        const success = await this.saveFieldImmediate(fieldName, value);
        this.saveTimeouts.delete(timeoutKey);
        resolve(success);
      }, delay);

      this.saveTimeouts.set(timeoutKey, timeout);
    });
  }

  /**
   * Batched field save
   */
  private async saveFieldBatched(fieldName: string, value: any, batchSize: number): Promise<boolean> {
    this.saveQueue.set(fieldName, value);

    if (this.saveQueue.size >= batchSize) {
      return this.flushSaveQueue();
    }

    return true; // Queued successfully
  }

  /**
   * Selective field save (only if changed)
   */
  private async saveFieldSelective(fieldName: string, value: any, state: any): Promise<boolean> {
    const valueString = JSON.stringify(value);
    const lastSaved = this.lastSavedState.get(fieldName);

    if (lastSaved === valueString) {
      return true; // No change, skip save
    }

    const success = await this.saveFieldImmediate(fieldName, value);
    if (success) {
      this.lastSavedState.set(fieldName, valueString);
    }

    return success;
  }

  /**
   * Flush save queue
   */
  private async flushSaveQueue(): Promise<boolean> {
    if (this.saveQueue.size === 0) return true;

    const batchData = Object.fromEntries(this.saveQueue);
    const key = `${this.config.storeName}_batch`;
    
    const success = sessionStorageManager.setItem(key, batchData);
    
    if (success) {
      this.saveQueue.clear();
    }

    return success;
  }

  /**
   * Persist data with compression and encryption
   */
  private async persistData(data: any): Promise<boolean> {
    const key = `${this.config.storeName}_state`;
    
    if (this.config.enableCompression) {
      const originalSize = JSON.stringify(data).length;
      const compressed = await this.compressData(data);
      const compressedSize = compressed.length;
      this.metrics.compressionRatio = originalSize / compressedSize;
      
      return sessionStorageManager.setItem(key, compressed, {
        maxAge: this.config.maxAge
      });
    }

    return sessionStorageManager.setItem(key, data, {
      maxAge: this.config.maxAge
    });
  }

  /**
   * Retrieve data with decompression and decryption
   */
  private async retrieveData(): Promise<any | null> {
    const key = `${this.config.storeName}_state`;
    const data = sessionStorageManager.getItem(key);

    if (!data) return null;

    if (this.config.enableCompression && typeof data === 'string') {
      return this.decompressData(data);
    }

    return data;
  }

  /**
   * Compress data using LZ-string algorithm simulation
   */
  private async compressData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const cacheKey = this.generateCacheKey(jsonString);
    
    if (this.compressionCache.has(cacheKey)) {
      return this.compressionCache.get(cacheKey)!;
    }

    // Simple compression simulation (in real implementation, use LZ-string)
    const compressed = btoa(jsonString);
    this.compressionCache.set(cacheKey, compressed);
    
    return compressed;
  }

  /**
   * Decompress data
   */
  private async decompressData(compressedData: string): Promise<any> {
    try {
      const decompressed = atob(compressedData);
      return JSON.parse(decompressed);
    } catch (error) {
      throw new Error('Failed to decompress data');
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Generate cache key for compression
   */
  private generateCacheKey(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PersistenceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all persisted data
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = [
        `${this.config.storeName}_state`,
        `${this.config.storeName}_batch`,
        ...this.config.rules.map(rule => `${this.config.storeName}_field_${rule.field}`)
      ];

      for (const key of keys) {
        sessionStorageManager.removeItem(key);
      }

      this.saveQueue.clear();
      this.lastSavedState.clear();
      this.compressionCache.clear();

      // Clear timeouts
      for (const timeout of this.saveTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.saveTimeouts.clear();

      return true;
    } catch (error) {
      this.config.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalSize: number;
    itemCount: number;
    compressionRatio: number;
    averageSaveTime: number;
    averageRestoreTime: number;
  } {
    return {
      totalSize: this.metrics.lastSaveSize,
      itemCount: this.config.rules.length,
      compressionRatio: this.metrics.compressionRatio,
      averageSaveTime: this.metrics.saveCount > 0 
        ? this.metrics.totalSaveTime / this.metrics.saveCount 
        : 0,
      averageRestoreTime: this.metrics.restoreCount > 0 
        ? this.metrics.totalRestoreTime / this.metrics.restoreCount 
        : 0
    };
  }
}

// ============================================================================
// RECIPE-SPECIFIC PERSISTENCE CONFIGURATION
// ============================================================================

export const createRecipePersistenceEngine = () => {
  const config: PersistenceConfig = {
    storeName: 'recipe_wizard',
    version: '2.0.0',
    enableCompression: true,
    enableEncryption: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    rules: [
      // Health concern - immediate save
      {
        field: 'healthConcern',
        strategy: { type: 'immediate', priority: 'high' },
        condition: (value) => value !== null,
        transform: (value) => ({ ...value, savedAt: Date.now() })
      },

      // Demographics - debounced save
      {
        field: 'demographics',
        strategy: { type: 'debounced', interval: 2000, priority: 'high' },
        condition: (value) => value !== null,
        transform: (value) => ({ ...value, savedAt: Date.now() })
      },

      // Selected causes - selective save (only if changed)
      {
        field: 'selectedCauses',
        strategy: { type: 'selective', priority: 'medium' },
        condition: (value) => Array.isArray(value) && value.length > 0,
        transform: (value) => value.map((cause: any) => ({
          ...cause,
          selectedAt: cause.selectedAt || Date.now()
        }))
      },

      // Selected symptoms - selective save
      {
        field: 'selectedSymptoms',
        strategy: { type: 'selective', priority: 'medium' },
        condition: (value) => Array.isArray(value) && value.length > 0,
        transform: (value) => value.map((symptom: any) => ({
          ...symptom,
          selectedAt: symptom.selectedAt || Date.now()
        }))
      },

      // Therapeutic properties - batched save
      {
        field: 'therapeuticProperties',
        strategy: { type: 'batched', batchSize: 3, priority: 'low' },
        condition: (value) => Array.isArray(value) && value.length > 0
      },

      // Current step - immediate save
      {
        field: 'currentStep',
        strategy: { type: 'immediate', priority: 'high' }
      },

      // Completed steps - immediate save
      {
        field: 'completedSteps',
        strategy: { type: 'immediate', priority: 'medium' }
      },

      // Session metadata
      {
        field: 'sessionId',
        strategy: { type: 'immediate', priority: 'high' }
      },

      {
        field: 'lastUpdated',
        strategy: { type: 'debounced', interval: 5000, priority: 'low' },
        transform: (value) => value instanceof Date ? value.toISOString() : value,
        restore: (value) => typeof value === 'string' ? new Date(value) : value
      }
    ],
    onError: (error) => {
      console.error('Persistence error:', error);
    },
    onSave: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Optimized persistence save:', Object.keys(data));
      }
    },
    onRestore: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📂 Optimized persistence restore:', Object.keys(data));
      }
    }
  };

  return new OptimizedPersistenceEngine(config);
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).recipePersistenceEngine = createRecipePersistenceEngine();
}
