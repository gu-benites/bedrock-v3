/**
 * Performance Timing Dashboard
 * Visual dashboard for monitoring navigation and performance timing in create-recipe workflow
 */

'use client';

import React, { useState, useEffect } from 'react';
import { navigationTiming, type NavigationEvent } from '@/lib/performance/navigation-timing';
import { cn } from '@/lib/utils';

interface PerformanceTimingDashboardProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const PerformanceTimingDashboard: React.FC<PerformanceTimingDashboardProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [events, setEvents] = useState<NavigationEvent[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [filter, setFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Update events and summary
  useEffect(() => {
    if (isVisible) {
      const allEvents = navigationTiming.getEvents();
      const performanceSummary = navigationTiming.getPerformanceSummary();
      
      setEvents(allEvents);
      setSummary(performanceSummary);
    }
  }, [isVisible]);

  // Auto-refresh every 2 seconds when visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const allEvents = navigationTiming.getEvents();
      const performanceSummary = navigationTiming.getPerformanceSummary();
      
      setEvents(allEvents);
      setSummary(performanceSummary);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.eventType === filter);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'navigation': return '🧭';
      case 'component_load': return '🧩';
      case 'ai_streaming': return '🤖';
      case 'user_interaction': return '👆';
      default: return '📊';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'navigation': return 'text-blue-600 bg-blue-50';
      case 'component_load': return 'text-green-600 bg-green-50';
      case 'ai_streaming': return 'text-purple-600 bg-purple-50';
      case 'user_interaction': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration.toFixed(2)}ms`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(Date.now() - performance.now() + timestamp);
    return date.toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-36 right-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Show Performance Timing Dashboard"
      >
        ⏱️
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-36 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-lg",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Performance Timing</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
            title="Hide dashboard"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <div className="font-medium text-blue-700 dark:text-blue-300">Total Events</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {summary.totalEvents || 0}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <div className="font-medium text-green-700 dark:text-green-300">Avg Navigation</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatDuration(summary.averageNavigationTime)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
            <div className="font-medium text-purple-700 dark:text-purple-300">Avg Component</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {formatDuration(summary.averageComponentLoadTime)}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <div className="font-medium text-red-700 dark:text-red-300">Threshold Violations</div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {summary.thresholdViolations || 0}
            </div>
          </div>
        </div>

        {summary.memoryUsage && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            <div className="font-medium text-yellow-700 dark:text-yellow-300 text-xs">
              Memory Usage
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {summary.memoryUsage}MB
            </div>
          </div>
        )}
      </div>

      {/* Event Filter */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Recent Events</h4>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Events</option>
                <option value="navigation">Navigation</option>
                <option value="component_load">Components</option>
                <option value="ai_streaming">AI Streaming</option>
                <option value="user_interaction">User Actions</option>
              </select>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No events recorded yet
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredEvents.slice(-10).reverse().map((event, index) => (
                  <div
                    key={`${event.eventId}-${index}`}
                    className={cn(
                      "p-2 rounded text-xs border",
                      getEventColor(event.eventType)
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center">
                        <span className="mr-1">{getEventIcon(event.eventType)}</span>
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    
                    <div className="text-xs opacity-75">
                      {event.eventId}
                      {event.duration && (
                        <span className="ml-2 font-medium">
                          {formatDuration(event.duration)}
                        </span>
                      )}
                    </div>

                    {event.fromStep && event.toStep && (
                      <div className="text-xs opacity-75 mt-1">
                        {event.fromStep} → {event.toStep}
                      </div>
                    )}

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="text-xs opacity-75 mt-1 truncate">
                        {Object.entries(event.metadata)
                          .slice(0, 2)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
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
                onClick={() => {
                  console.log('📊 Performance Timing Events:', events);
                  console.log('📊 Performance Summary:', summary);
                  navigationTiming.logToConsole && console.log('📊 Detailed Report:', navigationTiming.exportEvents());
                }}
                className="flex-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
              >
                Log Report
              </button>
              <button
                onClick={() => {
                  const data = navigationTiming.exportEvents();
                  navigator.clipboard?.writeText(data);
                }}
                className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
              >
                Export Data
              </button>
              <button
                onClick={() => {
                  navigationTiming.clearEvents();
                  setEvents([]);
                  setSummary({});
                }}
                className="flex-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Performance Timing Dashboard Provider
 */
export const PerformanceTimingDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle dashboard
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
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
        <PerformanceTimingDashboard 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
