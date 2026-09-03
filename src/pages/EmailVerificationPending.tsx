import { useState, useEffect } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';

export function EmailVerificationPending() {
  const { user, resendVerificationEmail, signOut, checkAuthStatus, loading, error, clearError } = useAuthStore();
  
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !user?.email) return;
    clearError();
    setResendSuccess(false);
    try {
      await resendVerificationEmail(user.email);
      setResendSuccess(true);
      setCooldown(60);
    } catch {
      // Error handled by store
    }
  };

  const handleOpenMailApp = () => {
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)] p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-3xl p-6 sm:p-8 shadow-xl border border-[var(--color-gray-light)] text-center space-y-6">
        
        {/* Animated Envelope Header */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/20 rounded-3xl animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <Mail size={36} className="animate-bounce" />
          </div>
        </div>

        {/* Title & Email */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Check your email to get started 📩
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-gray-dark)] leading-relaxed">
            We've sent a verification link to{' '}
            <span className="font-bold text-[var(--color-dark)] break-all">{user?.email}</span>.
          </p>
        </div>

        {/* Spam Alert Callout Box */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>Didn't see the email? Check your Spam folder!</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400/90 pl-1 leading-normal">
            <li>Check your <strong>Spam / Junk</strong> folder (confirmation emails can land there).</li>
            <li>Wait 1–2 minutes for the email to arrive.</li>
            <li>Click the link in the email to activate your account.</li>
          </ul>
        </div>

        {/* Feedback messages */}
        {resendSuccess && (
          <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
            <CheckCircle size={16} className="shrink-0 text-emerald-600" />
            <span>New verification email sent! Please check your inbox & spam.</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold flex items-center justify-center gap-2 shadow-md"
            onClick={handleOpenMailApp}
          >
            <span>Open Email Inbox</span>
            <ExternalLink size={16} />
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
              className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              disabled={loading}
              onClick={() => checkAuthStatus()}
              className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span>I've Confirmed</span>
            </Button>
          </div>
        </div>

        {/* Sign Out Option */}
        <div className="pt-4 border-t border-[var(--color-gray-light)]">
          <button
            onClick={() => signOut()}
            className="text-xs font-semibold text-[var(--color-gray-dark)] hover:text-red-600 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out / Use another account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
