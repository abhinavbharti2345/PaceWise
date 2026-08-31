import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader } from '../components/ui/Card';
import { AlertTriangle, Loader, CheckCircle2 } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, resetPassword, clearError } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation and success states
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordError('');
    setSuccessMessage('');

    if (!email) return;

    if (isResetPassword) {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setSuccessMessage('Password reset link sent! Please check your email.');
      } catch {
        // Error handled in store
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) return;

    if (isSignUp) {
      if (!displayName.trim()) {
        setPasswordError('Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName.trim());
        setSuccessMessage('Account created! Please check your email for a verification link.');
        // Clear fields on success
        setDisplayName('');
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch {
      // Error is handled in store
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} color="var(--color-primary)" />
          <p className="text-[var(--color-gray-dark)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)] p-4 sm:p-8">
      <Card className="w-full max-w-md border border-[var(--color-gray-light)] shadow-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-extrabold text-[var(--color-dark)] tracking-tight">PaceWise</h1>
            <p className="text-[var(--color-gray-dark)] text-base font-medium">
              {isResetPassword ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2 flex flex-col gap-5">
          {error && (
            <div
              className="p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--danger-accent)' }} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
              style={{
                background: 'var(--positive-bg)',
                border: '1px solid var(--positive-border)',
                color: 'var(--positive-text)',
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--positive-accent)' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {isSignUp && (
            <Input
              label="Full Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Abhinav Bharti"
              required
              disabled={isLoading}
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
          />

          {!isResetPassword && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          )}

          {!isResetPassword && isSignUp && (
            <div className="space-y-1">
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className={passwordError ? "border-red-500 focus:ring-red-500" : ""}
              />
              {passwordError && (
                <p className="text-xs font-semibold text-[var(--color-primary)]">{passwordError}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold h-11 text-base shadow-sm"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Loading...' 
              : isResetPassword 
                ? 'Send Reset Link' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'
            }
          </Button>

          {!isResetPassword && !isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(true);
                  clearError();
                  setSuccessMessage('');
                }}
                className="text-xs font-semibold text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* 
            NOTE: Google OAuth is temporarily disabled pending correct redirect_uri configuration
            in Google Cloud Console. Once configured, restore the Google Sign In UI here. 
            The underlying signInWithGoogle() logic remains intact in useAuthStore.ts.
          */}


          <div className="text-center text-sm pt-2">
            <span className="text-[var(--color-gray-dark)] font-medium">
              {isResetPassword 
                ? 'Remember your password? ' 
                : isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "
              }
            </span>
            <button
              type="button"
              onClick={() => {
                if (isResetPassword) {
                  setIsResetPassword(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                clearError();
                setSuccessMessage('');
                setPasswordError('');
                setDisplayName('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-[var(--color-primary)] font-semibold hover:underline"
            >
              {isResetPassword ? 'Sign In' : isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
