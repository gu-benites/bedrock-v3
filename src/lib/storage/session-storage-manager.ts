/**
 * Session Storage Manager
 * Handles state persistence with sessionStorage for form data recovery
 */

interface StorageConfig {
  prefix: string;
  version: string;
  maxAge: number; // milliseconds
  compression: boolean;
  encryption: boolean;
}

interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

interface StorageMetadata {
  key: string;
  size: number;
  timestamp: number;
  version: string;
  compressed: boolean;
  encrypted: boolean;
}

class SessionStorageManager {
  private config: StorageConfig;
  private isAvailable: boolean;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      prefix: 'bedrock_',
      version: '1.0.0',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      compression: false,
      encryption: false,
      ...config
    };

    this.isAvailable = this.checkAvailability();
  }

  /**
   * Check if sessionStorage is available
   */
  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }

      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate storage key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Compress data using simple compression
   */
  private compress(data: string): string {
    if (!this.config.compression) return data;
    
    try {
      // Simple compression using JSON.stringify optimization
      return JSON.stringify(JSON.parse(data));
    } catch {
      return data;
    }
  }

  /**
   * Decompress data
   */
  private decompress(data: string): string {
    if (!this.config.compression) return data;
    return data; // Simple compression doesn't need decompression
  }

  /**
   * Encrypt data (basic implementation)
   */
  private encrypt(data: string): string {
    if (!this.config.encryption) return data;
    
    // Basic XOR encryption (not secure, just for obfuscation)
    const key = 'bedrock_key';
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  /**
   * Decrypt data
   */
  private decrypt(data: string): string {
    if (!this.config.encryption) return data;
    
    try {
      const decoded = atob(data);
      const key = 'bedrock_key';
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch {
      return data;
    }
  }

  /**
   * Store data in sessionStorage
   */
  setItem<T>(key: string, data: T, options: { maxAge?: number } = {}): boolean {
    if (!this.isAvailable) {
      console.warn('SessionStorage is not available');
      return false;
    }

    try {
      const storageItem: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.config.version
      };

      let serialized = JSON.stringify(storageItem);
      
      // Add checksum for data integrity
      storageItem.checksum = this.generateChecksum(serialized);
      serialized = JSON.stringify(storageItem);

      // Apply compression and encryption
      serialized = this.compress(serialized);
      serialized = this.encrypt(serialized);

      const storageKey = this.getKey(key);
      sessionStorage.setItem(storageKey, serialized);

      // Log storage operation in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Stored: ${key} (${serialized.length} bytes)`);
      }

      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from sessionStorage
   */
  getItem<T>(key: string): T | null {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const storageKey = this.getKey(key);
      const stored = sessionStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      // Apply decryption and decompression
      let decrypted = this.decrypt(stored);
      decrypted = this.decompress(decrypted);

      const storageItem: StorageItem<T> = JSON.parse(decrypted);

      // Check version compatibility
      if (storageItem.version !== this.config.version) {
        console.warn(`Version mismatch for ${key}: ${storageItem.version} vs ${this.config.version}`);
        this.removeItem(key);
        return null;
      }

      // Check data age
      const age = Date.now() - storageItem.timestamp;
      if (age > this.config.maxAge) {
        console.warn(`Expired data for ${key}: ${age}ms old`);
        this.removeItem(key);
        return null;
      }

      // Verify checksum if available
      if (storageItem.checksum) {
        const currentChecksum = this.generateChecksum(JSON.stringify({
          data: storageItem.data,
          timestamp: storageItem.timestamp,
          version: storageItem.version
        }));
        
        if (currentChecksum !== storageItem.checksum) {
          console.warn(`Checksum mismatch for ${key}, data may be corrupted`);
          this.removeItem(key);
          return null;
        }
      }

      // Log retrieval in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📂 Retrieved: ${key} (age: ${age}ms)`);
      }

      return storageItem.data;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      this.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeItem(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const storageKey = this.getKey(key);
      sessionStorage.removeItem(storageKey);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Removed: ${key}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  /**
   * Check if item exists
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get all stored keys with prefix
   */
  getKeys(): string[] {
    if (!this.isAvailable) {
      return [];
    }

    const keys: string[] = [];
    const prefix = this.config.prefix;

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }

  /**
   * Get storage metadata for all items
   */
  getMetadata(): StorageMetadata[] {
    const keys = this.getKeys();
    const metadata: StorageMetadata[] = [];

    keys.forEach(key => {
      try {
        const storageKey = this.getKey(key);
        const stored = sessionStorage.getItem(storageKey);
        
        if (stored) {
          const decrypted = this.decrypt(stored);
          const decompressed = this.decompress(decrypted);
          const storageItem: StorageItem = JSON.parse(decompressed);

          metadata.push({
            key,
            size: stored.length,
            timestamp: storageItem.timestamp,
            version: storageItem.version,
            compressed: this.config.compression,
            encrypted: this.config.encryption
          });
        }
      } catch (error) {
        console.error(`Failed to get metadata for ${key}:`, error);
      }
    });

    return metadata.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all items with prefix
   */
  clear(): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const keys = this.getKeys();
      keys.forEach(key => this.removeItem(key));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cleared ${keys.length} items`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getUsageStats(): {
    totalItems: number;
    totalSize: number;
    averageSize: number;
    oldestItem: number;
    newestItem: number;
    storageQuota: number;
    usagePercentage: number;
  } {
    const metadata = this.getMetadata();
    const totalItems = metadata.length;
    const totalSize = metadata.reduce((sum, item) => sum + item.size, 0);
    const averageSize = totalItems > 0 ? totalSize / totalItems : 0;
    const timestamps = metadata.map(item => item.timestamp);
    const oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestItem = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    // Estimate storage quota (sessionStorage typically 5-10MB)
    const storageQuota = 5 * 1024 * 1024; // 5MB estimate
    const usagePercentage = (totalSize / storageQuota) * 100;

    return {
      totalItems,
      totalSize,
      averageSize,
      oldestItem,
      newestItem,
      storageQuota,
      usagePercentage
    };
  }

  /**
   * Cleanup expired items
   */
  cleanup(): number {
    if (!this.isAvailable) {
      return 0;
    }

    const keys = this.getKeys();
    let cleanedCount = 0;

    keys.forEach(key => {
      const data = this.getItem(key);
      if (data === null) {
        cleanedCount++;
      }
    });

    if (process.env.NODE_ENV === 'development' && cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired items`);
    }

    return cleanedCount;
  }

  /**
   * Export all data for backup
   */
  exportData(): string {
    const keys = this.getKeys();
    const exportData: Record<string, any> = {};

    keys.forEach(key => {
      const data = this.getItem(key);
      if (data !== null) {
        exportData[key] = data;
      }
    });

    return JSON.stringify({
      version: this.config.version,
      timestamp: Date.now(),
      data: exportData
    }, null, 2);
  }

  /**
   * Import data from backup
   */
  importData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.version !== this.config.version) {
        console.warn('Version mismatch during import');
        return false;
      }

      Object.entries(importData.data).forEach(([key, value]) => {
        this.setItem(key, value);
      });

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Global session storage manager instance
export const sessionStorageManager = new SessionStorageManager({
  prefix: 'bedrock_recipe_',
  version: '1.0.0',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  compression: true,
  encryption: false // Disabled for development, enable for production
});

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).sessionStorageManager = sessionStorageManager;
}

export { SessionStorageManager };
export type { StorageConfig, StorageItem, StorageMetadata };
