/**
 * Performance Alerts System
 * Automated alerting for navigation timing degradation and performance issues
 */

import { navigationTiming } from '@/lib/performance/navigation-timing';
import { reactProfiler } from '@/lib/performance/react-devtools-profiler';
import { performanceRegressionTester } from '@/lib/testing/performance-regression-tester';

interface PerformanceAlert {
  id: string;
  type: 'navigation' | 'render' | 'memory' | 'regression' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  route?: string;
  component?: string;
  timestamp: number;
  description: string;
  recommendations: string[];
  metadata?: Record<string, any>;
}

interface AlertThresholds {
  navigation: {
    warning: number;    // ms
    critical: number;   // ms
  };
  render: {
    warning: number;    // ms
    critical: number;   // ms
  };
  memory: {
    warning: number;    // MB
    critical: number;   // MB
  };
  regression: {
    warning: number;    // % increase
    critical: number;   // % increase
  };
}

interface AlertConfig {
  enabled: boolean;
  checkInterval: number;        // ms
  alertCooldown: number;        // ms - prevent spam
  maxAlertsPerHour: number;
  thresholds: AlertThresholds;
  channels: {
    console: boolean;
    slack?: string;             // webhook URL
    email?: string;             // endpoint URL
    custom?: string;            // custom webhook URL
  };
}

