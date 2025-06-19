/**
 * Memo Comparison Functions
 * Custom comparison functions for React.memo to optimize expensive components
 */

/**
 * Shallow comparison for objects
 */
export const shallowEqual = <T extends Record<string, any>>(a: T, b: T): boolean => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
};

/**
 * Deep comparison for nested objects (limited depth for performance)
 */
export const deepEqual = (a: any, b: any, maxDepth = 3, currentDepth = 0): boolean => {
  if (currentDepth >= maxDepth) return a === b;
  
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index], maxDepth, currentDepth + 1));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && deepEqual(a[key], b[key], maxDepth, currentDepth + 1)
    );
  }
  
  return false;
};

/**
 * Array comparison with item-level comparison
 */
export const arrayEqual = <T>(
  a: T[], 
  b: T[], 
  itemComparator: (itemA: T, itemB: T) => boolean = (x, y) => x === y
): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => itemComparator(item, b[index]));
};

/**
 * Comparison functions for specific component types
 */
export const MemoComparisons = {
  /**
   * AI Streaming Modal comparison
   * Optimized for streaming data that changes frequently
   */
  aiStreamingModal: (
    prevProps: {
      isOpen: boolean;
      title: string;
      description: string;
      items: any[];
      analysisType?: string;
      className?: string;
    },
    nextProps: {
      isOpen: boolean;
      title: string;
      description: string;
      items: any[];
      analysisType?: string;
      className?: string;
    }
  ): boolean => {
    // Quick checks for primitive props
    if (
      prevProps.isOpen !== nextProps.isOpen ||
      prevProps.title !== nextProps.title ||
      prevProps.description !== nextProps.description ||
      prevProps.analysisType !== nextProps.analysisType ||
      prevProps.className !== nextProps.className
    ) {
      return false;
    }

    // Optimized items comparison
    if (prevProps.items.length !== nextProps.items.length) {
      return false;
    }

    // For streaming, only compare the last few items for performance
    const compareCount = Math.min(10, prevProps.items.length);
    const startIndex = Math.max(0, prevProps.items.length - compareCount);
    
    for (let i = startIndex; i < prevProps.items.length; i++) {
      if (!shallowEqual(prevProps.items[i], nextProps.items[i])) {
        return false;
      }
    }

    return true;
  },

  /**
   * Form component comparison
   * Optimized for form data and validation states
   */
  formComponent: (
    prevProps: {
      data?: any;
      errors?: any;
      isLoading?: boolean;
      isSubmitting?: boolean;
      className?: string;
    },
    nextProps: {
      data?: any;
      errors?: any;
      isLoading?: boolean;
      isSubmitting?: boolean;
      className?: string;
    }
  ): boolean => {
    // Compare primitive props
    if (
      prevProps.isLoading !== nextProps.isLoading ||
      prevProps.isSubmitting !== nextProps.isSubmitting ||
      prevProps.className !== nextProps.className
    ) {
      return false;
    }

    // Compare data objects
    if (!shallowEqual(prevProps.data || {}, nextProps.data || {})) {
      return false;
    }

    // Compare errors
    if (!shallowEqual(prevProps.errors || {}, nextProps.errors || {})) {
      return false;
    }

    return true;
  },

  /**
   * Selection component comparison
   * Optimized for lists with selection state
   */
  selectionComponent: (
    prevProps: {
      items: any[];
      selectedIds: Set<string> | string[];
      onSelectionChange?: (ids: Set<string>) => void;
      isLoading?: boolean;
      className?: string;
    },
    nextProps: {
      items: any[];
      selectedIds: Set<string> | string[];
      onSelectionChange?: (ids: Set<string>) => void;
      isLoading?: boolean;
      className?: string;
    }
  ): boolean => {
    // Compare primitive props
    if (
      prevProps.isLoading !== nextProps.isLoading ||
      prevProps.className !== nextProps.className ||
      prevProps.onSelectionChange !== nextProps.onSelectionChange
    ) {
      return false;
    }

    // Compare items array length first (quick check)
    if (prevProps.items.length !== nextProps.items.length) {
      return false;
    }

    // Compare selection state
    const prevSelection = Array.isArray(prevProps.selectedIds) 
      ? new Set(prevProps.selectedIds) 
      : prevProps.selectedIds;
    const nextSelection = Array.isArray(nextProps.selectedIds) 
      ? new Set(nextProps.selectedIds) 
      : nextProps.selectedIds;

    if (prevSelection.size !== nextSelection.size) {
      return false;
    }

    for (const id of prevSelection) {
      if (!nextSelection.has(id)) {
        return false;
      }
    }

    // Compare items with optimized strategy
    // For large lists, compare only IDs and key fields
    if (prevProps.items.length > 50) {
      return prevProps.items.every((item, index) => {
        const nextItem = nextProps.items[index];
        return item.id === nextItem.id && 
               item.name === nextItem.name &&
               item.relevancy_score === nextItem.relevancy_score;
      });
    }

    // For smaller lists, do full comparison
    return arrayEqual(prevProps.items, nextProps.items, shallowEqual);
  },

  /**
   * Properties display comparison
   * Optimized for therapeutic properties with complex nested data
   */
  propertiesDisplay: (
    prevProps: {
      properties: any[];
      selectedCauses: any[];
      selectedSymptoms: any[];
      isLoading?: boolean;
      className?: string;
    },
    nextProps: {
      properties: any[];
      selectedCauses: any[];
      selectedSymptoms: any[];
      isLoading?: boolean;
      className?: string;
    }
  ): boolean => {
    // Compare primitive props
    if (
      prevProps.isLoading !== nextProps.isLoading ||
      prevProps.className !== nextProps.className
    ) {
      return false;
    }

    // Compare arrays by length first
    if (
      prevProps.properties.length !== nextProps.properties.length ||
      prevProps.selectedCauses.length !== nextProps.selectedCauses.length ||
      prevProps.selectedSymptoms.length !== nextProps.selectedSymptoms.length
    ) {
      return false;
    }

    // Compare properties with key fields only for performance
    if (!arrayEqual(prevProps.properties, nextProps.properties, (a, b) => 
      a.property_id === b.property_id && 
      a.property_name === b.property_name &&
      a.relevancy_score === b.relevancy_score
    )) {
      return false;
    }

    // Compare selected items by ID only
    if (!arrayEqual(prevProps.selectedCauses, nextProps.selectedCauses, (a, b) => 
      a.cause_id === b.cause_id
    )) {
      return false;
    }

    if (!arrayEqual(prevProps.selectedSymptoms, nextProps.selectedSymptoms, (a, b) => 
      a.symptom_id === b.symptom_id
    )) {
      return false;
    }

    return true;
  },

  /**
   * Wizard step comparison
   * Optimized for step components with session data
   */
  wizardStep: (
    prevProps: {
      step: string;
      sessionId: string;
      data?: any;
      isActive?: boolean;
      className?: string;
    },
    nextProps: {
      step: string;
      sessionId: string;
      data?: any;
      isActive?: boolean;
      className?: string;
    }
  ): boolean => {
    // Compare primitive props
    if (
      prevProps.step !== nextProps.step ||
      prevProps.sessionId !== nextProps.sessionId ||
      prevProps.isActive !== nextProps.isActive ||
      prevProps.className !== nextProps.className
    ) {
      return false;
    }

    // Compare data with shallow comparison
    return shallowEqual(prevProps.data || {}, nextProps.data || {});
  },

  /**
   * Performance monitoring comparison
   * Optimized for components with performance tracking
   */
  performanceMonitored: (
    prevProps: {
      children: React.ReactNode;
      id: string;
      enabled?: boolean;
      threshold?: number;
    },
    nextProps: {
      children: React.ReactNode;
      id: string;
      enabled?: boolean;
      threshold?: number;
    }
  ): boolean => {
    // Compare primitive props
    if (
      prevProps.id !== nextProps.id ||
      prevProps.enabled !== nextProps.enabled ||
      prevProps.threshold !== nextProps.threshold
    ) {
      return false;
    }

    // For children, use reference equality (React elements are stable when memoized)
    return prevProps.children === nextProps.children;
  }
};

