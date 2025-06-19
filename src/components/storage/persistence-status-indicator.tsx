/**
 * Persistence Status Indicator
 * Visual indicator for state persistence status and recovery options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { sessionStorageManager } from '@/lib/storage/session-storage-manager';
import { cn } from '@/lib/utils';

interface PersistenceStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onRestore?: () => void;
  onClear?: () => void;
}

interface PersistenceStatus {
  hasPersistedData: boolean;
  lastSaved: number | null;
  dataSize: number;
  itemCount: number;
  usagePercentage: number;
}

export const PersistenceStatusIndicator: React.FC<PersistenceStatusIndicatorProps> = ({
  className,
  showDetails = false,
  onRestore,
  onClear
}) => {
  const [status, setStatus] = useState<PersistenceStatus>({
    hasPersistedData: false,
    lastSaved: null,
    dataSize: 0,
    itemCount: 0,
    usagePercentage: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      const metadata = sessionStorageManager.getMetadata();
      const usageStats = sessionStorageManager.getUsageStats();
      const hasRecipeData = sessionStorageManager.hasItem('recipe_wizard_state');

      setStatus({
        hasPersistedData: hasRecipeData || metadata.length > 0,
        lastSaved: metadata.length > 0 ? Math.max(...metadata.map(m => m.timestamp)) : null,
        dataSize: usageStats.totalSize,
        itemCount: usageStats.totalItems,
        usagePercentage: usageStats.usagePercentage
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusColor = () => {
    if (!status.hasPersistedData) return 'text-gray-500';
    if (status.lastSaved && Date.now() - status.lastSaved < 60000) return 'text-green-600';
    if (status.lastSaved && Date.now() - status.lastSaved < 300000) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (!status.hasPersistedData) return '💾';
    if (status.lastSaved && Date.now() - status.lastSaved < 60000) return '✅';
    if (status.lastSaved && Date.now() - status.lastSaved < 300000) return '💾';
    return '⚠️';
  };

  const handleRestore = () => {
    onRestore?.();
  };

  const handleClear = () => {
    sessionStorageManager.clear();
    setStatus({
      hasPersistedData: false,
      lastSaved: null,
      dataSize: 0,
      itemCount: 0,
      usagePercentage: 0
    });
    onClear?.();
  };

  if (!showDetails && !status.hasPersistedData) {
    return null;
  }

  return (
    <div className={cn("bg-gray-50 border border-gray-200 rounded-lg", className)}>
      {/* Compact Status */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div className="text-sm">
            <div className={cn("font-medium", getStatusColor())}>
              {status.hasPersistedData ? 'Data Saved' : 'No Saved Data'}
            </div>
            {status.lastSaved && (
              <div className="text-xs text-gray-500">
                {formatTimeAgo(status.lastSaved)}
              </div>
            )}
          </div>
        </div>
        
        {showDetails && (
          <div className="flex items-center space-x-2">
            {status.hasPersistedData && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore();
                  }}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Restore
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                >
                  Clear
                </button>
              </>
            )}
            <span className="text-xs text-gray-400">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && showDetails && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* Storage Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-600">Items Stored</div>
              <div className="font-bold text-gray-900">{status.itemCount}</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-600">Storage Used</div>
              <div className="font-bold text-gray-900">{formatFileSize(status.dataSize)}</div>
            </div>
          </div>

          {/* Usage Bar */}
          {status.usagePercentage > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Storage Usage</span>
                <span>{status.usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    status.usagePercentage < 50 ? "bg-green-500" :
                    status.usagePercentage < 80 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(status.usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Stored Items */}
          {status.hasPersistedData && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Stored Data</div>
              <div className="space-y-1">
                {sessionStorageManager.getMetadata().map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                    <div>
                      <div className="font-medium">{item.key}</div>
                      <div className="text-gray-500">{formatTimeAgo(item.timestamp)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatFileSize(item.size)}</div>
                      <div className="text-gray-500">v{item.version}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                const data = sessionStorageManager.exportData();
                navigator.clipboard?.writeText(data);
                console.log('📋 Persistence data exported to clipboard');
              }}
              className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              Export Data
            </button>
            <button
              onClick={() => {
                const cleaned = sessionStorageManager.cleanup();
                console.log(`🧹 Cleaned up ${cleaned} expired items`);
              }}
              className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Cleanup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Simple persistence status badge
 */
export const PersistenceStatusBadge: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [hasData, setHasData] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      const metadata = sessionStorageManager.getMetadata();
      setHasData(metadata.length > 0);
      setLastSaved(metadata.length > 0 ? Math.max(...metadata.map(m => m.timestamp)) : null);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!hasData) return null;

  const isRecent = lastSaved && Date.now() - lastSaved < 60000;

  return (
    <div className={cn(
      "inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs",
      isRecent ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700",
      className
    )}>
      <span>{isRecent ? '✅' : '💾'}</span>
      <span>Saved</span>
      {lastSaved && (
        <span className="opacity-75">
          {formatTimeAgo(lastSaved)}
        </span>
      )}
    </div>
  );
};

// Helper function for time formatting
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}
