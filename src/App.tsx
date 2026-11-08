import { useEffect, Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { useSupabaseSync } from './lib/supabaseSync';
import { useMonthRollover } from './hooks/useMonthRollover';
import { SplashScreen } from './components/ui/SplashScreen';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Lazy-loaded routes to minimize initial JS payload
const Transactions = lazy(() => import('./pages/Transactions').then(m => ({ default: m.Transactions })));
const People = lazy(() => import('./pages/People').then(m => ({ default: m.People })));
const PersonDetails = lazy(() => import('./pages/PersonDetails').then(m => ({ default: m.PersonDetails })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const AuthPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.AuthPage })));
const EmailVerificationPending = lazy(() => import('./pages/EmailVerificationPending').then(m => ({ default: m.EmailVerificationPending })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Guide = lazy(() => import('./pages/Guide').then(m => ({ default: m.Guide })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories })));
const Groups = lazy(() => import('./pages/Groups').then(m => ({ default: m.Groups })));
const GroupDetails = lazy(() => import('./pages/GroupDetails').then(m => ({ default: m.GroupDetails })));

// ── Error Boundary ───────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PaceWise] Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)] p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-dark)]">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-gray-dark)]">
              PaceWise encountered an unexpected error. Your data is safe in the cloud.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App Content ──────────────────────────────────────────────────────
function AppContent() {
  // Use atomic selectors to prevent unnecessary re-renders on every store mutation
  const theme = useStore((state) => state.config.theme);
  const isHydrated = useStore((state) => state.isHydrated);
  const transactions = useStore((state) => state.transactions);
  const config = useStore((state) => state.config);
  const { isOnline } = useNetworkStatus();
  const { user, loading: authLoading, checkAuthStatus } = useAuthStore();

  // Initialize Supabase sync (hook handles auth state internally)
  useSupabaseSync();
  
  // Enable automatic month rollover check
  useMonthRollover();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Show loading while auth status is being determined
  if (authLoading) {
    return <SplashScreen />;
  }

  // Not authenticated → show auth page
  if (!user) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <AuthPage />
      </Suspense>
    );
  }

  // Check email confirmation (skip for OAuth providers like Google)
  const isEmailConfirmed = !!user.email_confirmed_at || user.app_metadata?.provider !== 'email';

  if (!isEmailConfirmed) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <EmailVerificationPending />
      </Suspense>
    );
  }

  // Check if we already have local data from previous sessions or if offline
  const hasLocalData =
    transactions.length > 0 ||
    config.totalMoney > 0 ||
    Boolean(typeof window !== 'undefined' && localStorage.getItem('pacewise-storage-v2'));

  // Only block on splash screen if there is NO local data AND we are online waiting for initial sync
  if (!isHydrated && !hasLocalData && isOnline) {
    return <SplashScreen message="Syncing your budget..." />;
  }

  return (
    <Suspense fallback={<SplashScreen message="Loading..." />}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="people" element={<People />} />
          <Route path="people/:id" element={<PersonDetails />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:id" element={<GroupDetails />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Navigate to="/profile" replace />} />
          <Route path="categories" element={<Categories />} />
          <Route path="profile" element={<Profile />} />
          <Route path="guide" element={<Guide />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const RouterComponent = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
  return (
    <ErrorBoundary>
      <RouterComponent>
        <AppContent />
      </RouterComponent>
    </ErrorBoundary>
  );
}

export default App;
