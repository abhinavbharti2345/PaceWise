import { useEffect, useRef, useState } from 'react';
import { Download, Sparkles, X, AlertCircle, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Button } from '../ui/Button';
import { AppUpdater } from '../../lib/appUpdater';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadUrl: string;
  isMandatory?: boolean;
}

export function UpdateModal({
  isOpen,
  onClose,
  currentVersion,
  latestVersion,
  releaseNotes,
  downloadUrl,
  isMandatory = false,
}: UpdateModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setProgressPercent(0);
      setDownloadError(null);
      setNeedsPermission(false);
      return;
    }

    const timer = setTimeout(() => {
      downloadButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMandatory && !isDownloading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMandatory, isDownloading, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloadError(null);

    if (!isAndroid) {
      // Fallback for web
      window.open(downloadUrl, '_blank');
      return;
    }

    try {
      // Check install permission first
      const { canInstall } = await AppUpdater.canInstall();
      if (!canInstall) {
        setNeedsPermission(true);
        return;
      }

      setIsDownloading(true);
      setProgressPercent(0);

      // Listen for download progress
      const progressSub = await AppUpdater.addListener('downloadProgress', (progress) => {
        if (progress.percent >= 0) {
          setProgressPercent(progress.percent);
        }
      });

      try {
        await AppUpdater.downloadAndInstall({ url: downloadUrl });
      } finally {
        progressSub.remove();
        setIsDownloading(false);
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      setIsDownloading(false);
      setDownloadError(err?.message || 'Failed to download update. Please try again.');
    }
  };

  const handleGrantPermission = async () => {
    try {
      await AppUpdater.requestInstallPermission();
      setNeedsPermission(false);
    } catch (err: any) {
      setDownloadError(err?.message || 'Could not open permission settings.');
    }
  };

  const handleBrowserFallback = () => {
    window.open(downloadUrl, '_system');
  };

  // Clean release notes by stripping the [mandatory] tag if present
  const displayNotes = releaseNotes
    ? releaseNotes.replace(/\[mandatory\]/gi, '').trim()
    : 'New bug fixes and performance improvements.';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onClick={!isMandatory && !isDownloading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-surface)] w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-gray-light)] p-5 sm:p-6 space-y-4 my-auto shrink-0 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#FF453A]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF453A] to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-[#FF453A]/25 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 id="update-dialog-title" className="text-lg sm:text-xl font-black text-[var(--color-dark)] leading-snug">
                Update Available
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/25">
                  v{currentVersion} → v{latestVersion}
                </span>
                {isMandatory && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25">
                    <AlertCircle size={12} /> Required
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isMandatory && !isDownloading && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)] shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Needs Install Permission Banner */}
        {needsPermission && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-bold">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <span>Permission required to install update</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Android requires permission to install updates directly. Please tap below and toggle <strong>&quot;Allow from this source&quot;</strong>, then return to update.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleGrantPermission}
              className="w-full py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
            >
              Enable Permission in Settings
            </Button>
          </div>
        )}

        {/* Download Error Banner */}
        {downloadError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
              <AlertCircle size={15} />
              <span>{downloadError}</span>
            </div>
            <button
              type="button"
              onClick={handleBrowserFallback}
              className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              <span>Download via browser instead</span>
              <ExternalLink size={12} />
            </button>
          </div>
        )}

        {/* What's New Section */}
        {!isDownloading && (
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-gray-dark)]">
              What&apos;s New in v{latestVersion}
            </p>
            <div className="bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-[var(--color-dark)] max-h-48 overflow-y-auto space-y-1.5 whitespace-pre-line leading-relaxed font-medium">
              {displayNotes}
            </div>
          </div>
        )}

        {/* In-App Download Progress */}
        {isDownloading && (
          <div className="space-y-3 py-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-dark)]">
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
                <span>Downloading update...</span>
              </span>
              <span>{progressPercent > 0 ? `${progressPercent}%` : 'Starting...'}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-amber-500 transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--color-gray-dark)] text-center">
              Please keep the app open. Android installer will prompt automatically once finished.
            </p>
          </div>
        )}

        {/* Helper Note */}
        {!isDownloading && !needsPermission && (
          <p className="text-[11px] text-[var(--color-gray-dark)] leading-relaxed">
            Tapping &ldquo;Download &amp; Update&rdquo; will download the update seamlessly in the app and open Android&apos;s installer. Your existing data will not be affected.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          {!isMandatory && !isDownloading && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-4 font-bold border-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] rounded-xl justify-center order-2 sm:order-1"
            >
              Remind Me Later
            </Button>
          )}

          {!needsPermission ? (
            <Button
              ref={downloadButtonRef}
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-11 px-6 font-extrabold text-white bg-[var(--color-primary)] hover:opacity-95 shadow-md shadow-[var(--color-primary)]/20 rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download &amp; Update</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setNeedsPermission(false)}
              className="h-11 px-6 font-extrabold text-white bg-[var(--color-primary)] rounded-xl order-1 sm:order-2"
            >
              <span>I&apos;ve Enabled It, Try Again</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
