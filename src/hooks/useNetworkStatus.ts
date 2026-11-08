import { useState, useEffect } from 'react';
import { Network, type ConnectionStatus } from '@capacitor/network';

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

// Module-level state for instant synchronous reads across app/store
let currentNetworkState: NetworkState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown',
};

type NetworkListener = (state: NetworkState) => void;
const listeners = new Set<NetworkListener>();

/**
 * Returns current online status synchronously.
 */
export function getIsOnline(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  return currentNetworkState.isOnline;
}

/**
 * Subscribes to network status changes (reconnect/disconnect events).
 * Returns unsubscribe cleanup function.
 */
export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  listeners.add(listener);
  listener(currentNetworkState);
  return () => {
    listeners.delete(listener);
  };
}

function updateState(newState: Partial<NetworkState>) {
  currentNetworkState = { ...currentNetworkState, ...newState };
  listeners.forEach((cb) => cb(currentNetworkState));
}

// Initialize listener once at module scope
if (typeof window !== 'undefined') {
  // 1. Initial query via Capacitor Network plugin
  Network.getStatus()
    .then((status: ConnectionStatus) => {
      updateState({
        isOnline: status.connected,
        connectionType: status.connectionType,
      });
    })
    .catch(() => {
      // Browser fallback
      updateState({
        isOnline: navigator.onLine,
        connectionType: 'browser',
      });
    });

  // 2. Capacitor Network event listener
  Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
    updateState({
      isOnline: status.connected,
      connectionType: status.connectionType,
    });
  }).catch(() => {
    // Non-native fallback handled by window listeners below
  });

  // 3. Window events fallback (Browser / PWA)
  window.addEventListener('online', () => {
    updateState({ isOnline: true });
  });

  window.addEventListener('offline', () => {
    updateState({ isOnline: false });
  });
}

/**
 * React hook for tracking online/offline status and connection type.
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(currentNetworkState);

  useEffect(() => {
    return subscribeNetworkStatus(setState);
  }, []);

  return state;
}
