/**
 * Persistence Monitor
 * Visual interface for monitoring state persistence performance and debugging
 */

'use client';

import React, { useState, useEffect } from 'react';
import { persistencePerformanceMonitor } from '@/features/create-recipe/hooks/use-optimized-persistence';
import { cn } from '@/lib/utils';

interface PersistenceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface PersistenceReport {
  operationName: string;
  totalOperations: number;
  averageTime: number;
  maxTime: number;
}

export const PersistenceMonitor: React.FC<PersistenceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [report, setReport] = useState<PersistenceReport[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [sortBy, setSortBy] = useState<'averageTime' | 'totalOperations' | 'maxTime'>('averageTime');

  // Update report periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateReport = () => {
      const newReport = persistencePerformanceMonitor.getReport();
      setReport(newReport);
    };

    updateReport();
    const interval = setInterval(updateReport, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime <= 10) return 'text-green-600 bg-green-50';
    if (avgTime <= 25) return 'text-blue-600 bg-blue-50';
    if (avgTime <= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (avgTime: number) => {
    if (avgTime <= 10) return '🚀';
    if (avgTime <= 25) return '⚡';
    if (avgTime <= 50) return '⚠️';
    return '🐌';
  };

  const sortedReport = [...report].sort((a, b) => {
    switch (sortBy) {
      case 'averageTime': return b.averageTime - a.averageTime;
      case 'totalOperations': return b.totalOperations - a.totalOperations;
      case 'maxTime': return b.maxTime - a.maxTime;
      default: return 0;
    }
  });

  const handleClearMetrics = () => {
    persistencePerformanceMonitor.clearMetrics();
    setReport([]);
  };

  const totalOperations = report.reduce((sum, r) => sum + r.totalOperations, 0);
  const overallAverageTime = report.length > 0 
    ? report.reduce((sum, r) => sum + r.averageTime, 0) / report.length 
    : 0;

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-20 right-4 z-50 bg-cyan-600 text-white p-2 rounded-full shadow-lg hover:bg-cyan-700 transition-colors"
        title="Show Persistence Monitor"
      >
        💾
        {totalOperations > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-400 text-cyan-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {report.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Persistence Monitor</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-xs text-gray-600">{report.length} operations</span>
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
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-cyan-50 p-2 rounded">
            <div className="font-medium text-cyan-700">Total Operations</div>
            <div className="text-lg font-bold text-cyan-900">{totalOperations}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-700">Avg Time</div>
            <div className="text-lg font-bold text-blue-900">{overallAverageTime.toFixed(2)}ms</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="font-medium text-orange-700">Operation Types</div>
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
              <option value="averageTime">Average Time</option>
              <option value="totalOperations">Total Operations</option>
              <option value="maxTime">Max Time</option>
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

      {/* Operations List */}
      <div className="max-h-64 overflow-y-auto">
        {sortedReport.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-2xl mb-2">💾</div>
            <div className="text-sm">No persistence data available</div>
            <div className="text-xs mt-1">Use optimized persistence to see data</div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedReport.map((operation) => (
              <div
                key={operation.operationName}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-colors",
                  selectedOperation === operation.operationName
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedOperation(
                  selectedOperation === operation.operationName ? '' : operation.operationName
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPerformanceIcon(operation.averageTime)}</span>
                    <span className="font-medium text-sm">{operation.operationName}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      getPerformanceColor(operation.averageTime)
                    )}>
                      {operation.averageTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {operation.totalOperations} ops
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Operations:</span>{' '}
                    <span className="font-medium text-blue-600">
                      {operation.totalOperations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      operation.averageTime > 25 ? "text-red-600" : "text-green-600"
                    )}>
                      {operation.averageTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      operation.maxTime > 50 ? "text-red-600" : "text-orange-600"
                    )}>
                      {operation.maxTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>

                {selectedOperation === operation.operationName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Performance Analysis:</span>
                      </div>
                      {operation.averageTime <= 10 && (
                        <div className="text-green-600">
                          🚀 Excellent persistence performance. Very fast operations.
                        </div>
                      )}
                      {operation.averageTime > 10 && operation.averageTime <= 25 && (
                        <div className="text-blue-600">
                          ⚡ Good persistence performance. Acceptable operation time.
                        </div>
                      )}
                      {operation.averageTime > 25 && operation.averageTime <= 50 && (
                        <div className="text-yellow-600">
                          ⚠️ Moderate performance. Consider optimization.
                        </div>
                      )}
                      {operation.averageTime > 50 && (
                        <div className="text-red-600">
                          🐌 Poor performance. Persistence optimization needed.
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-gray-600">Operation Type:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {operation.operationName.includes('save') && (
                            <li>Save operation - storing data to persistence layer</li>
                          )}
                          {operation.operationName.includes('restore') && (
                            <li>Restore operation - loading data from persistence layer</li>
                          )}
                          {operation.operationName.includes('field') && (
                            <li>Field-specific operation - targeted data persistence</li>
                          )}
                          {operation.operationName.includes('batch') && (
                            <li>Batch operation - multiple items processed together</li>
                          )}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600">Recommendations:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {operation.averageTime > 50 && (
                            <li>Enable compression to reduce data size</li>
                          )}
                          {operation.maxTime > operation.averageTime * 3 && (
                            <li>High variance detected - investigate data size variations</li>
                          )}
                          {operation.totalOperations > 100 && operation.averageTime > 25 && (
                            <li>High frequency + slow operation - consider batching</li>
                          )}
                          {operation.averageTime <= 10 && (
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
          <div>💡 Tip: Target <10ms for saves, <25ms for complex operations</div>
          <div>🎯 Monitor operations that run frequently or take >50ms</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Persistence Monitor Provider
 */
export const PersistenceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

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
        <PersistenceMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
