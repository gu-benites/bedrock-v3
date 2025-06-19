/**
 * Calculation Performance Monitor
 * Visual interface for monitoring useMemo calculation performance and optimization impact
 */

'use client';

import React, { useState, useEffect } from 'react';
import { memoCalculationMonitor } from '@/lib/utils/memo-calculation-hooks';
import { cn } from '@/lib/utils';

interface CalculationPerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface CalculationReport {
  calculationName: string;
  totalCalculations: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

export const CalculationPerformanceMonitor: React.FC<CalculationPerformanceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [report, setReport] = useState<CalculationReport[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<string>('');
  const [sortBy, setSortBy] = useState<'averageTime' | 'totalCalculations' | 'maxTime'>('averageTime');

  // Update report periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateReport = () => {
      const newReport = memoCalculationMonitor.getReport();
      setReport(newReport);
    };

    updateReport();
    const interval = setInterval(updateReport, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime <= 1) return 'text-green-600 bg-green-50';
    if (avgTime <= 5) return 'text-blue-600 bg-blue-50';
    if (avgTime <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (avgTime: number) => {
    if (avgTime <= 1) return '🚀';
    if (avgTime <= 5) return '⚡';
    if (avgTime <= 10) return '⚠️';
    return '🐌';
  };

  const sortedReport = [...report].sort((a, b) => {
    switch (sortBy) {
      case 'averageTime': return b.averageTime - a.averageTime;
      case 'totalCalculations': return b.totalCalculations - a.totalCalculations;
      case 'maxTime': return b.maxTime - a.maxTime;
      default: return 0;
    }
  });

  const handleClearMetrics = () => {
    memoCalculationMonitor.clearMetrics();
    setReport([]);
  };

  const totalCalculations = report.reduce((sum, r) => sum + r.totalCalculations, 0);
  const overallAverageTime = report.length > 0 
    ? report.reduce((sum, r) => sum + r.averageTime, 0) / report.length 
    : 0;

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-128 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Calculation Performance Monitor"
      >
        🧮
        {totalCalculations > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-400 text-purple-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {report.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-128 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Calculation Performance Monitor</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600">{report.length} calculations</span>
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
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-medium text-purple-700">Total Calculations</div>
            <div className="text-lg font-bold text-purple-900">{totalCalculations}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-700">Avg Time</div>
            <div className="text-lg font-bold text-blue-900">{overallAverageTime.toFixed(2)}ms</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="font-medium text-orange-700">Active Calculations</div>
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
              <option value="totalCalculations">Total Calculations</option>
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

      {/* Calculations List */}
      <div className="max-h-64 overflow-y-auto">
        {sortedReport.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-2xl mb-2">🧮</div>
            <div className="text-sm">No calculation data available</div>
            <div className="text-xs mt-1">Use components with useMemo to see data</div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedReport.map((calculation) => (
              <div
                key={calculation.calculationName}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-colors",
                  selectedCalculation === calculation.calculationName
                    ? "border-purple-300 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedCalculation(
                  selectedCalculation === calculation.calculationName ? '' : calculation.calculationName
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPerformanceIcon(calculation.averageTime)}</span>
                    <span className="font-medium text-sm">{calculation.calculationName}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      getPerformanceColor(calculation.averageTime)
                    )}>
                      {calculation.averageTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {calculation.totalCalculations} runs
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Runs:</span>{' '}
                    <span className="font-medium text-blue-600">
                      {calculation.totalCalculations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      calculation.averageTime > 5 ? "text-red-600" : "text-green-600"
                    )}>
                      {calculation.averageTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      calculation.maxTime > 10 ? "text-red-600" : "text-orange-600"
                    )}>
                      {calculation.maxTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Min:</span>{' '}
                    <span className="font-medium text-green-600">
                      {calculation.minTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>

                {selectedCalculation === calculation.calculationName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Performance Analysis:</span>
                      </div>
                      {calculation.averageTime <= 1 && (
                        <div className="text-green-600">
                          🚀 Excellent performance. Very fast calculations.
                        </div>
                      )}
                      {calculation.averageTime > 1 && calculation.averageTime <= 5 && (
                        <div className="text-blue-600">
                          ⚡ Good performance. Acceptable calculation time.
                        </div>
                      )}
                      {calculation.averageTime > 5 && calculation.averageTime <= 10 && (
                        <div className="text-yellow-600">
                          ⚠️ Moderate performance. Consider optimization.
                        </div>
                      )}
                      {calculation.averageTime > 10 && (
                        <div className="text-red-600">
                          🐌 Poor performance. Optimization needed.
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-gray-600">Recommendations:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {calculation.averageTime > 10 && (
                            <li>Consider breaking down complex calculations</li>
                          )}
                          {calculation.maxTime > calculation.averageTime * 3 && (
                            <li>High variance detected - investigate edge cases</li>
                          )}
                          {calculation.totalCalculations > 100 && calculation.averageTime > 5 && (
                            <li>High frequency + slow calculation - priority optimization</li>
                          )}
                          {calculation.averageTime <= 1 && (
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
          <div>💡 Tip: Target <1ms for frequent calculations, <5ms for complex ones</div>
          <div>🎯 Monitor calculations that run frequently or take >10ms</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculation Performance Monitor Provider
 */
export const CalculationPerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
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
        <CalculationPerformanceMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
