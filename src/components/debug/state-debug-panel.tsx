/**
 * State Debug Panel
 * Visual interface for monitoring and debugging state changes in development
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { stateChangeMonitor } from '@/lib/debug/state-change-monitor';
import { cn } from '@/lib/utils';

interface StateDebugPanelProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface StateChange {
  id: string;
  timestamp: number;
  action: string;
  storeName: string;
  previousState: any;
  newState: any;
  diff: any;
  stackTrace?: string;
  componentName?: string;
}

export const StateDebugPanel: React.FC<StateDebugPanelProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [changes, setChanges] = useState<StateChange[]>([]);
  const [selectedChange, setSelectedChange] = useState<StateChange | null>(null);
  const [filter, setFilter] = useState({
    storeName: '',
    action: '',
    componentName: ''
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Update changes from monitor
  useEffect(() => {
    if (!isVisible || isPaused) return;

    const updateChanges = () => {
      const allChanges = stateChangeMonitor.getChanges(filter);
      setChanges(allChanges.slice(0, 100)); // Limit to last 100 changes
    };

    updateChanges();
    const interval = setInterval(updateChanges, 1000);

    // Subscribe to real-time changes
    const unsubscribe = stateChangeMonitor.subscribe((change) => {
      if (!isPaused) {
        setChanges(prev => [change, ...prev.slice(0, 99)]);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isVisible, filter, isPaused]);

  const handleClearChanges = useCallback(() => {
    stateChangeMonitor.clear();
    setChanges([]);
    setSelectedChange(null);
  }, []);

  const handleExportData = useCallback(() => {
    const data = stateChangeMonitor.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getChangeIcon = (storeName: string) => {
    switch (storeName) {
      case 'recipe-store': return '🍯';
      case 'component': return '🧩';
      default: return '📦';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'updateDemographics': return 'text-blue-600 bg-blue-50';
      case 'updateSelectedCauses': return 'text-green-600 bg-green-50';
      case 'updateSelectedSymptoms': return 'text-purple-600 bg-purple-50';
      case 'updateTherapeuticProperties': return 'text-orange-600 bg-orange-50';
      case 'setError': return 'text-red-600 bg-red-50';
      case 'setLoading': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-92 right-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Show State Debug Panel"
      >
        🔍
        {changes.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-400 text-indigo-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {changes.length > 99 ? '99+' : changes.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-92 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-96",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">State Debug Panel</span>
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isPaused ? "bg-yellow-500" : "bg-green-500"
            )} />
            <span className="text-xs text-gray-600">
              {changes.length} changes
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "p-1 rounded text-xs transition-colors",
              isPaused 
                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            )}
            title={isPaused ? "Resume monitoring" : "Pause monitoring"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Filter by store..."
            value={filter.storeName}
            onChange={(e) => setFilter(prev => ({ ...prev, storeName: e.target.value }))}
            className="flex-1 text-xs border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Filter by action..."
            value={filter.action}
            onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value }))}
            className="flex-1 text-xs border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={handleClearChanges}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear
            </button>
            <button
              onClick={handleExportData}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Export
            </button>
          </div>
          <label className="flex items-center space-x-1 text-xs">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Changes List */}
      <div className="flex h-64">
        {/* Changes List */}
        <div className="flex-1 overflow-y-auto border-r border-gray-200">
          {changes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No state changes detected</div>
              <div className="text-xs mt-1">
                {isPaused ? 'Monitoring paused' : 'Waiting for changes...'}
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className={cn(
                    "p-2 rounded cursor-pointer transition-colors text-xs",
                    selectedChange?.id === change.id
                      ? "bg-indigo-100 border border-indigo-300"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                  onClick={() => setSelectedChange(change)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <span>{getChangeIcon(change.storeName)}</span>
                      <span className="font-medium">{change.storeName}</span>
                    </div>
                    <span className="text-gray-500">
                      {formatTimestamp(change.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs",
                      getActionColor(change.action)
                    )}>
                      {change.action}
                    </span>
                    {change.componentName && (
                      <span className="text-gray-600 text-xs">
                        {change.componentName}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {Object.keys(change.diff).length} field(s) changed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Details */}
        <div className="w-48 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {selectedChange ? (
            <div className="p-3 space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Action</h4>
                <div className={cn(
                  "px-2 py-1 rounded text-xs",
                  getActionColor(selectedChange.action)
                )}>
                  {selectedChange.action}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Changes</h4>
                <div className="space-y-1">
                  {Object.entries(selectedChange.diff).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-xs">
                      <div className="font-medium text-gray-600">{key}:</div>
                      <div className="ml-2 space-y-1">
                        <div className="text-red-600">
                          - {JSON.stringify(value.from)}
                        </div>
                        <div className="text-green-600">
                          + {JSON.stringify(value.to)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChange.componentName && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Component</h4>
                  <div className="text-xs text-gray-600">
                    {selectedChange.componentName}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Timestamp</h4>
                <div className="text-xs text-gray-600">
                  {new Date(selectedChange.timestamp).toISOString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              <div className="text-xs">Select a change to view details</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 Tip: Use filters to focus on specific stores or actions</div>
          <div>🎯 Click changes to see detailed diff information</div>
        </div>
      </div>
    </div>
  );
};

/**
 * State Debug Panel Provider
 */
export const StateDebugPanelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle panel
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
        <StateDebugPanel 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
