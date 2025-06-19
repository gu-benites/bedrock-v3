/**
 * Component Key Monitor
 * Visual interface for monitoring React component key stability and optimization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { keyStabilityMonitor, stableKeyGenerator } from '@/lib/utils/component-key-strategies';
import { cn } from '@/lib/utils';

interface ComponentKeyMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface KeyStabilityReport {
  componentName: string;
  keyChanges: number;
  componentMounts: number;
  stabilityScore: number;
}

export const ComponentKeyMonitor: React.FC<ComponentKeyMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [report, setReport] = useState<KeyStabilityReport[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [sortBy, setSortBy] = useState<'stabilityScore' | 'keyChanges' | 'componentMounts'>('stabilityScore');

  // Update report periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateReport = () => {
      const newReport = keyStabilityMonitor.getStabilityReport();
      setReport(newReport);
    };

    updateReport();
    const interval = setInterval(updateReport, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getStabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStabilityIcon = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  };

  const sortedReport = [...report].sort((a, b) => {
    switch (sortBy) {
      case 'stabilityScore': return a.stabilityScore - b.stabilityScore;
      case 'keyChanges': return b.keyChanges - a.keyChanges;
      case 'componentMounts': return b.componentMounts - a.componentMounts;
      default: return 0;
    }
  });

  const handleClearMetrics = () => {
    keyStabilityMonitor.clearMetrics();
    setReport([]);
  };

  const handleClearKeyCache = () => {
    stableKeyGenerator.clearCache();
    console.log('🧹 Component key cache cleared');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-148 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Component Key Monitor"
      >
        🔑
        {report.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-400 text-purple-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {report.filter(r => r.stabilityScore < 70).length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-148 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Component Key Monitor</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
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
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-green-50 p-2 rounded">
            <div className="font-medium text-green-700">Stable Components</div>
            <div className="text-lg font-bold text-green-900">
              {report.filter(r => r.stabilityScore >= 90).length}
            </div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="font-medium text-yellow-700">Warning</div>
            <div className="text-lg font-bold text-yellow-900">
              {report.filter(r => r.stabilityScore >= 70 && r.stabilityScore < 90).length}
            </div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="font-medium text-red-700">Unstable</div>
            <div className="text-lg font-bold text-red-900">
              {report.filter(r => r.stabilityScore < 70).length}
            </div>
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
              <option value="stabilityScore">Stability Score</option>
              <option value="keyChanges">Key Changes</option>
              <option value="componentMounts">Component Mounts</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearKeyCache}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Clear Cache
            </button>
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
            <div className="text-2xl mb-2">🔑</div>
            <div className="text-sm">No component data available</div>
            <div className="text-xs mt-1">Use components with key monitoring to see data</div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedReport.map((component) => (
              <div
                key={component.componentName}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-colors",
                  selectedComponent === component.componentName
                    ? "border-purple-300 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedComponent(
                  selectedComponent === component.componentName ? '' : component.componentName
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStabilityIcon(component.stabilityScore)}</span>
                    <span className="font-medium text-sm">{component.componentName}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      getStabilityColor(component.stabilityScore)
                    )}>
                      {component.stabilityScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {component.keyChanges} changes
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Mounts:</span>{' '}
                    <span className="font-medium text-blue-600">
                      {component.componentMounts}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Changes:</span>{' '}
                    <span className={cn(
                      "font-medium",
                      component.keyChanges > 5 ? "text-red-600" : "text-green-600"
                    )}>
                      {component.keyChanges}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ratio:</span>{' '}
                    <span className="font-medium text-purple-600">
                      {component.componentMounts > 0 
                        ? (component.keyChanges / component.componentMounts).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                </div>

                {selectedComponent === component.componentName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Stability Analysis:</span>
                      </div>
                      {component.stabilityScore >= 90 && (
                        <div className="text-green-600">
                          ✅ Excellent key stability. Component keys are consistent across renders.
                        </div>
                      )}
                      {component.stabilityScore >= 70 && component.stabilityScore < 90 && (
                        <div className="text-yellow-600">
                          ⚠️ Moderate key stability. Some unnecessary key changes detected.
                        </div>
                      )}
                      {component.stabilityScore < 70 && (
                        <div className="text-red-600">
                          ❌ Poor key stability. Frequent key changes causing unnecessary remounts.
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-gray-600">Recommendations:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {component.keyChanges > component.componentMounts * 0.5 && (
                            <li>Use stable identifiers for keys instead of indexes</li>
                          )}
                          {component.keyChanges > 10 && (
                            <li>Consider memoizing key generation logic</li>
                          )}
                          {component.stabilityScore < 50 && (
                            <li>Review component key strategy - may need complete redesign</li>
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
          <div>💡 Tip: Stability score = (1 - keyChanges/componentMounts) × 100</div>
          <div>🎯 Target: >90% for optimal performance</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component Key Monitor Provider
 */
export const ComponentKeyMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
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
        <ComponentKeyMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
