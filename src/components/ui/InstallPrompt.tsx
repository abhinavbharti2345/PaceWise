import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import { Button } from './Button';

const PROMPT_KEY = 'pacewise_install_prompt';
const COOLDOWN_DAYS = 7;

interface PromptState {
  status: 'dismissed' | 'installed';
  timestamp: number;
}

function safeWriteStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (_e) {
    // localStorage unavailable (private browsing / storage full) — silently ignore
  }
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Desktop guard
    if (window.innerWidth > 768) return;

    // 2. Already-installed guard
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      safeWriteStorage(PROMPT_KEY, JSON.stringify({ status: 'installed', timestamp: Date.now() }));
      return;
    }

    // 3. Cooldown / installed-state guard
    const stored = localStorage.getItem(PROMPT_KEY);
    if (stored) {
      try {
        const parsed: PromptState = JSON.parse(stored);
        if (parsed.status === 'installed') return;
        if (parsed.status === 'dismissed') {
          const daysElapsed = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
          if (daysElapsed < COOLDOWN_DAYS) return;
        }
      } catch (_e) {
        // malformed JSON — proceed normally
      }
    }

    // 4. iOS detection
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 5. Android: capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Delay 5s before showing so we don't interrupt initial load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  // Only render if we have something to offer
  const shouldRender = isVisible && (isIOS || deferredPrompt);
  if (!shouldRender) return null;

  const persistDismissed = () => {
    safeWriteStorage(PROMPT_KEY, JSON.stringify({
      status: 'dismissed',
      timestamp: Date.now(),
    }));
  };

  const handleDismiss = () => {
    setIsVisible(false);
    persistDismissed();
  };

  const handleInstall = async () => {
    if (isIOS) return; // iOS uses visual instructions only

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        safeWriteStorage(PROMPT_KEY, JSON.stringify({
          status: 'installed',
          timestamp: Date.now(),
        }));
      } else {
        // User dismissed the native dialog — persist dismissal so card closes cleanly
        persistDismissed();
      }
      setIsVisible(false);
    }
  };

  return (
    <div
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 p-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:fade-in duration-300 pointer-events-none"
      role="region"
      aria-label="Install PaceWise"
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-2xl rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto max-w-sm mx-auto">

        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-dark)] text-sm">Add PaceWise to Home Screen</h3>
              <p className="text-xs text-[var(--color-gray-dark)] mt-0.5 leading-relaxed">
                Access your budget instantly from your phone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 -mr-1 -mt-1 text-[var(--color-gray-dark)] hover:bg-[var(--color-surface-light)] rounded-full transition-colors touch-manipulation"
            aria-label="Dismiss install suggestion"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-[var(--color-surface-light)] rounded-xl p-3 text-xs text-[var(--color-gray-dark)] font-medium flex flex-col gap-2 mt-1">
            <p className="flex items-center gap-2">
              1. Tap the <Share size={14} className="text-blue-500 shrink-0" aria-hidden="true" /> Share button below
            </p>
            <p className="flex items-center gap-2">
              2. Scroll and tap <PlusSquare size={14} className="text-[var(--color-dark)] shrink-0" aria-hidden="true" /> <strong>Add to Home Screen</strong>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="mt-1 w-full font-bold text-xs touch-manipulation"
            >
              Got it
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleInstall}
              className="flex-1 font-bold text-xs py-2 shadow-sm text-white touch-manipulation"
              style={{ background: 'var(--color-primary)' }}
            >
              Add to Home Screen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1 font-bold text-xs py-2 touch-manipulation"
            >
              Not now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