/**
 * Generic memo comparison factory
 */
export const createMemoComparison = <T extends Record<string, any>>(
  config: {
    primitiveFields?: (keyof T)[];
    shallowFields?: (keyof T)[];
    deepFields?: (keyof T)[];
    arrayFields?: {
      field: keyof T;
      itemComparator?: (a: any, b: any) => boolean;
    }[];
    customComparisons?: {
      field: keyof T;
      comparator: (a: any, b: any) => boolean;
    }[];
  }
) => {
  return (prevProps: T, nextProps: T): boolean => {
    // Compare primitive fields
    if (config.primitiveFields) {
      for (const field of config.primitiveFields) {
        if (prevProps[field] !== nextProps[field]) {
          return false;
        }
      }
    }

    // Compare shallow fields
    if (config.shallowFields) {
      for (const field of config.shallowFields) {
        if (!shallowEqual(prevProps[field] || {}, nextProps[field] || {})) {
          return false;
        }
      }
    }

    // Compare deep fields
    if (config.deepFields) {
      for (const field of config.deepFields) {
        if (!deepEqual(prevProps[field], nextProps[field])) {
          return false;
        }
      }
    }

    // Compare array fields
    if (config.arrayFields) {
      for (const { field, itemComparator } of config.arrayFields) {
        if (!arrayEqual(
          prevProps[field] || [], 
          nextProps[field] || [], 
          itemComparator
        )) {
          return false;
        }
      }
    }

    // Custom comparisons
    if (config.customComparisons) {
      for (const { field, comparator } of config.customComparisons) {
        if (!comparator(prevProps[field], nextProps[field])) {
          return false;
        }
      }
    }

    return true;
  };
};

