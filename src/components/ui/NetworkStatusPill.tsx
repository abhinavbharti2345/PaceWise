import { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useStore } from '../../store/useStore';

export function NetworkStatusPill() {
  const { isOnline } = useNetworkStatus();
  const pendingQueue = useStore((state) => state.pendingSyncQueue) || [];
  const pendingCount = pendingQueue.length;

  const [showSyncedSuccess, setShowSyncedSuccess] = useState(false);
  const prevPendingCountRef = useRef(pendingCount);
  const prevOnlineRef = useRef(isOnline);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If we were offline and now came online with 0 pending, OR
    // if pending items were just successfully flushed to 0:
    const justReconnected = !prevOnlineRef.current && isOnline;
    const justFlushedQueue = prevPendingCountRef.current > 0 && pendingCount === 0 && isOnline;

    if (justReconnected || justFlushedQueue) {
      setShowSyncedSuccess(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowSyncedSuccess(false);
      }, 2500);
    }

    prevOnlineRef.current = isOnline;
    prevPendingCountRef.current = pendingCount;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOnline, pendingCount]);

  if (!isOnline) {
    return (
      <div className="w-full flex justify-center mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-bold shadow-sm backdrop-blur-md">
          <WifiOff size={14} className="shrink-0 animate-pulse" />
          <span>⚡ Offline — Changes saved on device</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500/25 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount} queued
            </span>
          )}
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="w-full flex justify-center mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-xs font-bold shadow-sm backdrop-blur-md">
          <RefreshCw size={13} className="shrink-0 animate-spin" />
          <span>Syncing offline changes ({pendingCount})...</span>
        </div>
      </div>
    );
  }

  if (showSyncedSuccess) {
    return (
      <div className="w-full flex justify-center mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm backdrop-blur-md">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>All data synced</span>
        </div>
      </div>
    );
  }

  return null;
}
