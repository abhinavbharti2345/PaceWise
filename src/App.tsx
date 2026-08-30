import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { People } from './pages/People';
import { PersonDetails } from './pages/PersonDetails';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';

function App() {
  const { config } = useStore();

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="people" element={<People />} />
          <Route path="people/:id" element={<PersonDetails />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