class PerformanceAlertsSystem {
  private config: AlertConfig;
  private activeAlerts = new Map<string, PerformanceAlert>();
  private alertHistory: PerformanceAlert[] = [];
  private lastAlertTimes = new Map<string, number>();
  private checkTimer?: NodeJS.Timeout;
  private alertCounts = new Map<string, number>(); // hourly alert counts

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production',
      checkInterval: 30000,      // Check every 30 seconds
      alertCooldown: 300000,     // 5 minutes between same alerts
      maxAlertsPerHour: 10,      // Max 10 alerts per hour per type
      thresholds: {
        navigation: {
          warning: 2000,         // 2 seconds
          critical: 5000         // 5 seconds
        },
        render: {
          warning: 16,           // 16ms (60fps)
          critical: 50           // 50ms
        },
        memory: {
          warning: 100,          // 100MB
          critical: 200          // 200MB
        },
        regression: {
          warning: 25,           // 25% performance regression
          critical: 50           // 50% performance regression
        }
      },
      channels: {
        console: true,
        slack: process.env.SLACK_PERFORMANCE_WEBHOOK,
        email: process.env.EMAIL_ALERT_ENDPOINT,
        custom: process.env.CUSTOM_ALERT_WEBHOOK
      },
      ...config
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Start performance monitoring and alerting
   */
  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.performPerformanceCheck();
    }, this.config.checkInterval);

    // Reset hourly alert counts
    setInterval(() => {
      this.alertCounts.clear();
    }, 3600000); // Every hour

    console.log('🚨 Performance alerts system started');
  }

  /**
   * Perform comprehensive performance check
   */
  private async performPerformanceCheck(): Promise<void> {
    try {
      // Check navigation performance
      await this.checkNavigationPerformance();

      // Check render performance
      await this.checkRenderPerformance();

      // Check memory usage
      await this.checkMemoryUsage();

      // Check for performance regressions
      await this.checkPerformanceRegressions();

    } catch (error) {
      console.error('Error during performance check:', error);
    }
  }

  /**
   * Check navigation performance
   */
  private async checkNavigationPerformance(): Promise<void> {
    const summary = navigationTiming.getPerformanceSummary();
    
    if (summary.averageNavigationTime > this.config.thresholds.navigation.critical) {
      await this.createAlert({
        type: 'navigation',
        severity: 'critical',
        metric: 'averageNavigationTime',
        currentValue: summary.averageNavigationTime,
        threshold: this.config.thresholds.navigation.critical,
        description: `Critical navigation performance: ${summary.averageNavigationTime.toFixed(0)}ms average`,
        recommendations: [
          'Check for network issues or server performance problems',
          'Review recent code changes that might affect navigation',
          'Consider implementing route prefetching',
          'Optimize component loading and rendering'
        ]
      });
    } else if (summary.averageNavigationTime > this.config.thresholds.navigation.warning) {
      await this.createAlert({
        type: 'navigation',
        severity: 'medium',
        metric: 'averageNavigationTime',
        currentValue: summary.averageNavigationTime,
        threshold: this.config.thresholds.navigation.warning,
        description: `Slow navigation detected: ${summary.averageNavigationTime.toFixed(0)}ms average`,
        recommendations: [
          'Monitor navigation timing trends',
          'Review component loading strategies',
          'Consider route prefetching optimization'
        ]
      });
    }

    // Check for threshold violations
    if (summary.thresholdViolations > 0) {
      await this.createAlert({
        type: 'navigation',
        severity: 'high',
        metric: 'thresholdViolations',
        currentValue: summary.thresholdViolations,
        threshold: 0,
        description: `${summary.thresholdViolations} navigation threshold violations detected`,
        recommendations: [
          'Review specific navigation events that exceeded thresholds',
          'Identify problematic routes or components',
          'Implement targeted performance optimizations'
        ]
      });
    }
  }

  /**
   * Check render performance
   */
  private async checkRenderPerformance(): Promise<void> {
    const sessions = reactProfiler.getAllSessions();
    if (sessions.length === 0) return;

    const latestSession = sessions[sessions.length - 1];
    
    if (latestSession.profiles.length > 0) {
      const renderTimes = latestSession.profiles.map(p => p.actualDuration);
      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes);

      if (maxRenderTime > this.config.thresholds.render.critical) {
        await this.createAlert({
          type: 'render',
          severity: 'critical',
          metric: 'maxRenderTime',
          currentValue: maxRenderTime,
          threshold: this.config.thresholds.render.critical,
          description: `Critical render performance: ${maxRenderTime.toFixed(2)}ms max render time`,
          recommendations: [
            'Identify and optimize slow-rendering components',
            'Implement React.memo for expensive components',
            'Review component re-render patterns',
            'Consider code splitting for large components'
          ]
        });
      } else if (avgRenderTime > this.config.thresholds.render.warning) {
        await this.createAlert({
          type: 'render',
          severity: 'medium',
          metric: 'averageRenderTime',
          currentValue: avgRenderTime,
          threshold: this.config.thresholds.render.warning,
          description: `Slow rendering detected: ${avgRenderTime.toFixed(2)}ms average`,
          recommendations: [
            'Monitor render performance trends',
            'Review component optimization opportunities',
            'Consider implementing performance profiling'
          ]
        });
      }

      // Check for excessive re-renders
      const maxRerenders = Math.max(...Array.from(latestSession.componentCounts.values()));
      if (maxRerenders > 10) {
        await this.createAlert({
          type: 'render',
          severity: 'high',
          metric: 'excessiveRerenders',
          currentValue: maxRerenders,
          threshold: 10,
          description: `Excessive re-renders detected: ${maxRerenders} re-renders for a component`,
          recommendations: [
            'Identify components with excessive re-renders',
            'Optimize useEffect dependencies',
            'Implement proper memoization strategies',
            'Review state management patterns'
          ]
        });
      }
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<void> {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);

    if (memoryMB > this.config.thresholds.memory.critical) {
      await this.createAlert({
        type: 'memory',
        severity: 'critical',
        metric: 'memoryUsage',
        currentValue: memoryMB,
        threshold: this.config.thresholds.memory.critical,
        description: `Critical memory usage: ${memoryMB}MB`,
        recommendations: [
          'Check for memory leaks in components',
          'Review event listener cleanup',
          'Optimize data structures and caching',
          'Consider implementing memory profiling'
        ]
      });
    } else if (memoryMB > this.config.thresholds.memory.warning) {
      await this.createAlert({
        type: 'memory',
        severity: 'medium',
        metric: 'memoryUsage',
        currentValue: memoryMB,
        threshold: this.config.thresholds.memory.warning,
        description: `High memory usage: ${memoryMB}MB`,
        recommendations: [
          'Monitor memory usage trends',
          'Review component cleanup patterns',
          'Consider optimizing data caching strategies'
        ]
      });
    }
  }

  /**
   * Check for performance regressions
   */
  private async checkPerformanceRegressions(): Promise<void> {
    const report = performanceRegressionTester.generateReport();
    
    // Check for degrading trends
    const degradingTrends = report.trends.filter(trend => trend.trend === 'degrading');
    
    for (const trend of degradingTrends) {
      if (Math.abs(trend.changePercent) > this.config.thresholds.regression.critical) {
        await this.createAlert({
          type: 'regression',
          severity: 'critical',
          metric: 'performanceRegression',
          currentValue: Math.abs(trend.changePercent),
          threshold: this.config.thresholds.regression.critical,
          description: `Critical performance regression: ${trend.testName} degraded by ${trend.changePercent.toFixed(1)}%`,
          recommendations: [
            'Review recent code changes that might cause regression',
            'Run performance regression tests',
            'Compare with performance baselines',
            'Consider rolling back recent changes'
          ],
          metadata: { testName: trend.testName, changePercent: trend.changePercent }
        });
      } else if (Math.abs(trend.changePercent) > this.config.thresholds.regression.warning) {
        await this.createAlert({
          type: 'regression',
          severity: 'medium',
          metric: 'performanceRegression',
          currentValue: Math.abs(trend.changePercent),
          threshold: this.config.thresholds.regression.warning,
          description: `Performance regression detected: ${trend.testName} degraded by ${trend.changePercent.toFixed(1)}%`,
          recommendations: [
            'Monitor performance trend closely',
            'Review recent changes for optimization opportunities',
            'Consider updating performance baselines'
          ],
          metadata: { testName: trend.testName, changePercent: trend.changePercent }
        });
      }
    }

    // Check critical issues
    if (report.criticalIssues.length > 0) {
      await this.createAlert({
        type: 'critical',
        severity: 'critical',
        metric: 'criticalIssues',
        currentValue: report.criticalIssues.length,
        threshold: 0,
        description: `${report.criticalIssues.length} critical performance issues detected`,
        recommendations: [
          'Address critical performance issues immediately',
          'Review failed performance tests',
          'Implement immediate performance fixes'
        ],
        metadata: { criticalIssues: report.criticalIssues }
      });
    }
  }

  /**
   * Create and send performance alert
   */
  private async createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): Promise<void> {
    const alertKey = `${alertData.type}-${alertData.metric}`;
    
    // Check cooldown period
    const lastAlertTime = this.lastAlertTimes.get(alertKey) || 0;
    const now = Date.now();
    
    if (now - lastAlertTime < this.config.alertCooldown) {
      return; // Still in cooldown period
    }

    // Check hourly rate limit
    const hourlyCount = this.alertCounts.get(alertData.type) || 0;
    if (hourlyCount >= this.config.maxAlertsPerHour) {
      return; // Rate limit exceeded
    }

    const alert: PerformanceAlert = {
      id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      ...alertData
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.lastAlertTimes.set(alertKey, now);
    this.alertCounts.set(alertData.type, hourlyCount + 1);

    // Send alert through configured channels
    await this.sendAlert(alert);

    // Auto-resolve after some time for non-critical alerts
    if (alert.severity !== 'critical') {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 600000); // Auto-resolve after 10 minutes
    }
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Console logging
    if (this.config.channels.console) {
      this.logAlertToConsole(alert);
    }

    // Slack notification
    if (this.config.channels.slack) {
      promises.push(this.sendSlackAlert(alert));
    }

    // Email notification
    if (this.config.channels.email) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Custom webhook
    if (this.config.channels.custom) {
      promises.push(this.sendCustomAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Log alert to console
   */
  private logAlertToConsole(alert: PerformanceAlert): void {
    const emoji = this.getSeverityEmoji(alert.severity);
    const message = `${emoji} PERFORMANCE ALERT [${alert.severity.toUpperCase()}]: ${alert.description}`;
    
    if (alert.severity === 'critical') {
      console.error(message, alert);
    } else if (alert.severity === 'high') {
      console.warn(message, alert);
    } else {
      console.log(message, alert);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: PerformanceAlert): Promise<void> {
    try {
      const emoji = this.getSeverityEmoji(alert.severity);
      const color = this.getSeverityColor(alert.severity);
      
      await fetch(this.config.channels.slack!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} Performance Alert: ${alert.description}`,
          attachments: [
            {
              color,
              fields: [
                { title: 'Metric', value: alert.metric, short: true },
                { title: 'Current Value', value: `${alert.currentValue.toFixed(2)}`, short: true },
                { title: 'Threshold', value: `${alert.threshold}`, short: true },
                { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
                { title: 'Route', value: alert.route || 'N/A', short: true },
                { title: 'Component', value: alert.component || 'N/A', short: true }
              ],
              footer: 'Performance Monitoring',
              ts: Math.floor(alert.timestamp / 1000)
            }
          ]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch(this.config.channels.email!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance-alert',
          alert,
          timestamp: alert.timestamp
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send custom webhook alert
   */
  private async sendCustomAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch(this.config.channels.custom!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance-alert',
          alert,
          timestamp: alert.timestamp
        })
      });
    } catch (error) {
      console.error('Failed to send custom alert:', error);
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffcc00';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    this.activeAlerts.delete(alertId);
    console.log(`✅ Performance alert resolved: ${alertId}`);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 50): PerformanceAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🚨 Performance alerts config updated');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    console.log('🚨 Performance alerts system stopped');
  }
}

// Global performance alerts instance
export const performanceAlerts = new PerformanceAlertsSystem({
  enabled: true,
  checkInterval: 30000,
  thresholds: {
    navigation: {
      warning: 2000,
      critical: 5000
    },
    render: {
      warning: 16,
      critical: 50
    },
    memory: {
      warning: 100,
      critical: 200
    },
    regression: {
      warning: 25,
      critical: 50
    }
  }
});

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceAlerts = performanceAlerts;
}

export { PerformanceAlertsSystem };
export type { PerformanceAlert, AlertThresholds, AlertConfig };
