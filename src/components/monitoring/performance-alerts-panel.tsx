/**
 * Performance Alerts Panel
 * Visual interface for monitoring and managing performance alerts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { performanceAlerts, type PerformanceAlert } from '@/lib/monitoring/performance-alerts';
import { cn } from '@/lib/utils';

interface PerformanceAlertsPanelProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const PerformanceAlertsPanel: React.FC<PerformanceAlertsPanelProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<PerformanceAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');

  // Update alerts periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateAlerts = () => {
      setActiveAlerts(performanceAlerts.getActiveAlerts());
      setAlertHistory(performanceAlerts.getAlertHistory(20));
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleResolveAlert = (alertId: string) => {
    performanceAlerts.resolveAlert(alertId);
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleUpdateConfig = () => {
    // Example configuration update
    performanceAlerts.updateConfig({
      thresholds: {
        navigation: { warning: 1500, critical: 4000 },
        render: { warning: 12, critical: 40 },
        memory: { warning: 80, critical: 150 },
        regression: { warning: 20, critical: 40 }
      }
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('Time') || metric.includes('Duration')) {
      return `${value.toFixed(2)}ms`;
    } else if (metric.includes('Memory')) {
      return `${value.toFixed(0)}MB`;
    } else if (metric.includes('Percent') || metric.includes('Regression')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(2);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-100 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Show Performance Alerts"
      >
        🚨
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {activeAlerts.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-100 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-lg",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Performance Alerts</span>
          {activeAlerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {activeAlerts.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedTab('active')}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium",
            selectedTab === 'active'
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Active ({activeAlerts.length})
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium",
            selectedTab === 'history'
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          History ({alertHistory.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {selectedTab === 'active' ? (
          <div className="p-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm">No active performance alerts</div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded border",
                      getSeverityColor(alert.severity)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                        <div>
                          <div className="font-medium text-sm">{alert.type.toUpperCase()}</div>
                          <div className="text-xs opacity-75">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded hover:bg-opacity-75"
                      >
                        Resolve
                      </button>
                    </div>

                    <div className="text-sm mb-2">{alert.description}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="opacity-75">Current:</span>{' '}
                        <span className="font-medium">
                          {formatValue(alert.currentValue, alert.metric)}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-75">Threshold:</span>{' '}
                        <span className="font-medium">
                          {formatValue(alert.threshold, alert.metric)}
                        </span>
                      </div>
                      {alert.route && (
                        <div className="col-span-2">
                          <span className="opacity-75">Route:</span>{' '}
                          <span className="font-medium">{alert.route}</span>
                        </div>
                      )}
                    </div>

                    {alert.recommendations.length > 0 && (
                      <div className="text-xs">
                        <div className="opacity-75 mb-1">Recommendations:</div>
                        <ul className="list-disc list-inside space-y-1 opacity-90">
                          {alert.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                          {alert.recommendations.length > 2 && (
                            <li>+{alert.recommendations.length - 2} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3">
            {alertHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm">No alert history</div>
              </div>
            ) : (
              <div className="space-y-2">
                {alertHistory.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-2 rounded border text-sm",
                      getSeverityColor(alert.severity)
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span>{getSeverityIcon(alert.severity)}</span>
                        <span className="font-medium">{alert.type.toUpperCase()}</span>
                      </div>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs opacity-90">{alert.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('🚨 Active Alerts:', activeAlerts);
              console.log('🚨 Alert History:', alertHistory);
            }}
            className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Log Alerts
          </button>
          <button
            onClick={handleUpdateConfig}
            className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            Update Config
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div>Monitoring: Performance, Navigation, Memory</div>
          <div>Check Interval: 30 seconds</div>
          <div>Environment: {process.env.NODE_ENV}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Performance Alerts Provider
 */
export const PerformanceAlertsPanelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle alerts panel
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceAlertsPanel 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
