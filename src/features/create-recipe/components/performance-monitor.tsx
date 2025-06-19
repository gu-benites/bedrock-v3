/**
 * Performance Monitor Component for Create Recipe Workflow
 * Displays real-time performance metrics and re-render hotspots
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceMetrics, performanceMonitor } from '@/hooks/use-render-performance-monitor';
import { cn } from '@/lib/utils';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const metrics = usePerformanceMetrics();
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh || !isVisible) return;

    const interval = setInterval(() => {
      // Trigger re-render to get fresh metrics
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Show Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Performance Monitor</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
          )} />
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "p-1 rounded text-xs",
              autoRefresh ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            )}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            {autoRefresh ? "⏸️" : "▶️"}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "📉" : "📈"}
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Hide monitor"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <div className="font-medium text-blue-700 dark:text-blue-300">Total Renders</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {metrics.totalRenders}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <div className="font-medium text-green-700 dark:text-green-300">Components</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {metrics.componentsTracked}
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
          <div className="font-medium text-orange-700 dark:text-orange-300 text-xs">
            Avg Render Time
          </div>
          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
            {metrics.averageRenderTime.toFixed(2)}ms
          </div>
        </div>
      </div>

      {/* Hotspots */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Performance Hotspots</h4>
              <button
                onClick={() => performanceMonitor.clear()}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Clear
              </button>
            </div>

            {metrics.hotspots.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No performance hotspots detected
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.hotspots.slice(0, 5).map((hotspot, index) => (
                  <div
                    key={hotspot.componentName}
                    className={cn(
                      "p-2 rounded text-xs border",
                      hotspot.renderCount > 20 || hotspot.averageRenderTime > 50
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : hotspot.renderCount > 10 || hotspot.averageRenderTime > 20
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate" title={hotspot.componentName}>
                        {hotspot.componentName.length > 20 
                          ? hotspot.componentName.substring(0, 20) + '...'
                          : hotspot.componentName
                        }
                      </span>
                      <span className={cn(
                        "px-1 py-0.5 rounded text-xs",
                        hotspot.renderCount > 20
                          ? "bg-red-200 text-red-800"
                          : hotspot.renderCount > 10
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-blue-200 text-blue-800"
                      )}>
                        {hotspot.renderCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Avg: {hotspot.averageRenderTime.toFixed(1)}ms</span>
                      <span>Total: {hotspot.totalRenderTime.toFixed(1)}ms</span>
                    </div>
                    {hotspot.reasons && hotspot.reasons.length > 0 && (
                      <div className="mt-1 text-gray-500 dark:text-gray-500 text-xs">
                        {hotspot.reasons[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex space-x-2">
              <button
                onClick={() => performanceMonitor.logReport()}
                className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Log Report
              </button>
              <button
                onClick={() => {
                  const report = performanceMonitor.getReport();
                  navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
                }}
                className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
              >
                Copy Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Performance Monitor Provider for Create Recipe Workflow
 */
export const PerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show monitor automatically if there are performance issues
  const metrics = usePerformanceMetrics();
  
  useEffect(() => {
    if (metrics.hotspots.length > 3 && !isVisible) {
      console.warn('🔥 Performance issues detected. Showing performance monitor.');
      setIsVisible(true);
    }
  }, [metrics.hotspots.length, isVisible]);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
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
        <PerformanceMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
