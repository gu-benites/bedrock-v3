/**
 * Selector Performance Monitor
 * Visual interface for monitoring Zustand selector performance and optimization impact
 */

'use client';

import React, { useState, useEffect } from 'react';
import { selectorPerformanceAnalyzer, type SelectorMetrics, type PerformanceReport } from '@/lib/performance/selector-performance-analyzer';
import { cn } from '@/lib/utils';

interface SelectorPerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const SelectorPerformanceMonitor: React.FC<SelectorPerformanceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [summary, setSummary] = useState<any>({});
  const [selectedSelector, setSelectedSelector] = useState<string>('');
  const [sortBy, setSortBy] = useState<'renderCount' | 'averageRenderTime' | 'preventedRenders'>('renderCount');

  // Update performance data
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      const newReport = selectorPerformanceAnalyzer.generateReport();
      const newSummary = selectorPerformanceAnalyzer.getPerformanceSummary();
      
      setReport(newReport);
      setSummary(newSummary);
    };

    updateData();
    const interval = setInterval(updateData, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleExportData = () => {
    const data = selectorPerformanceAnalyzer.exportData();
    navigator.clipboard?.writeText(data);
    console.log('📊 Selector performance data exported to clipboard');
  };

  const handleClearData = () => {
    selectorPerformanceAnalyzer.clearData();
    setReport(null);
    setSummary({});
  };

  const getOptimizationColor = (level: string) => {
    switch (level) {
      case 'advanced': return 'text-green-600 bg-green-50';
      case 'optimized': return 'text-blue-600 bg-blue-50';
      case 'basic': return 'text-yellow-600 bg-yellow-50';
      case 'none': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOptimizationIcon = (level: string) => {
    switch (level) {
      case 'advanced': return '🚀';
      case 'optimized': return '⚡';
      case 'basic': return '⚠️';
      case 'none': return '🐌';
      default: return '📊';
    }
  };

  const sortedSelectors = report?.selectors.sort((a, b) => {
    switch (sortBy) {
      case 'renderCount': return b.renderCount - a.renderCount;
      case 'averageRenderTime': return b.averageRenderTime - a.averageRenderTime;
      case 'preventedRenders': return b.preventedRenders - a.preventedRenders;
      default: return 0;
    }
  }) || [];

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-116 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Selector Performance Monitor"
      >
        🔍
        {summary.optimizedSelectors > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-400 text-purple-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {summary.optimizedSelectors}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-116 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Selector Performance</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">{summary.optimizedSelectors}/{summary.totalSelectors} optimized</span>
          </div>
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Summary */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-700">Total Selectors</div>
            <div className="text-lg font-bold text-blue-900">{summary.totalSelectors || 0}</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-medium text-green-700">Avg Render Time</div>
            <div className="text-lg font-bold text-green-900">
              {summary.averageRenderTime ? `${summary.averageRenderTime.toFixed(2)}ms` : '0ms'}
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-medium text-purple-700">Recent Renders</div>
            <div className="text-lg font-bold text-purple-900">{summary.recentRenders || 0}</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="font-medium text-orange-700">Prevented Renders</div>
            <div className="text-lg font-bold text-orange-900">{summary.preventedRenders || 0}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="renderCount">Render Count</option>
              <option value="averageRenderTime">Avg Render Time</option>
              <option value="preventedRenders">Prevented Renders</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportData}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Export
            </button>
            <button
              onClick={handleClearData}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Selectors List */}
      <div className="max-h-64 overflow-y-auto">
        {sortedSelectors.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">No selector data available</div>
            <div className="text-xs mt-1">Use components with optimized selectors to see data</div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedSelectors.map((selector) => (
              <div
                key={selector.selectorName}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-colors",
                  selectedSelector === selector.selectorName
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedSelector(
                  selectedSelector === selector.selectorName ? '' : selector.selectorName
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getOptimizationIcon(selector.optimizationLevel)}</span>
                    <span className="font-medium text-sm">{selector.selectorName}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      getOptimizationColor(selector.optimizationLevel)
                    )}>
                      {selector.optimizationLevel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {selector.renderCount} renders
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Avg Time:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      selector.averageRenderTime > 5 ? "text-red-600" : "text-green-600"
                    )}>
                      {selector.averageRenderTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prevented:</span>{' '}
                    <span className="font-medium text-orange-600">
                      {selector.preventedRenders}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Subscriptions:</span>{' '}
                    <span className="font-medium text-blue-600">
                      {selector.subscriptionCount}
                    </span>
                  </div>
                </div>

                {selectedSelector === selector.selectorName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Total Render Time:</span>{' '}
                        <span className="font-medium">{selector.totalRenderTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Render:</span>{' '}
                        <span className="font-medium">
                          {new Date(selector.lastRenderTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Memory Usage:</span>{' '}
                        <span className="font-medium">{selector.memoryUsage}MB</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <div className="space-y-1">
            {report.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-start">
                <span className="mr-1">•</span>
                <span>{rec}</span>
              </div>
            ))}
            {report.recommendations.length > 3 && (
              <div className="text-xs text-gray-500">
                +{report.recommendations.length - 3} more recommendations
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Selector Performance Monitor Provider
 */
export const SelectorPerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
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
        <SelectorPerformanceMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
