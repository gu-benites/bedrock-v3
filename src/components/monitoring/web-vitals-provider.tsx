/**
 * Web Vitals Provider Component
 * Initializes Core Web Vitals monitoring for the application
 */

'use client';

import React, { useEffect, useState } from 'react';
import { coreWebVitalsMonitor } from '@/lib/monitoring/core-web-vitals';

interface WebVitalsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  sampleRate?: number;
  reportingEndpoint?: string;
  showDebugInfo?: boolean;
}

interface WebVitalsDebugInfo {
  isMonitoring: boolean;
  sessionId: string;
  metricsCollected: number;
  lastMetricTime?: number;
}

export const WebVitalsProvider: React.FC<WebVitalsProviderProps> = ({
  children,
  enabled = process.env.NODE_ENV === 'production',
  sampleRate = 0.1,
  reportingEndpoint = '/api/analytics/web-vitals',
  showDebugInfo = process.env.NODE_ENV === 'development'
}) => {
  const [debugInfo, setDebugInfo] = useState<WebVitalsDebugInfo>({
    isMonitoring: false,
    sessionId: '',
    metricsCollected: 0
  });

  useEffect(() => {
    if (!enabled) return;

    // Update configuration
    coreWebVitalsMonitor.updateConfig({
      enabled,
      sampleRate,
      reportingEndpoint
    });

    // Update debug info periodically
    const updateDebugInfo = () => {
      const summary = coreWebVitalsMonitor.getMetricsSummary();
      setDebugInfo({
        isMonitoring: summary.isMonitoring,
        sessionId: summary.sessionId,
        metricsCollected: summary.metricsCollected,
        lastMetricTime: Date.now()
      });
    };

    // Initial update
    updateDebugInfo();

    // Update every 5 seconds in development
    let interval: NodeJS.Timeout | undefined;
    if (showDebugInfo) {
      interval = setInterval(updateDebugInfo, 5000);
    }

    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      coreWebVitalsMonitor.cleanup();
    };
  }, [enabled, sampleRate, reportingEndpoint, showDebugInfo]);

  return (
    <>
      {children}
      {showDebugInfo && debugInfo.isMonitoring && (
        <WebVitalsDebugPanel debugInfo={debugInfo} />
      )}
    </>
  );
};

/**
 * Debug panel for Web Vitals monitoring
 */
const WebVitalsDebugPanel: React.FC<{ debugInfo: WebVitalsDebugInfo }> = ({ debugInfo }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  // Keyboard shortcut to toggle debug panel
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // Mock metrics for display (in real implementation, you'd get these from the monitor)
  useEffect(() => {
    if (isVisible) {
      // Simulate some metrics for demo
      setMetrics([
        { name: 'LCP', value: 2.1, rating: 'good', timestamp: Date.now() - 5000 },
        { name: 'FID', value: 85, rating: 'good', timestamp: Date.now() - 3000 },
        { name: 'CLS', value: 0.05, rating: 'good', timestamp: Date.now() - 1000 }
      ]);
    }
  }, [isVisible]);

  const handleFlushMetrics = async () => {
    await coreWebVitalsMonitor.flush();
    console.log('📊 Web Vitals metrics flushed');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-84 right-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Show Web Vitals Debug Panel (Ctrl+Shift+V)"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-84 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Web Vitals Monitor</span>
          <div className={`w-2 h-2 rounded-full ${debugInfo.isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="p-3 space-y-2">
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={debugInfo.isMonitoring ? 'text-green-600 font-medium' : 'text-gray-600'}>
              {debugInfo.isMonitoring ? 'Monitoring' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Session:</span>
            <span className="font-mono text-xs">{debugInfo.sessionId.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span>Metrics:</span>
            <span>{debugInfo.metricsCollected}</span>
          </div>
          {debugInfo.lastMetricTime && (
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>{new Date(debugInfo.lastMetricTime).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Metrics */}
      {metrics.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <h4 className="text-sm font-medium mb-2">Recent Metrics</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs border ${
                  metric.rating === 'good' 
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : metric.rating === 'needs-improvement'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{metric.name}</span>
                  <span>{metric.value.toFixed(2)}</span>
                </div>
                <div className="text-xs opacity-75">
                  {metric.rating} • {new Date(metric.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex space-x-2">
          <button
            onClick={handleFlushMetrics}
            className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            Flush Metrics
          </button>
          <button
            onClick={() => {
              console.log('📊 Web Vitals Debug Info:', debugInfo);
              console.log('📊 Web Vitals Summary:', coreWebVitalsMonitor.getMetricsSummary());
            }}
            className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Log Debug
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="border-t border-gray-200 p-3">
        <div className="text-xs text-gray-600">
          <div>Environment: {process.env.NODE_ENV}</div>
          <div>Sample Rate: {(parseFloat(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE || '0.1') * 100).toFixed(0)}%</div>
          <div>Endpoint: {process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT || '/api/analytics/web-vitals'}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for accessing Web Vitals monitoring
 */
export const useWebVitals = () => {
  const [summary, setSummary] = useState(coreWebVitalsMonitor.getMetricsSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(coreWebVitalsMonitor.getMetricsSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const flush = async () => {
    await coreWebVitalsMonitor.flush();
  };

  const updateConfig = (config: any) => {
    coreWebVitalsMonitor.updateConfig(config);
  };

  return {
    summary,
    flush,
    updateConfig,
    isMonitoring: summary.isMonitoring
  };
};

/**
 * Web Vitals metrics display component
 */
export const WebVitalsMetrics: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { summary, isMonitoring } = useWebVitals();

  if (!isMonitoring) {
    return null;
  }

  return (
    <div className={`bg-gray-50 p-2 rounded text-xs ${className}`}>
      <div className="font-medium text-gray-700 mb-1">Web Vitals</div>
      <div className="space-y-1 text-gray-600">
        <div>Session: {summary.sessionId.slice(-8)}</div>
        <div>Metrics: {summary.metricsCollected}</div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Monitoring
        </div>
      </div>
    </div>
  );
};
