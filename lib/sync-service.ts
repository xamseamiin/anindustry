// lib/sync-service.ts - Sync Service for Online/Offline Data Synchronization
'use client';

import { offlineDB } from './offline-db';

interface SyncItem {
  key: string;       
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  timestamp: number;
}

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncItem[] = [];
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Listen to online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.startSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Start periodic sync check
      this.startPeriodicSync();
    }
  }

  private startPeriodicSync() {
    // Check for sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.startSync();
      }
    }, 30000);
  }

  // Save data locally and queue for sync
  async saveForSync(key: string, data: any, endpoint: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'): Promise<void> {
    // Save to offline database
    await offlineDB.save(key, { data, endpoint, method }, false);

    // Add to sync queue
    this.syncQueue.push({
      key,
      data,
      endpoint,
      method,
      timestamp: Date.now(),
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.startSync();
    }
  }

  // Sync all pending items
  async startSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      // Get all unsynced items from database
      const unsyncedItems = await offlineDB.getUnsynced();

      for (const item of unsyncedItems) {
        try {
          const syncData = item.data;
          
          // Make API call
          const response = await fetch(syncData.endpoint, {
            method: syncData.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(syncData.data),
          });

          if (response.ok) {
            // Mark as synced
            await offlineDB.markAsSynced(item.key);
            
            // Remove from queue
            this.syncQueue = this.syncQueue.filter(q => q.key !== item.key);
          } else {
            console.error(`Sync failed for ${item.key}:`, response.statusText);
          }
        } catch (error) {
          console.error(`Error syncing ${item.key}:`, error);
          // Keep in queue for retry
        }
      }
    } catch (error) {
      console.error('Sync service error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Get offline data
  async getOfflineData(key: string): Promise<any | null> {
    return await offlineDB.get(key);
  }

  // Check if online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get sync queue status
  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.startSync();
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Helper function to wrap API calls with offline support
export async function fetchWithOfflineSupport(
  url: string,
  options: RequestInit = {},
  offlineKey?: string
): Promise<Response> {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // If fetch fails, save for offline sync
      if (offlineKey && options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
        const body = options.body ? JSON.parse(options.body as string) : {};
        await syncService.saveForSync(
          offlineKey,
          body,
          url,
          options.method as 'POST' | 'PUT' | 'DELETE' | 'PATCH'
        );
      }
      throw error;
    }
  } else {
    // Offline: save for later sync
    if (offlineKey && options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      await syncService.saveForSync(
        offlineKey,
        body,
        url,
        options.method as 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      );
      
      // Return a mock response
      return new Response(JSON.stringify({ success: true, offline: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    throw new Error('Offline and no offline key provided');
  }
}


