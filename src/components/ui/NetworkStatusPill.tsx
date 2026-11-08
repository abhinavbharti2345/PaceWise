import { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useStore } from '../../store/useStore';
import { flushPendingSyncQueue } from '../../lib/supabaseSync';

export function NetworkStatusPill() {
  const { isOnline } = useNetworkStatus();
  const pendingQueue = useStore((state) => state.pendingSyncQueue) || [];
  const pendingCount = pendingQueue.length;

  const [isOpen, setIsOpen] = useState(false);
  const [showSyncedSuccess, setShowSyncedSuccess] = useState(false);
  const prevPendingCountRef = useRef(pendingCount);
  const prevOnlineRef = useRef(isOnline);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const justReconnected = !prevOnlineRef.current && isOnline;
    const justFlushedQueue = prevPendingCountRef.current > 0 && pendingCount === 0 && isOnline;

    if (justReconnected || justFlushedQueue) {
      setShowSyncedSuccess(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowSyncedSuccess(false);
        setIsOpen(false);
      }, 2500);
    }

    prevOnlineRef.current = isOnline;
    prevPendingCountRef.current = pendingCount;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOnline, pendingCount]);

  // Close popover on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // If online, 0 pending, and no success pulse, render nothing (completely clean top corner)
  if (isOnline && pendingCount === 0 && !showSyncedSuccess) {
    return null;
  }

  const handleManualSync = async () => {
    if (isOnline) {
      await flushPendingSyncQueue();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="fixed top-3 right-4 z-40 sm:top-4 sm:right-6 select-none"
    >
      {/* Small corner icon button */}
      {!isOnline ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-500 flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          title="Offline — changes saved locally. Tap for details."
        >
          <WifiOff size={15} className="animate-pulse" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>
      ) : pendingCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-8 h-8 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          title={`Syncing ${pendingCount} offline change(s)... Tap for details.`}
        >
          <RefreshCw size={14} className="animate-spin" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
            {pendingCount}
          </span>
        </button>
      ) : showSyncedSuccess ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer animate-in fade-in duration-200"
          title="All changes synced"
        >
          <CheckCircle2 size={16} />
        </button>
      ) : null}

      {/* Popover Card showing full text when clicked */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-72 sm:w-80 p-4 rounded-2xl bg-[#141416]/95 border border-[#27272a] shadow-2xl backdrop-blur-xl z-50 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <WifiOff size={15} />
                </div>
              ) : pendingCount > 0 ? (
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <RefreshCw size={15} className="animate-spin" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-white">
                  {!isOnline
                    ? 'Offline Mode'
                    : pendingCount > 0
                    ? 'Syncing with Cloud'
                    : 'Cloud Synchronized'}
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {!isOnline
                    ? 'Working locally on device'
                    : pendingCount > 0
                    ? `${pendingCount} item(s) uploading`
                    : 'All changes saved to cloud'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="py-2.5 text-[11px] text-zinc-300 space-y-1.5 leading-relaxed">
            {!isOnline ? (
              <>
                <p>
                  You are currently offline. All your transactions, edits, and receipts are safely saved in local device storage.
                </p>
                {pendingCount > 0 && (
                  <p className="text-amber-400 font-medium">
                    ⚡ {pendingCount} change(s) will automatically upload once an internet connection is re-established.
                  </p>
                )}
              </>
            ) : pendingCount > 0 ? (
              <>
                <p>
                  Connecting to cloud storage to synchronize {pendingCount} pending change(s).
                </p>
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="mt-2 w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw size={13} className="animate-spin" />
                  Retry Sync Now
                </button>
              </>
            ) : (
              <p className="text-emerald-400 font-medium">
                ✓ Your budget and transactions are fully synchronized with your PaceWise cloud account.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
