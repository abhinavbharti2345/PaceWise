import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader } from '../components/ui/Card';
import { AlertTriangle, Loader } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, clearError } = useAuthStore();

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <Card className="w-full max-w-md border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--color-dark)]">PaceWise</h1>
            <p className="text-[var(--color-gray-dark)] text-sm mt-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
            className="w-full font-bold"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-[var(--color-gray-dark)]">
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
