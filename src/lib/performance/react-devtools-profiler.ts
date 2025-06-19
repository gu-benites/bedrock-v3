/**
 * React DevTools Profiler Integration
 * Provides programmatic access to React DevTools profiling capabilities
 */

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

interface ProfilerSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  profiles: ProfilerData[];
  componentCounts: Map<string, number>;
  totalRenderTime: number;
  slowestComponents: Array<{ id: string; duration: number; phase: string }>;
}

interface DevToolsProfilerConfig {
  enabled: boolean;
  autoStart: boolean;
  sessionDuration: number; // Auto-stop after this duration (ms)
  slowComponentThreshold: number; // Mark components as slow if they exceed this (ms)
  maxSessions: number; // Maximum number of sessions to keep in memory
}

class ReactDevToolsProfiler {
  private sessions: Map<string, ProfilerSession> = new Map();
  private currentSession: ProfilerSession | null = null;
  private config: DevToolsProfilerConfig;
  private isRecording = false;

  constructor(config: Partial<DevToolsProfilerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      autoStart: false,
      sessionDuration: 30000, // 30 seconds
      slowComponentThreshold: 16, // 16ms (60fps threshold)
      maxSessions: 10,
      ...config
    };

    if (this.config.enabled && this.config.autoStart) {
      this.startProfiling();
    }
  }

  /**
   * Start a new profiling session
   */
  startProfiling(sessionId?: string): string {
    if (!this.config.enabled) {
      console.warn('React DevTools profiler is disabled');
      return '';
    }

    // Stop current session if running
    if (this.isRecording) {
      this.stopProfiling();
    }

    const id = sessionId || `session-${Date.now()}`;
    
    this.currentSession = {
      sessionId: id,
      startTime: performance.now(),
      profiles: [],
      componentCounts: new Map(),
      totalRenderTime: 0,
      slowestComponents: []
    };

    this.isRecording = true;

    // Auto-stop after configured duration
    setTimeout(() => {
      if (this.isRecording && this.currentSession?.sessionId === id) {
        this.stopProfiling();
      }
    }, this.config.sessionDuration);

    console.log(`🔍 React profiling started: ${id}`);
    return id;
  }

  /**
   * Stop the current profiling session
   */
  stopProfiling(): ProfilerSession | null {
    if (!this.isRecording || !this.currentSession) {
      console.warn('No active profiling session to stop');
      return null;
    }

    this.currentSession.endTime = performance.now();
    this.isRecording = false;

    // Analyze the session data
    this.analyzeSession(this.currentSession);

    // Store the session
    this.sessions.set(this.currentSession.sessionId, this.currentSession);

    // Limit stored sessions
    if (this.sessions.size > this.config.maxSessions) {
      const oldestSession = Array.from(this.sessions.keys())[0];
      this.sessions.delete(oldestSession);
    }

    const session = this.currentSession;
    this.currentSession = null;

    console.log(`🔍 React profiling stopped: ${session.sessionId}`, {
      duration: session.endTime - session.startTime,
      totalProfiles: session.profiles.length,
      totalRenderTime: session.totalRenderTime,
      slowComponents: session.slowestComponents.length
    });

    return session;
  }

  /**
   * Record profiler data (called by React Profiler components)
   */
  recordProfilerData(data: ProfilerData): void {
    if (!this.isRecording || !this.currentSession) return;

    this.currentSession.profiles.push(data);
    this.currentSession.totalRenderTime += data.actualDuration;

    // Update component counts
    const currentCount = this.currentSession.componentCounts.get(data.id) || 0;
    this.currentSession.componentCounts.set(data.id, currentCount + 1);

    // Track slow components
    if (data.actualDuration > this.config.slowComponentThreshold) {
      this.currentSession.slowestComponents.push({
        id: data.id,
        duration: data.actualDuration,
        phase: data.phase
      });
    }
  }

  /**
   * Analyze session data for insights
   */
  private analyzeSession(session: ProfilerSession): void {
    // Sort slowest components
    session.slowestComponents.sort((a, b) => b.duration - a.duration);
    
    // Keep only top 20 slowest
    session.slowestComponents = session.slowestComponents.slice(0, 20);

    // Log warnings for performance issues
    const avgRenderTime = session.totalRenderTime / session.profiles.length;
    if (avgRenderTime > this.config.slowComponentThreshold) {
      console.warn(`⚠️ High average render time detected: ${avgRenderTime.toFixed(2)}ms`);
    }

    const slowComponentCount = session.slowestComponents.length;
    if (slowComponentCount > 5) {
      console.warn(`⚠️ Multiple slow components detected: ${slowComponentCount} components`);
    }
  }

  /**
   * Get profiling session data
   */
  getSession(sessionId: string): ProfilerSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ProfilerSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get current session status
   */
  getStatus(): {
    isRecording: boolean;
    currentSessionId: string | null;
    totalSessions: number;
    recordedProfiles: number;
  } {
    return {
      isRecording: this.isRecording,
      currentSessionId: this.currentSession?.sessionId || null,
      totalSessions: this.sessions.size,
      recordedProfiles: this.currentSession?.profiles.length || 0
    };
  }

  /**
   * Generate performance report
   */
  generateReport(sessionId?: string): {
    session: ProfilerSession;
    analysis: {
      totalComponents: number;
      averageRenderTime: number;
      slowestComponent: { id: string; duration: number } | null;
      mostRenderedComponent: { id: string; count: number } | null;
      performanceScore: number; // 0-100
      recommendations: string[];
    };
  } | null {
    const session = sessionId 
      ? this.getSession(sessionId)
      : Array.from(this.sessions.values()).pop(); // Latest session

    if (!session) return null;

    const totalComponents = session.componentCounts.size;
    const averageRenderTime = session.totalRenderTime / session.profiles.length;
    
    const slowestComponent = session.slowestComponents[0] || null;
    
    const mostRenderedComponent = Array.from(session.componentCounts.entries())
      .sort(([,a], [,b]) => b - a)[0];

    // Calculate performance score (0-100)
    let performanceScore = 100;
    
    // Deduct points for slow average render time
    if (averageRenderTime > this.config.slowComponentThreshold) {
      performanceScore -= Math.min(30, (averageRenderTime - this.config.slowComponentThreshold) * 2);
    }
    
    // Deduct points for slow components
    performanceScore -= Math.min(40, session.slowestComponents.length * 2);
    
    // Deduct points for excessive re-renders
    const maxRenders = Math.max(...Array.from(session.componentCounts.values()));
    if (maxRenders > 10) {
      performanceScore -= Math.min(30, (maxRenders - 10) * 3);
    }

    performanceScore = Math.max(0, performanceScore);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageRenderTime > this.config.slowComponentThreshold) {
      recommendations.push(`Consider optimizing render performance (avg: ${averageRenderTime.toFixed(2)}ms)`);
    }
    
    if (session.slowestComponents.length > 3) {
      recommendations.push(`Multiple slow components detected (${session.slowestComponents.length})`);
    }
    
    if (maxRenders > 15) {
      recommendations.push(`Excessive re-renders detected (max: ${maxRenders} renders)`);
    }
    
    if (totalComponents > 50) {
      recommendations.push(`Large number of components rendered (${totalComponents})`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! 🎉');
    }

    return {
      session,
      analysis: {
        totalComponents,
        averageRenderTime,
        slowestComponent,
        mostRenderedComponent: mostRenderedComponent 
          ? { id: mostRenderedComponent[0], count: mostRenderedComponent[1] }
          : null,
        performanceScore,
        recommendations
      }
    };
  }

  /**
   * Export session data
   */
  exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const report = this.generateReport(sessionId);
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      session,
      report: report?.analysis,
      config: this.config
    }, null, 2);
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear();
    console.log('🧹 All profiling sessions cleared');
  }

  /**
   * Configure profiler settings
   */
  configure(config: Partial<DevToolsProfilerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ React DevTools profiler configured:', this.config);
  }
}

// Global profiler instance
export const reactProfiler = new ReactDevToolsProfiler({
  enabled: process.env.NODE_ENV === 'development',
  autoStart: false,
  sessionDuration: 30000,
  slowComponentThreshold: 16,
  maxSessions: 10
});

// Make profiler available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).reactProfiler = reactProfiler;
}

export { ReactDevToolsProfiler };
export type { ProfilerData, ProfilerSession, DevToolsProfilerConfig };
