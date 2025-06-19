/**
 * Persistence Management Panel
 * Comprehensive interface for managing state persistence and recovery
 */

'use client';

import React, { useState, useEffect } from 'react';
import { sessionStorageManager } from '@/lib/storage/session-storage-manager';
import { PersistenceStatusIndicator } from './persistence-status-indicator';
import { cn } from '@/lib/utils';

interface PersistenceManagementPanelProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

interface StorageAnalytics {
  totalItems: number;
  totalSize: number;
  usagePercentage: number;
  oldestItem: number;
  newestItem: number;
  itemsByType: Record<string, number>;
  sizeByType: Record<string, number>;
}

export const PersistenceManagementPanel: React.FC<PersistenceManagementPanelProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [analytics, setAnalytics] = useState<StorageAnalytics>({
    totalItems: 0,
    totalSize: 0,
    usagePercentage: 0,
    oldestItem: 0,
    newestItem: 0,
    itemsByType: {},
    sizeByType: {}
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'items' | 'analytics'>('overview');
  const [storageItems, setStorageItems] = useState<any[]>([]);

  // Update analytics and items
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      const metadata = sessionStorageManager.getMetadata();
      const usageStats = sessionStorageManager.getUsageStats();

      // Calculate analytics
      const itemsByType: Record<string, number> = {};
      const sizeByType: Record<string, number> = {};

      metadata.forEach(item => {
        const type = item.key.split('_')[0] || 'unknown';
        itemsByType[type] = (itemsByType[type] || 0) + 1;
        sizeByType[type] = (sizeByType[type] || 0) + item.size;
      });

      setAnalytics({
        totalItems: usageStats.totalItems,
        totalSize: usageStats.totalSize,
        usagePercentage: usageStats.usagePercentage,
        oldestItem: usageStats.oldestItem,
        newestItem: usageStats.newestItem,
        itemsByType,
        sizeByType
      });

      setStorageItems(metadata);
    };

    updateData();
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  const handleExportAll = () => {
    const data = sessionStorageManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bedrock-persistence-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = sessionStorageManager.importData(data);
        if (success) {
          console.log('✅ Data imported successfully');
        } else {
          console.error('❌ Failed to import data');
        }
      } catch (error) {
        console.error('❌ Invalid import file:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all persisted data? This action cannot be undone.')) {
      sessionStorageManager.clear();
      setAnalytics({
        totalItems: 0,
        totalSize: 0,
        usagePercentage: 0,
        oldestItem: 0,
        newestItem: 0,
        itemsByType: {},
        sizeByType: {}
      });
      setStorageItems([]);
    }
  };

  const handleCleanup = () => {
    const cleaned = sessionStorageManager.cleanup();
    console.log(`🧹 Cleaned up ${cleaned} expired items`);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-132 right-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Show Persistence Management Panel"
      >
        💾
        {analytics.totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-400 text-indigo-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {analytics.totalItems}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-132 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Persistence Management</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">{analytics.totalItems} items</span>
          </div>
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['overview', 'items', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium capitalize",
              selectedTab === tab
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {selectedTab === 'overview' && (
          <div className="p-3 space-y-4">
            {/* Status Indicator */}
            <PersistenceStatusIndicator 
              showDetails={true}
              onRestore={() => window.location.reload()}
              onClear={handleClearAll}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm font-medium text-blue-700">Total Items</div>
                <div className="text-xl font-bold text-blue-900">{analytics.totalItems}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm font-medium text-green-700">Storage Used</div>
                <div className="text-xl font-bold text-green-900">{formatFileSize(analytics.totalSize)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm font-medium text-purple-700">Usage</div>
                <div className="text-xl font-bold text-purple-900">{analytics.usagePercentage.toFixed(1)}%</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={handleExportAll}
                  className="flex-1 text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                >
                  Export All Data
                </button>
                <label className="flex-1 text-sm bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 cursor-pointer text-center">
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCleanup}
                  className="flex-1 text-sm bg-yellow-100 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-200"
                >
                  Cleanup Expired
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 text-sm bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'items' && (
          <div className="p-3">
            {storageItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">💾</div>
                <div className="text-sm">No stored items</div>
              </div>
            ) : (
              <div className="space-y-2">
                {storageItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{item.key}</div>
                        <div className="text-xs text-gray-500">
                          Version {item.version} • {formatTimeAgo(item.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatFileSize(item.size)}</div>
                        <div className="flex space-x-1 text-xs">
                          {item.compressed && <span className="bg-blue-100 text-blue-700 px-1 rounded">Compressed</span>}
                          {item.encrypted && <span className="bg-green-100 text-green-700 px-1 rounded">Encrypted</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const data = sessionStorageManager.getItem(item.key);
                          console.log(`📂 ${item.key}:`, data);
                        }}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          sessionStorageManager.removeItem(item.key);
                          setStorageItems(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="p-3 space-y-4">
            {/* Storage by Type */}
            <div>
              <h4 className="text-sm font-medium mb-2">Storage by Type</h4>
              <div className="space-y-2">
                {Object.entries(analytics.itemsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div>
                      <div className="font-medium text-sm capitalize">{type}</div>
                      <div className="text-xs text-gray-500">{count} items</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatFileSize(analytics.sizeByType[type] || 0)}</div>
                      <div className="text-xs text-gray-500">
                        {((analytics.sizeByType[type] || 0) / analytics.totalSize * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-2">Timeline</h4>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-xs">
                  <div>
                    <div className="text-gray-600">Oldest Item</div>
                    <div className="font-medium">{formatTimeAgo(analytics.oldestItem)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">Newest Item</div>
                    <div className="font-medium">{formatTimeAgo(analytics.newestItem)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Persistence Management Panel Provider
 */
export const PersistenceManagementPanelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
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
        <PersistenceManagementPanel 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
