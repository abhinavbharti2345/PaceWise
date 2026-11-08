import { useEffect, useRef } from 'react';
import { Download, Sparkles, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

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

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      downloadButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMandatory) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMandatory, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    // Open in system browser / Android download manager
    window.open(downloadUrl, '_system');
  };

  // Clean release notes by stripping the [mandatory] tag if present
  const displayNotes = releaseNotes
    ? releaseNotes.replace(/\[mandatory\]/gi, '').trim()
    : 'New bug fixes and performance improvements.';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onClick={!isMandatory ? onClose : undefined}
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

          {!isMandatory && (
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

        {/* What's New Section */}
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-gray-dark)]">
            What&apos;s New in v{latestVersion}
          </p>
          <div className="bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-[var(--color-dark)] max-h-52 overflow-y-auto space-y-1.5 whitespace-pre-line leading-relaxed font-medium">
            {displayNotes}
          </div>
        </div>

        {/* Helper Note */}
        <p className="text-[11px] text-[var(--color-gray-dark)] leading-relaxed">
          Tapping &ldquo;Download &amp; Update&rdquo; will download the latest APK directly to your device. You can then tap the notification to update without losing any data.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          {!isMandatory && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-4 font-bold border-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] rounded-xl justify-center order-2 sm:order-1"
            >
              Remind Me Later
            </Button>
          )}
          <Button
            ref={downloadButtonRef}
            type="button"
            onClick={handleDownload}
            className="h-11 px-6 font-extrabold text-white bg-[var(--color-primary)] hover:opacity-95 shadow-md shadow-[var(--color-primary)]/20 rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <Download size={18} />
            Download &amp; Update
          </Button>
        </div>
      </div>
    </div>
  );
}
