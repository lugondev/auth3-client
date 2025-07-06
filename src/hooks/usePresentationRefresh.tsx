'use client';

import { useCallback, useRef } from 'react';

/**
 * Custom hook for managing presentation list refresh across components
 * This solves the issue where presentations are created in forms but don't appear in lists
 */

type RefreshCallback = () => Promise<void> | void;

class PresentationRefreshManager {
  private listeners: Set<RefreshCallback> = new Set();

  subscribe(callback: RefreshCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async notify() {
    const promises = Array.from(this.listeners).map(callback => {
      try {
        return Promise.resolve(callback());
      } catch (error) {
        console.error('Error in presentation refresh callback:', error);
        return Promise.resolve();
      }
    });
    
    await Promise.all(promises);
  }
}

// Global singleton instance
const refreshManager = new PresentationRefreshManager();

/**
 * Hook for components that display presentation lists
 * Call this in PresentationList components to listen for refresh events
 */
export function usePresentationRefreshListener(refreshCallback: RefreshCallback) {
  const callbackRef = useRef(refreshCallback);
  callbackRef.current = refreshCallback;

  const stableCallback = useCallback(() => {
    return callbackRef.current();
  }, []);

  // Subscribe to refresh events
  const unsubscribe = useCallback(() => {
    return refreshManager.subscribe(stableCallback);
  }, [stableCallback]);

  return unsubscribe;
}

/**
 * Hook for components that create presentations
 * Call this when a presentation is successfully created
 */
export function usePresentationRefreshTrigger() {
  const triggerRefresh = useCallback(async () => {
    console.log('📢 Triggering presentation list refresh');
    await refreshManager.notify();
  }, []);

  return triggerRefresh;
}

/**
 * Manual refresh function for external use
 */
export const triggerPresentationRefresh = () => {
  return refreshManager.notify();
};

export default {
  usePresentationRefreshListener,
  usePresentationRefreshTrigger,
  triggerPresentationRefresh
};
