import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader } from '../components/ui/Card';
import { AlertTriangle, Loader } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, signInWithGoogle, clearError } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        // After signup, user needs to verify email before logging in
        alert('Account created! Please check your email for a verification link.');
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
          <p className="text-[var(--color-gray-dark)]">Loading...</p>
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
              {isSignUp ? 'Create your account' : 'Welcome back'}
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

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />

          {isSignUp && (
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold h-11 text-base shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[var(--color-gray-light)]"></div>
            <span className="flex-shrink-0 px-4 text-xs font-semibold text-[var(--color-gray-dark)] uppercase tracking-wider">
              Or continue with
            </span>
            <div className="flex-grow border-t border-[var(--color-gray-light)]"></div>
          </div>

          <Button
            type="button"
            className="w-full h-11 font-bold flex items-center justify-center gap-3 border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm rounded-xl cursor-pointer"
            disabled={isLoading}
            onClick={async () => {
              clearError();
              try {
                await signInWithGoogle();
              } catch {
                // Error is handled in store
              }
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google
          </Button>

          <div className="text-center text-sm pt-2">
            <span className="text-[var(--color-gray-dark)] font-medium">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                clearError();
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-[var(--color-primary)] font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
