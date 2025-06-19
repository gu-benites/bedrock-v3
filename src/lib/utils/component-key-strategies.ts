/**
 * Component Key Strategies
 * Optimized key generation strategies to prevent unnecessary unmounting/mounting
 */

/**
 * Stable key generator for list items with consistent identity
 */
export class StableKeyGenerator {
  private keyCache = new Map<string, string>();
  private keyCounters = new Map<string, number>();

  /**
   * Generate stable key for list items based on content
   */
  generateStableKey(
    item: any,
    prefix: string,
    primaryField?: string,
    fallbackFields?: string[]
  ): string {
    // Use primary field if available and stable
    if (primaryField && item[primaryField]) {
      const primaryKey = `${prefix}-${item[primaryField]}`;
      if (this.isStableKey(primaryKey, item)) {
        return primaryKey;
      }
    }

    // Try fallback fields
    if (fallbackFields) {
      for (const field of fallbackFields) {
        if (item[field]) {
          const fallbackKey = `${prefix}-${field}-${item[field]}`;
          if (this.isStableKey(fallbackKey, item)) {
            return fallbackKey;
          }
        }
      }
    }

    // Generate content-based hash as last resort
    const contentHash = this.generateContentHash(item);
    const hashKey = `${prefix}-hash-${contentHash}`;
    
    // Cache the key for consistency
    this.keyCache.set(hashKey, JSON.stringify(item));
    return hashKey;
  }

  /**
   * Check if a key is stable (doesn't change for the same content)
   */
  private isStableKey(key: string, item: any): boolean {
    const cachedContent = this.keyCache.get(key);
    const currentContent = JSON.stringify(item);
    
    if (!cachedContent) {
      this.keyCache.set(key, currentContent);
      return true;
    }
    
    return cachedContent === currentContent;
  }

  /**
   * Generate content-based hash for stable keys
   */
  private generateContentHash(item: any): string {
    const content = JSON.stringify(item, Object.keys(item).sort());
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate sequential key for items without stable identifiers
   */
  generateSequentialKey(prefix: string, resetOnNewSession = true): string {
    if (resetOnNewSession) {
      // Reset counter for new sessions to maintain consistency
      const sessionKey = `${prefix}-session`;
      if (!this.keyCounters.has(sessionKey)) {
        this.keyCounters.set(prefix, 0);
        this.keyCounters.set(sessionKey, Date.now());
      }
    }

    const current = this.keyCounters.get(prefix) || 0;
    this.keyCounters.set(prefix, current + 1);
    return `${prefix}-${current}`;
  }

  /**
   * Clear cache for memory management
   */
  clearCache(prefix?: string): void {
    if (prefix) {
      // Clear only keys with specific prefix
      for (const [key] of this.keyCache) {
        if (key.startsWith(prefix)) {
          this.keyCache.delete(key);
        }
      }
      this.keyCounters.delete(prefix);
    } else {
      // Clear all cache
      this.keyCache.clear();
      this.keyCounters.clear();
    }
  }
}

// Global key generator instance
export const stableKeyGenerator = new StableKeyGenerator();

/**
 * Optimized key strategies for different component types
 */
export const ComponentKeyStrategies = {
  /**
   * Keys for AI streaming items (causes, symptoms, properties)
   */
  aiStreamingItem: (item: any, index: number, type: string) => {
    return stableKeyGenerator.generateStableKey(
      item,
      `ai-${type}`,
      `${type}_id`,
      [`${type}_name`, 'name_localized', 'name', 'title']
    );
  },

  /**
   * Keys for form components that should persist across renders
   */
  formComponent: (componentName: string, sessionId: string) => {
    return `form-${componentName}-${sessionId}`;
  },

  /**
   * Keys for step components in wizard
   */
  wizardStep: (step: string, sessionId: string) => {
    return `step-${step}-${sessionId}`;
  },

  /**
   * Keys for modal components
   */
  modal: (modalType: string, isOpen: boolean, contentHash?: string) => {
    // Include content hash to prevent unnecessary remounting with same content
    const baseKey = `modal-${modalType}`;
    return contentHash ? `${baseKey}-${contentHash}` : baseKey;
  },

  /**
   * Keys for list items with selection state
   */
  selectableListItem: (item: any, type: string, isSelected: boolean) => {
    const baseKey = stableKeyGenerator.generateStableKey(
      item,
      `selectable-${type}`,
      `${type}_id`,
      [`${type}_name`, 'name', 'title']
    );
    // Don't include selection state in key to prevent remounting
    return baseKey;
  },

  /**
   * Keys for skeleton loading components
   */
  skeleton: (type: string, index: number) => {
    return `skeleton-${type}-${index}`;
  },

  /**
   * Keys for dynamic content that changes frequently
   */
  dynamicContent: (contentType: string, stableId: string) => {
    return `dynamic-${contentType}-${stableId}`;
  }
};

/**
 * Hook for managing component keys with automatic cleanup
 */
export const useComponentKeys = (componentName: string) => {
  const sessionId = React.useRef(Date.now().toString(36)).current;

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stableKeyGenerator.clearCache(componentName);
    };
  }, [componentName]);

  return {
    sessionId,
    generateKey: (type: string, item?: any, index?: number) => {
      if (item) {
        return ComponentKeyStrategies.aiStreamingItem(item, index || 0, type);
      }
      return ComponentKeyStrategies.formComponent(type, sessionId);
    },
    generateStableKey: (item: any, type: string) => {
      return stableKeyGenerator.generateStableKey(item, `${componentName}-${type}`);
    }
  };
};

