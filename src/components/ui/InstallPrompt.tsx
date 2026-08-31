import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import { Button } from './Button';

const PROMPT_KEY = 'pacewise_install_prompt';
const COOLDOWN_DAYS = 7;

interface PromptState {
  status: 'dismissed' | 'installed';
  timestamp: number;
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if desktop
    if (window.innerWidth > 768) {
      return;
    }

    // 2. Check if already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    if (isStandalone) {
      localStorage.setItem(PROMPT_KEY, JSON.stringify({ status: 'installed', timestamp: Date.now() }));
      return;
    }

    // 3. Check dismissal cooldown
    const stored = localStorage.getItem(PROMPT_KEY);
    if (stored) {
      try {
        const parsed: PromptState = JSON.parse(stored);
        if (parsed.status === 'installed') return;
        if (parsed.status === 'dismissed') {
          const daysElapsed = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
          if (daysElapsed < COOLDOWN_DAYS) return;
        }
      } catch (e) {
        // invalid JSON
      }
    }

    // 4. Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 5. Setup beforeinstallprompt for Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show immediately if we captured the event (cooldown and delay permitting)
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Delay showing prompt (5 seconds) so we don't interrupt initial load
    const timer = setTimeout(() => {
      // For iOS, we just show it if not standalone and not cooled down
      // For Android, we technically only show if deferredPrompt is captured, 
      // but some browsers don't fire it reliably or early. 
      // Actually, we'll show it if it's iOS, or if deferredPrompt is available.
      setIsVisible(true);
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  // For Android, we should only be visible if we actually have the deferred prompt
  const shouldRender = isVisible && (isIOS || deferredPrompt);

  if (!shouldRender) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(PROMPT_KEY, JSON.stringify({
      status: 'dismissed',
      timestamp: Date.now()
    }));
  };

  const handleInstall = async () => {
    if (isIOS) {
      // iOS has no programmatic install, the user must follow the instructions visually
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(PROMPT_KEY, JSON.stringify({
          status: 'installed',
          timestamp: Date.now()
        }));
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 p-4 animate-in slide-in-from-bottom-6 fade-in duration-300 pointer-events-none">
      <div className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-2xl rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto max-w-sm mx-auto">
        
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            onClick={handleDismiss}
            className="p-1 -mr-1 -mt-1 text-[var(--color-gray-dark)] hover:bg-[var(--color-surface-light)] rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-[var(--color-surface-light)] rounded-xl p-3 text-xs text-[var(--color-gray-dark)] font-medium flex flex-col gap-2 mt-1">
            <p className="flex items-center gap-2">
              1. Tap the <Share size={14} className="text-blue-500" /> Share button below
            </p>
            <p className="flex items-center gap-2">
              2. Scroll and tap <PlusSquare size={14} className="text-[var(--color-dark)]" /> <strong>Add to Home Screen</strong>
            </p>
            <Button variant="outline" size="sm" onClick={handleDismiss} className="mt-1 w-full font-bold text-xs">
              Got it
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Button variant="primary" size="sm" onClick={handleInstall} className="flex-1 font-bold text-xs py-2 shadow-sm text-white" style={{background: 'var(--color-primary)'}}>
              Add to Home Screen
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss} className="flex-1 font-bold text-xs py-2">
              Not now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
