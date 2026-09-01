import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Settings as SettingsIcon, 
  Monitor, 
  Moon, 
  Sun, 
  Globe,
  Sparkles,
  LogOut,
  Mail,
  User,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';

export function Settings() {
  const { config, updateConfig } = useStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl pb-20 sm:pb-0">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings & Preferences</h1>
          <p className="text-[var(--color-gray-dark)] text-sm">Manage account, currency, and appearance settings.</p>
        </div>
      </header>

      {/* User Profile Card */}
      <Card 
        onClick={() => navigate('/profile')}
        className="border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/40 transition-all cursor-pointer group p-4 sm:p-5 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--color-dark)] group-hover:text-[var(--color-primary)] transition-colors truncate">
              User Profile
            </h3>
            <p className="text-xs text-[var(--color-gray-dark)] truncate">
              View and update your profile details, display name, and avatar.
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[var(--color-gray-dark)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
      </Card>

      {/* Account Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[var(--color-primary)]" />
            <CardTitle>Account</CardTitle>
          </div>
        </CardHeader>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-gray-dark)] uppercase font-bold tracking-wider">
                Email
              </p>
              <p className="text-sm font-semibold text-[var(--color-dark)] mt-1">{user?.email}</p>
            </div>
          </div>

          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-bold text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
          </Button>
        </div>
      </Card>

      {/* Currency Preference Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[var(--color-primary)]" />
            <CardTitle>Currency Preference</CardTitle>
          </div>
        </CardHeader>

        <div className="p-6">
          <p className="text-xs text-[var(--color-gray-dark)] mb-3">
            Choose your preferred currency symbol to display throughout PaceWise.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Currency Symbol
            </label>
            <select
              value={config.currency || '₹'}
              onChange={(e) => updateConfig({ currency: e.target.value })}
              className="w-full sm:w-64 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="₹">₹ (INR - Indian Rupee)</option>
              <option value="$">$ (USD - Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - Pound)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appearance Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <CardTitle>Appearance & Theme</CardTitle>
          </div>
        </CardHeader>

        <div className="mt-4">
          <p className="text-xs text-[var(--color-gray-dark)] mb-3">
            Choose how PaceWise looks. Select dark mode for night usage or system to match your device.
          </p>
          <div className="grid grid-cols-3 gap-3 bg-[var(--color-surface-light)] p-1.5 rounded-2xl">
            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'light' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'light' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Sun size={18} />
              <span>Light Mode</span>
            </button>

            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'dark' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'dark' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Moon size={18} />
              <span>Dark Mode</span>
            </button>

            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'system' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'system' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Monitor size={18} />
              <span>System Match</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