/**
 * Performance monitoring for memo comparisons
 */
export class MemoComparisonMonitor {
  private comparisonCounts = new Map<string, number>();
  private preventedRenders = new Map<string, number>();
  private comparisonTimes = new Map<string, number[]>();

  recordComparison(componentName: string, prevented: boolean, duration: number): void {
    // Update counts
    const currentCount = this.comparisonCounts.get(componentName) || 0;
    this.comparisonCounts.set(componentName, currentCount + 1);

    if (prevented) {
      const currentPrevented = this.preventedRenders.get(componentName) || 0;
      this.preventedRenders.set(componentName, currentPrevented + 1);
    }

    // Track timing
    const times = this.comparisonTimes.get(componentName) || [];
    times.push(duration);
    if (times.length > 100) times.shift(); // Keep last 100 measurements
    this.comparisonTimes.set(componentName, times);
  }

  getReport(): {
    componentName: string;
    totalComparisons: number;
    preventedRenders: number;
    preventionRate: number;
    averageComparisonTime: number;
  }[] {
    const report: any[] = [];

    for (const [componentName, totalComparisons] of this.comparisonCounts) {
      const preventedRenders = this.preventedRenders.get(componentName) || 0;
      const times = this.comparisonTimes.get(componentName) || [];
      const averageTime = times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0;

      report.push({
        componentName,
        totalComparisons,
        preventedRenders,
        preventionRate: totalComparisons > 0 ? (preventedRenders / totalComparisons) * 100 : 0,
        averageComparisonTime: averageTime
      });
    }

    return report.sort((a, b) => b.preventionRate - a.preventionRate);
  }

  clearMetrics(): void {
    this.comparisonCounts.clear();
    this.preventedRenders.clear();
    this.comparisonTimes.clear();
  }
}

// Global memo comparison monitor
export const memoComparisonMonitor = new MemoComparisonMonitor();

/**
 * Higher-order function to add monitoring to memo comparisons
 */
export const withMemoMonitoring = <T extends Record<string, any>>(
  componentName: string,
  comparisonFn: (prevProps: T, nextProps: T) => boolean
) => {
  return (prevProps: T, nextProps: T): boolean => {
    const startTime = performance.now();
    const result = comparisonFn(prevProps, nextProps);
    const duration = performance.now() - startTime;

    memoComparisonMonitor.recordComparison(componentName, result, duration);

    if (process.env.NODE_ENV === 'development' && duration > 5) {
      console.warn(`🐌 Slow memo comparison: ${componentName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  };
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).memoComparisonMonitor = memoComparisonMonitor;
}
