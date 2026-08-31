import { useEffect } from 'react';
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
import { Loader } from 'lucide-react';

function AppContent() {
  const { config } = useStore();
  const { user, loading: authLoading, checkAuthStatus } = useAuthStore();

  // Initialize Supabase sync (hook handles auth state internally)
  useSupabaseSync();

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

  if (!user) {
    return <AuthPage />;
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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
