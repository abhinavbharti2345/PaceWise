import { useEffect, Component } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { People } from './pages/People';
import { PersonDetails } from './pages/PersonDetails';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { AuthPage } from './pages/Auth';
import { Profile } from './pages/Profile';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { useSupabaseSync } from './lib/supabaseSync';
import { useMonthRollover } from './hooks/useMonthRollover';
import { Loader } from 'lucide-react';

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
  const { config, isHydrated } = useStore();
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
      config.theme === 'dark' ||
      (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.theme]);

  // Show loading while auth status is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} color="var(--color-primary)" />
          <p className="text-[var(--color-gray-dark)] font-medium">Loading PaceWise...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show auth page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated but Supabase data hasn't loaded yet → show loading
  // This prevents stale localStorage data from flashing before cloud data arrives
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} color="var(--color-primary)" />
          <p className="text-[var(--color-gray-dark)] font-medium">Syncing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="people" element={<People />} />
        <Route path="people/:id" element={<PersonDetails />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