/**
 * Performance monitoring for key stability
 */
export class KeyStabilityMonitor {
  private keyChanges = new Map<string, number>();
  private componentMounts = new Map<string, number>();

  recordKeyChange(componentName: string, oldKey: string, newKey: string): void {
    if (oldKey !== newKey) {
      const changes = this.keyChanges.get(componentName) || 0;
      this.keyChanges.set(componentName, changes + 1);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🔑 Key change detected in ${componentName}: ${oldKey} → ${newKey}`);
      }
    }
  }

  recordComponentMount(componentName: string): void {
    const mounts = this.componentMounts.get(componentName) || 0;
    this.componentMounts.set(componentName, mounts + 1);
  }

  getStabilityReport(): {
    componentName: string;
    keyChanges: number;
    componentMounts: number;
    stabilityScore: number;
  }[] {
    const report: any[] = [];
    
    for (const [componentName, changes] of this.keyChanges) {
      const mounts = this.componentMounts.get(componentName) || 0;
      const stabilityScore = mounts > 0 ? (1 - changes / mounts) * 100 : 100;
      
      report.push({
        componentName,
        keyChanges: changes,
        componentMounts: mounts,
        stabilityScore: Math.max(0, stabilityScore)
      });
    }
    
    return report.sort((a, b) => a.stabilityScore - b.stabilityScore);
  }

  clearMetrics(): void {
    this.keyChanges.clear();
    this.componentMounts.clear();
  }
}

// Global key stability monitor
export const keyStabilityMonitor = new KeyStabilityMonitor();

/**
 * React hook for monitoring key stability
 */
export const useKeyStabilityMonitor = (componentName: string, currentKey: string) => {
  const previousKey = React.useRef<string>(currentKey);

  React.useEffect(() => {
    keyStabilityMonitor.recordComponentMount(componentName);
  }, [componentName]);

  React.useEffect(() => {
    if (previousKey.current !== currentKey) {
      keyStabilityMonitor.recordKeyChange(componentName, previousKey.current, currentKey);
      previousKey.current = currentKey;
    }
  }, [componentName, currentKey]);

  return {
    getStabilityReport: () => keyStabilityMonitor.getStabilityReport(),
    clearMetrics: () => keyStabilityMonitor.clearMetrics()
  };
};

/**
 * Utility functions for common key patterns
 */
export const KeyUtils = {
  /**
   * Create stable key for items that might not have IDs
   */
  createStableItemKey: (item: any, prefix: string, index: number) => {
    // Try to use stable fields first
    const stableFields = ['id', 'uuid', 'key', 'name', 'title'];
    for (const field of stableFields) {
      if (item[field] && typeof item[field] === 'string') {
        return `${prefix}-${item[field]}`;
      }
    }
    
    // Fall back to content hash + index for stability
    const contentHash = stableKeyGenerator.generateContentHash(item);
    return `${prefix}-${contentHash}-${index}`;
  },

  /**
   * Create key that persists across re-renders but resets on data change
   */
  createPersistentKey: (baseKey: string, dataVersion: string | number) => {
    return `${baseKey}-v${dataVersion}`;
  },

  /**
   * Create key for conditional components
   */
  createConditionalKey: (baseKey: string, condition: boolean, alternativeKey?: string) => {
    return condition ? baseKey : (alternativeKey || `${baseKey}-hidden`);
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).componentKeyStrategies = {
    stableKeyGenerator,
    keyStabilityMonitor,
    ComponentKeyStrategies,
    KeyUtils
  };
}
