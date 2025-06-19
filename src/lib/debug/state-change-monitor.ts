/**
 * State Change Monitor
 * Comprehensive debugging tools for tracking and visualizing state changes
 */

interface StateChange {
  id: string;
  timestamp: number;
  action: string;
  storeName: string;
  previousState: any;
  newState: any;
  diff: any;
  stackTrace?: string;
  componentName?: string;
  renderCount?: number;
}

interface StateSnapshot {
  timestamp: number;
  storeName: string;
  state: any;
  action: string;
}

interface PerformanceMetrics {
  stateChangeCount: number;
  averageChangeTime: number;
  slowestChanges: StateChange[];
  frequentActions: Map<string, number>;
  renderTriggers: Map<string, number>;
}

class StateChangeMonitor {
  private changes: StateChange[] = [];
  private snapshots: StateSnapshot[] = [];
  private isEnabled: boolean = false;
  private maxHistorySize: number = 1000;
  private performanceThreshold: number = 5; // ms
  private subscribers: Set<(change: StateChange) => void> = new Set();

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Record a state change
   */
  recordStateChange(
    storeName: string,
    action: string,
    previousState: any,
    newState: any,
    componentName?: string
  ): void {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    
    const change: StateChange = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      storeName,
      previousState: this.deepClone(previousState),
      newState: this.deepClone(newState),
      diff: this.calculateDiff(previousState, newState),
      stackTrace: this.captureStackTrace(),
      componentName,
      renderCount: this.getRenderCount(componentName)
    };

    const changeTime = performance.now() - startTime;
    
    // Log slow state changes
    if (changeTime > this.performanceThreshold) {
      console.warn(`🐌 Slow state change: ${storeName}.${action} took ${changeTime.toFixed(2)}ms`);
    }

    this.changes.push(change);
    this.trimHistory();

    // Create snapshot
    this.snapshots.push({
      timestamp: change.timestamp,
      storeName,
      state: this.deepClone(newState),
      action
    });

