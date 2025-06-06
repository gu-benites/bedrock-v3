/**
 * @fileoverview Local storage utility functions for Essential Oil Recipe Creator.
 * Provides type-safe storage with 7-day data retention and error handling.
 */

import React from 'react';

/**
 * Storage key prefix for recipe data
 */
const STORAGE_PREFIX = 'recipe-creator';

/**
 * Data retention period (7 days in milliseconds)
 */
const RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000;

/**
 * Storage item interface with metadata
 */
interface StorageItem<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt: number;
}

/**
 * Storage utility class
 */
export class RecipeStorage {
  private static version = '1.0.0';

  /**
   * Check if localStorage is available
   */
  private static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate storage key with prefix
   */
  private static getKey(key: string): string {
    return `${STORAGE_PREFIX}:${key}`;
  }

  /**
   * Set item in localStorage with metadata
   */
  static setItem<T>(key: string, data: T): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const now = Date.now();
      const item: StorageItem<T> = {
        data,
        timestamp: now,
        version: this.version,
        expiresAt: now + RETENTION_PERIOD
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  /**
   * Get item from localStorage with expiration check
   */
  static getItem<T>(key: string): T | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const rawItem = localStorage.getItem(this.getKey(key));
      if (!rawItem) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(rawItem);
      const now = Date.now();

      // Check if item has expired
      if (now > item.expiresAt) {
        this.removeItem(key);
        return null;
      }

      // Check version compatibility (optional migration logic)
      if (item.version !== this.version) {
        console.warn(`Storage version mismatch for key ${key}. Expected ${this.version}, got ${item.version}`);
        // For now, we'll still return the data, but you could add migration logic here
      }

      return item.data;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      this.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  }

  /**
   * Clear all recipe-related data
   */
  static clearAll(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      const recipeKeys = keys.filter(key => key.startsWith(`${STORAGE_PREFIX}:`));
      
      recipeKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get all recipe-related keys
   */
  static getKeys(): string[] {
    if (!this.isStorageAvailable()) {
      return [];
    }

    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(`${STORAGE_PREFIX}:`))
        .map(key => key.replace(`${STORAGE_PREFIX}:`, ''));
    } catch (error) {
      console.error('Failed to get keys from localStorage:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    totalKeys: number;
    totalSize: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  } {
    const keys = this.getKeys();
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    keys.forEach(key => {
      try {
        const rawItem = localStorage.getItem(this.getKey(key));
        if (rawItem) {
          totalSize += rawItem.length;
          const item: StorageItem<any> = JSON.parse(rawItem);
          oldestTimestamp = Math.min(oldestTimestamp, item.timestamp);
          newestTimestamp = Math.max(newestTimestamp, item.timestamp);
        }
      } catch {
        // Ignore corrupted items
      }
    });

    return {
      totalKeys: keys.length,
      totalSize,
      oldestItem: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestItem: newestTimestamp === 0 ? null : new Date(newestTimestamp)
    };
  }

  /**
   * Clean up expired items
   */
  static cleanupExpired(): number {
    if (!this.isStorageAvailable()) {
      return 0;
    }

    const keys = this.getKeys();
    let cleanedCount = 0;
    const now = Date.now();

    keys.forEach(key => {
      try {
        const rawItem = localStorage.getItem(this.getKey(key));
        if (rawItem) {
          const item: StorageItem<any> = JSON.parse(rawItem);
          if (now > item.expiresAt) {
            this.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        // Remove corrupted items
        this.removeItem(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Check if an item exists and is not expired
   */
  static hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Update item expiration time
   */
  static refreshItem(key: string): boolean {
    const data = this.getItem(key);
    if (data === null) {
      return false;
    }

    return this.setItem(key, data);
  }
}

/**
 * Specific storage keys for recipe data
 */
export const RECIPE_STORAGE_KEYS = {
  HEALTH_CONCERN: 'health-concern',
  DEMOGRAPHICS: 'demographics',
  SELECTED_CAUSES: 'selected-causes',
  SELECTED_SYMPTOMS: 'selected-symptoms',
  THERAPEUTIC_PROPERTIES: 'therapeutic-properties',
  SUGGESTED_OILS: 'suggested-oils',
  CURRENT_STEP: 'current-step',
  COMPLETED_STEPS: 'completed-steps',
  SESSION_ID: 'session-id',
  POTENTIAL_CAUSES: 'potential-causes',
  POTENTIAL_SYMPTOMS: 'potential-symptoms'
} as const;

/**
 * Type-safe storage functions for specific recipe data
 */
export const recipeStorage = {
  // Health concern
  setHealthConcern: (data: any) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.HEALTH_CONCERN, data),
  getHealthConcern: () => RecipeStorage.getItem(RECIPE_STORAGE_KEYS.HEALTH_CONCERN),

  // Demographics
  setDemographics: (data: any) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.DEMOGRAPHICS, data),
  getDemographics: () => RecipeStorage.getItem(RECIPE_STORAGE_KEYS.DEMOGRAPHICS),

  // Selected causes
  setSelectedCauses: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.SELECTED_CAUSES, data),
  getSelectedCauses: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.SELECTED_CAUSES) || [],

  // Selected symptoms
  setSelectedSymptoms: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.SELECTED_SYMPTOMS, data),
  getSelectedSymptoms: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.SELECTED_SYMPTOMS) || [],

  // Therapeutic properties
  setTherapeuticProperties: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.THERAPEUTIC_PROPERTIES, data),
  getTherapeuticProperties: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.THERAPEUTIC_PROPERTIES) || [],

  // Suggested oils
  setSuggestedOils: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.SUGGESTED_OILS, data),
  getSuggestedOils: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.SUGGESTED_OILS) || [],

  // Current step
  setCurrentStep: (step: string) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.CURRENT_STEP, step),
  getCurrentStep: () => RecipeStorage.getItem<string>(RECIPE_STORAGE_KEYS.CURRENT_STEP),

  // Completed steps
  setCompletedSteps: (steps: string[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.COMPLETED_STEPS, steps),
  getCompletedSteps: () => RecipeStorage.getItem<string[]>(RECIPE_STORAGE_KEYS.COMPLETED_STEPS) || [],

  // Session ID
  setSessionId: (id: string) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.SESSION_ID, id),
  getSessionId: () => RecipeStorage.getItem<string>(RECIPE_STORAGE_KEYS.SESSION_ID),

  // Potential causes (cache)
  setPotentialCauses: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.POTENTIAL_CAUSES, data),
  getPotentialCauses: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.POTENTIAL_CAUSES) || [],

  // Potential symptoms (cache)
  setPotentialSymptoms: (data: any[]) => RecipeStorage.setItem(RECIPE_STORAGE_KEYS.POTENTIAL_SYMPTOMS, data),
  getPotentialSymptoms: () => RecipeStorage.getItem<any[]>(RECIPE_STORAGE_KEYS.POTENTIAL_SYMPTOMS) || [],

  // Utility functions
  clearAll: () => RecipeStorage.clearAll(),
  getStorageInfo: () => RecipeStorage.getStorageInfo(),
  cleanupExpired: () => RecipeStorage.cleanupExpired()
};

/**
 * Hook for automatic cleanup on app initialization
 */
export function useStorageCleanup() {
  React.useEffect(() => {
    // Clean up expired items on app start
    const cleanedCount = RecipeStorage.cleanupExpired();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired storage items`);
    }
  }, []);
}

// Auto-cleanup on module load (for non-React usage)
if (typeof window !== 'undefined') {
  // Run cleanup when the module is loaded
  setTimeout(() => {
    RecipeStorage.cleanupExpired();
  }, 1000);
}
