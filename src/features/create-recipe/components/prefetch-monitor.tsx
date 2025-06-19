/**
 * Prefetch Monitor Component
 * Displays intelligent prefetching insights and user behavior analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePrefetchMetrics, useIntelligentPrefetcher } from '@/hooks/use-route-prefetcher';
import { useComponentPreloader } from '@/lib/preload/component-preloader';
import { useRecipeStore } from '../store/recipe-store';
import { cn } from '@/lib/utils';

interface PrefetchMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const PrefetchMonitor: React.FC<PrefetchMonitorProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const { currentStep } = useRecipeStore();
  const metrics = usePrefetchMetrics();
  const { getIntelligentRecommendations, getUserBehaviorStats } = useIntelligentPrefetcher(currentStep);
  const { getFailureStats, clearFailureHistory } = useComponentPreloader();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [behaviorStats, setBehaviorStats] = useState<any>({});
  const [failureStats, setFailureStats] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Update recommendations and stats
  useEffect(() => {
    if (isVisible) {
      setRecommendations(getIntelligentRecommendations());
      setBehaviorStats(getUserBehaviorStats());
      setFailureStats(getFailureStats());
    }
  }, [isVisible, currentStep, getIntelligentRecommendations, getUserBehaviorStats, getFailureStats]);

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-20 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Prefetch Monitor"
      >
        🧠
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Intelligent Prefetching</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            metrics.currentlyPrefetching > 0 ? "bg-purple-500 animate-pulse" : "bg-gray-400"
          )} />
        </div>
        <div className="flex items-center space-x-1">
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
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
            <div className="font-medium text-purple-700 dark:text-purple-300">Routes</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {metrics.totalPrefetched}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <div className="font-medium text-green-700 dark:text-green-300">Components</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {(metrics as any).componentsPreloaded || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <div className="font-medium text-blue-700 dark:text-blue-300">Assets</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {(metrics as any).assetsPreloaded || 0}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            <div className="font-medium text-yellow-700 dark:text-yellow-300">Avg Time</div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {((metrics as any).averagePreloadTime || 0).toFixed(0)}ms
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <div className="font-medium text-blue-700 dark:text-blue-300 text-xs">
            Active Prefetches
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {metrics.currentlyPrefetching}
          </div>
        </div>

        {/* Streaming Status */}
        {(metrics as any).isStreamingActive && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
            <div className="font-medium text-orange-700 dark:text-orange-300 text-xs">
              Streaming Active
            </div>
            <div className="text-sm font-bold text-orange-900 dark:text-orange-100">
              {Math.round(((metrics as any).streamingDuration || 0) / 1000)}s
            </div>
          </div>
        )}
      </div>

      {/* Intelligent Recommendations */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
            
            {recommendations.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-2">
                No recommendations available
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded text-xs border",
                      rec.priority === 'high'
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate" title={rec.route}>
                        {rec.route.split('/').pop() || rec.route}
                      </span>
                      <span className={cn(
                        "px-1 py-0.5 rounded text-xs",
                        rec.priority === 'high'
                          ? "bg-orange-200 text-orange-800"
                          : "bg-gray-200 text-gray-800"
                      )}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {rec.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Behavior Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <h4 className="text-sm font-medium mb-2">User Behavior</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Total Navigations:</span>
                <span className="font-medium">{behaviorStats.totalNavigations || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Back Navigation Rate:</span>
                <span className="font-medium">
                  {((behaviorStats.backNavigationRate || 0) * 100).toFixed(0)}%
                </span>
              </div>

              {behaviorStats.averageStepTimes && Object.keys(behaviorStats.averageStepTimes).length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Avg Step Times:</div>
                  <div className="space-y-1">
                    {Object.entries(behaviorStats.averageStepTimes).map(([step, time]) => (
                      <div key={step} className="flex justify-between text-xs">
                        <span className="truncate">{step.split('.').pop()}:</span>
                        <span>{((time as number) / 1000).toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {behaviorStats.preferredPaths && Object.keys(behaviorStats.preferredPaths).length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Preferred Paths:</div>
                  <div className="space-y-1">
                    {Object.entries(behaviorStats.preferredPaths)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([path, count]) => (
                        <div key={path} className="flex justify-between text-xs">
                          <span className="truncate">{path.replace(/RecipeStep\./g, '')}:</span>
                          <span>{count as number}x</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Failure Statistics */}
          {failureStats.totalFailures > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-sm font-medium mb-2 text-red-700 dark:text-red-300">
                Failure Statistics
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Total Failures:</span>
                  <span className="font-medium text-red-600">{failureStats.totalFailures}</span>
                </div>

                <div className="flex justify-between">
                  <span>Failure Rate:</span>
                  <span className="font-medium text-red-600">
                    {failureStats.failureRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Fallbacks Used:</span>
                  <span className="font-medium text-orange-600">{failureStats.fallbacksUsed}</span>
                </div>

                <div className="flex justify-between">
                  <span>Retry Attempts:</span>
                  <span className="font-medium text-blue-600">{failureStats.retryAttempts}</span>
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => {
                      clearFailureHistory();
                      setFailureStats(getFailureStats());
                    }}
                    className="w-full text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Clear Failure History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  console.log('🧠 Prefetch Metrics:', metrics);
                  console.log('🧠 User Behavior Stats:', behaviorStats);
                  console.log('🧠 Current Recommendations:', recommendations);
                  console.log('🧠 Failure Stats:', failureStats);
                }}
                className="flex-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
              >
                Log Analytics
              </button>
              <button
                onClick={() => {
                  const data = { metrics, behaviorStats, recommendations, failureStats };
                  navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
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
 * Prefetch Monitor Provider
 */
export const PrefetchMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
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
        <PrefetchMonitor 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