    // Notify subscribers
    this.subscribers.forEach(callback => callback(change));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logStateChange(change);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (change: StateChange) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get all state changes
   */
  getChanges(filter?: {
    storeName?: string;
    action?: string;
    componentName?: string;
    timeRange?: { start: number; end: number };
  }): StateChange[] {
    let filtered = [...this.changes];

    if (filter) {
      if (filter.storeName) {
        filtered = filtered.filter(change => change.storeName === filter.storeName);
      }
      if (filter.action) {
        filtered = filtered.filter(change => change.action === filter.action);
      }
      if (filter.componentName) {
        filtered = filtered.filter(change => change.componentName === filter.componentName);
      }
      if (filter.timeRange) {
        filtered = filtered.filter(change => 
          change.timestamp >= filter.timeRange!.start && 
          change.timestamp <= filter.timeRange!.end
        );
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const frequentActions = new Map<string, number>();
    const renderTriggers = new Map<string, number>();
    const slowChanges: StateChange[] = [];

    this.changes.forEach(change => {
      const actionKey = `${change.storeName}.${change.action}`;
      frequentActions.set(actionKey, (frequentActions.get(actionKey) || 0) + 1);

      if (change.componentName) {
        renderTriggers.set(change.componentName, (renderTriggers.get(change.componentName) || 0) + 1);
      }

      // Track slow changes (placeholder - would need timing data)
      if (Object.keys(change.diff).length > 10) {
        slowChanges.push(change);
      }
    });

    return {
      stateChangeCount: this.changes.length,
      averageChangeTime: 0, // Would need timing data
      slowestChanges: slowChanges.slice(0, 10),
      frequentActions,
      renderTriggers
    };
  }

  /**
   * Get state snapshots
   */
  getSnapshots(storeName?: string): StateSnapshot[] {
    const filtered = storeName 
      ? this.snapshots.filter(snapshot => snapshot.storeName === storeName)
      : this.snapshots;
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Time travel to a specific state
   */
  getStateAtTime(storeName: string, timestamp: number): any {
    const snapshot = this.snapshots
      .filter(s => s.storeName === storeName && s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return snapshot ? snapshot.state : null;
  }

  /**
   * Clear all monitoring data
   */
  clear(): void {
    this.changes = [];
    this.snapshots = [];
  }

  /**
   * Export monitoring data
   */
  export(): {
    changes: StateChange[];
    snapshots: StateSnapshot[];
    metrics: PerformanceMetrics;
  } {
    return {
      changes: this.changes,
      snapshots: this.snapshots,
      metrics: this.getPerformanceMetrics()
    };
  }

  /**
   * Import monitoring data
   */
  import(data: { changes: StateChange[]; snapshots: StateSnapshot[] }): void {
    this.changes = data.changes || [];
    this.snapshots = data.snapshots || [];
  }

  // Private methods

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned: any = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
    return obj;
  }

  private calculateDiff(previous: any, current: any): any {
    const diff: any = {};

    // Simple diff implementation
    if (typeof previous === 'object' && typeof current === 'object') {
      const allKeys = new Set([...Object.keys(previous || {}), ...Object.keys(current || {})]);
      
      allKeys.forEach(key => {
        if (previous?.[key] !== current?.[key]) {
          diff[key] = {
            from: previous?.[key],
            to: current?.[key]
          };
        }
      });
    } else if (previous !== current) {
      diff.value = {
        from: previous,
        to: current
      };
    }

    return diff;
  }

  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3, 8).join('\n') : '';
  }

  private getRenderCount(componentName?: string): number {
    if (!componentName) return 0;
    
    // This would integrate with React DevTools or custom render tracking
    return 0;
  }

  private trimHistory(): void {
    if (this.changes.length > this.maxHistorySize) {
      this.changes = this.changes.slice(-this.maxHistorySize);
    }
    if (this.snapshots.length > this.maxHistorySize) {
      this.snapshots = this.snapshots.slice(-this.maxHistorySize);
    }
  }

  private logStateChange(change: StateChange): void {
    const hasChanges = Object.keys(change.diff).length > 0;
    
    if (hasChanges) {
      console.group(`🔄 State Change: ${change.storeName}.${change.action}`);
      console.log('📊 Diff:', change.diff);
      console.log('⏰ Timestamp:', new Date(change.timestamp).toISOString());
      if (change.componentName) {
        console.log('🧩 Component:', change.componentName);
      }
      console.groupEnd();
    }
  }
}

// Global state change monitor
export const stateChangeMonitor = new StateChangeMonitor();

/**
 * Higher-order function to wrap store actions with monitoring
 */
export const withStateMonitoring = <T extends (...args: any[]) => any>(
  storeName: string,
  actionName: string,
  action: T,
  getState: () => any
): T => {
  return ((...args: any[]) => {
    const previousState = getState();
    const result = action(...args);
    const newState = getState();
    
    stateChangeMonitor.recordStateChange(
      storeName,
      actionName,
      previousState,
      newState
    );
    
    return result;
  }) as T;
};

/**
 * React hook for monitoring component state changes
 */
export const useStateChangeMonitoring = (componentName: string, state: any) => {
  const previousStateRef = React.useRef(state);
  
  React.useEffect(() => {
    const previousState = previousStateRef.current;
    
    if (previousState !== state) {
      stateChangeMonitor.recordStateChange(
        'component',
        'setState',
        previousState,
        state,
        componentName
      );
    }
    
    previousStateRef.current = state;
  }, [componentName, state]);
};

/**
 * Zustand middleware for automatic state monitoring
 */
export const stateMonitoringMiddleware = (storeName: string) => 
  (config: any) => (set: any, get: any, api: any) => {
    const originalSet = set;
    
    const monitoredSet = (partial: any, replace?: boolean) => {
      const previousState = get();
      const result = originalSet(partial, replace);
      const newState = get();
      
      // Determine action name from stack trace or use generic name
      const actionName = 'setState';
      
      stateChangeMonitor.recordStateChange(
        storeName,
        actionName,
        previousState,
        newState
      );
      
      return result;
    };
    
    return config(monitoredSet, get, api);
  };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).stateChangeMonitor = stateChangeMonitor;
}
