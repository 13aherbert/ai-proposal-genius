import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthUser } from './auth/AuthUserContext';

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface OfflineSyncOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  maxRetries?: number;
}

/**
 * Hook for managing offline data and synchronization
 */
export function useOfflineSync(options: OfflineSyncOptions = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<SyncQueueItem[]>([]);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const { isOffline } = useAuthUser();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = options.maxRetries || 3;
  
  // Load pending changes from storage on init
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem('offlineSyncQueue');
      if (storedQueue) {
        const queue = JSON.parse(storedQueue);
        if (Array.isArray(queue) && queue.length > 0) {
          setPendingChanges(queue);
          setHasUnsyncedChanges(true);
        }
      }
    } catch (err) {
      console.error("Error loading offline sync queue:", err);
    }
  }, []);
  
  // Save changes to local storage whenever the queue changes
  useEffect(() => {
    if (pendingChanges.length > 0) {
      try {
        localStorage.setItem('offlineSyncQueue', JSON.stringify(pendingChanges));
        setHasUnsyncedChanges(true);
      } catch (err) {
        console.error("Error saving offline sync queue:", err);
      }
    } else {
      localStorage.removeItem('offlineSyncQueue');
      setHasUnsyncedChanges(false);
    }
  }, [pendingChanges]);
  
  // Set up listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (pendingChanges.length > 0) {
        // Wait a bit for the connection to stabilize before syncing
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        
        syncTimeoutRef.current = setTimeout(() => {
          syncOfflineChanges();
        }, 2000);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('networkReconnected', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('networkReconnected', handleOnline);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pendingChanges]);
  
  /**
   * Queue an operation to be executed when online
   */
  const queueOperation = useCallback((
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    data: any
  ) => {
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      operation,
      entityType,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    setPendingChanges(current => [...current, queueItem]);
    
    if (isOffline) {
      toast.info(`Changes will be saved when you're back online`, {
        description: `Your ${operation} operation has been queued`,
      });
    }
    
    return queueItem.id;
  }, [isOffline]);
  
  /**
   * Remove an operation from the queue
   */
  const removeOperation = useCallback((id: string) => {
    setPendingChanges(current => current.filter(item => item.id !== id));
  }, []);
  
  /**
   * Sync all pending offline changes
   */
  const syncOfflineChanges = useCallback(async () => {
    if (isSyncing || isOffline || pendingChanges.length === 0) {
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const changes = [...pendingChanges];
      let successCount = 0;
      let failedItems: SyncQueueItem[] = [];
      
      // Sort by timestamp and operation type (creates first, then updates, then deletes)
      const sortedChanges = changes.sort((a, b) => {
        // First by operation priority
        const opPriority = { create: 0, update: 1, delete: 2 };
        const priorityDiff = opPriority[a.operation] - opPriority[b.operation];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by timestamp
        return a.timestamp - b.timestamp;
      });
      
      // Process each change
      for (const item of sortedChanges) {
        try {
          // Here we would normally call an API to process the operation
          // For demonstration, we'll just simulate success
          console.log(`Processing offline ${item.operation} for ${item.entityType}`);
          
          // Simulate API call with proper error handling
          // await processChange(item);
          
          // If successful, increment success count
          successCount++;
        } catch (error) {
          console.error(`Failed to sync ${item.operation} for ${item.entityType}:`, error);
          
          // If we've exceeded max retries, log and continue
          if (item.retries >= maxRetries) {
            console.error(`Max retries exceeded for ${item.id}, removing from queue`);
          } else {
            // Otherwise, increment retry count and add to failed items
            failedItems.push({
              ...item,
              retries: item.retries + 1
            });
          }
        }
      }
      
      // Update the queue with failed items
      setPendingChanges(failedItems);
      
      // Show success message if any items were processed
      if (successCount > 0) {
        toast.success(`Synced ${successCount} offline changes`);
      }
      
      // Update last sync time
      setLastSyncTime(Date.now());
      
      // Call onSyncComplete callback
      if (options.onSyncComplete) {
        options.onSyncComplete();
      }
    } catch (error) {
      console.error("Error syncing offline changes:", error);
      
      // Call onSyncError callback
      if (options.onSyncError && error instanceof Error) {
        options.onSyncError(error);
      }
      
      toast.error("Failed to sync some offline changes", {
        description: "Will try again automatically"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOffline, pendingChanges, options, maxRetries]);
  
  return {
    queueOperation,
    removeOperation,
    syncOfflineChanges,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    hasUnsyncedChanges
  };
}
