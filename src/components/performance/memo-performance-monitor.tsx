/**
 * Memo Performance Monitor
 * Visual interface for monitoring React.memo performance and optimization impact
 */

'use client';

import React, { useState, useEffect } from 'react';
import { memoComparisonMonitor } from '@/lib/utils/memo-comparison-functions';
import { cn } from '@/lib/utils';

interface MemoPerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface MemoReport {
  componentName: string;
  totalComparisons: number;
  preventedRenders: number;
  preventionRate: number;
  averageComparisonTime: number;
}

export const MemoPerformanceMonitor: React.FC<MemoPerformanceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [report, setReport] = useState<MemoReport[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [sortBy, setSortBy] = useState<'preventionRate' | 'totalComparisons' | 'averageComparisonTime'>('preventionRate');

  // Update report periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateReport = () => {
      const newReport = memoComparisonMonitor.getReport();
      setReport(newReport);
    };

    updateReport();
    const interval = setInterval(updateReport, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-blue-600 bg-blue-50';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (rate: number) => {
    if (rate >= 80) return '🚀';
    if (rate >= 60) return '⚡';
    if (rate >= 40) return '⚠️';
    return '🐌';
  };

  const sortedReport = [...report].sort((a, b) => {
    switch (sortBy) {
      case 'preventionRate': return b.preventionRate - a.preventionRate;
      case 'totalComparisons': return b.totalComparisons - a.totalComparisons;
      case 'averageComparisonTime': return b.averageComparisonTime - a.averageComparisonTime;
      default: return 0;
    }
  });

  const handleClearMetrics = () => {
    memoComparisonMonitor.clearMetrics();
    setReport([]);
  };

  const totalPrevented = report.reduce((sum, r) => sum + r.preventedRenders, 0);
  const totalComparisons = report.reduce((sum, r) => sum + r.totalComparisons, 0);
  const overallRate = totalComparisons > 0 ? (totalPrevented / totalComparisons) * 100 : 0;

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-164 right-4 z-50 bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        title="Show Memo Performance Monitor"
      >
        ⚡
        {totalPrevented > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-400 text-green-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalPrevented}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-164 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Memo Performance Monitor</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">{report.length} components</span>
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
          <div className="bg-green-50 p-2 rounded">
            <div className="font-medium text-green-700">Prevented Renders</div>
            <div className="text-lg font-bold text-green-900">{totalPrevented}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-700">Total Comparisons</div>
            <div className="text-lg font-bold text-blue-900">{totalComparisons}</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-medium text-purple-700">Prevention Rate</div>
            <div className="text-lg font-bold text-purple-900">{overallRate.toFixed(1)}%</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="font-medium text-orange-700">Components</div>
            <div className="text-lg font-bold text-orange-900">{report.length}</div>
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
              <option value="preventionRate">Prevention Rate</option>
              <option value="totalComparisons">Total Comparisons</option>
              <option value="averageComparisonTime">Avg Comparison Time</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearMetrics}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Components List */}
      <div className="max-h-64 overflow-y-auto">
        {sortedReport.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm">No memo data available</div>
            <div className="text-xs mt-1">Use components with React.memo to see data</div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedReport.map((component) => (
              <div
                key={component.componentName}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-colors",
                  selectedComponent === component.componentName
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedComponent(
                  selectedComponent === component.componentName ? '' : component.componentName
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPerformanceIcon(component.preventionRate)}</span>
                    <span className="font-medium text-sm">{component.componentName}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      getPerformanceColor(component.preventionRate)
                    )}>
                      {component.preventionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {component.preventedRenders} prevented
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Comparisons:</span>{' '}
                    <span className="font-medium text-blue-600">
                      {component.totalComparisons}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prevented:</span>{' '}
                    <span className="font-medium text-green-600">
                      {component.preventedRenders}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Time:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      component.averageComparisonTime > 2 ? "text-red-600" : "text-green-600"
                    )}>
                      {component.averageComparisonTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>

                {selectedComponent === component.componentName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Performance Analysis:</span>
                      </div>
                      {component.preventionRate >= 80 && (
                        <div className="text-green-600">
                          🚀 Excellent memo performance. High render prevention rate.
                        </div>
                      )}
                      {component.preventionRate >= 60 && component.preventionRate < 80 && (
                        <div className="text-blue-600">
                          ⚡ Good memo performance. Moderate render prevention.
                        </div>
                      )}
                      {component.preventionRate >= 40 && component.preventionRate < 60 && (
                        <div className="text-yellow-600">
                          ⚠️ Fair memo performance. Some unnecessary renders still occurring.
                        </div>
                      )}
                      {component.preventionRate < 40 && (
                        <div className="text-red-600">
                          🐌 Poor memo performance. Many unnecessary renders not prevented.
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-gray-600">Recommendations:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {component.preventionRate < 50 && (
                            <li>Review memo comparison function - may be too strict</li>
                          )}
                          {component.averageComparisonTime > 5 && (
                            <li>Optimize comparison function - taking too long</li>
                          )}
                          {component.totalComparisons > 100 && component.preventionRate < 30 && (
                            <li>Consider if memo is beneficial - high comparison overhead</li>
                          )}
                          {component.preventionRate > 90 && (
                            <li>Excellent optimization! Consider applying similar patterns elsewhere</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 Tip: Prevention rate = (preventedRenders/totalComparisons) × 100</div>
          <div>🎯 Target: >80% for optimal memo performance</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Memo Performance Monitor Provider
 */
export const MemoPerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
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
        <MemoPerformanceMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
