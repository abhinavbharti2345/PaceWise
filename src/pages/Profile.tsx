import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, LogOut, Check, Pencil, Shield } from 'lucide-react';

export function Profile() {
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Authentication provider
  const provider = user?.app_metadata?.provider || 'email';
  const isGoogle = provider === 'google';

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      updateProfile({ displayName });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayInitial = (profile?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Profile</h1>
        <p className="text-[var(--color-gray-dark)] text-sm mt-1">Manage your account and preferences.</p>
      </header>

      <Card className="border border-[var(--color-gray-light)] shadow-sm">
        <CardHeader className="border-b border-[var(--color-gray-light)] bg-[var(--color-surface-light)] rounded-t-2xl pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User size={20} className="text-[var(--color-primary)]" />
            Account Details
          </CardTitle>
        </CardHeader>
        <div className="p-6 space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-md shrink-0 overflow-hidden border-4 border-white dark:border-[var(--color-surface)]">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-[var(--color-gray-dark)] uppercase tracking-wider">Display Name</p>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter your name"
                    className="max-w-[250px]"
                    autoFocus
                  />
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={isSaving || !displayName.trim()}
                    className="gap-1 shadow-sm"
                  >
                    <Check size={16} /> Save
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setDisplayName(profile?.displayName || '');
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-[var(--color-dark)]">
                    {profile?.displayName || 'Set your name'}
                  </h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-[var(--color-gray-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-light)] rounded-full transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--color-gray-light)]">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={14} /> Email Address
              </p>
              <p className="font-medium text-[var(--color-dark)] bg-[var(--color-bg-light)] px-3 py-2 rounded-xl border border-[var(--color-gray-light)] inline-block">
                {user?.email}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} /> Authentication Provider
              </p>
              <div className="flex items-center gap-2 font-medium text-[var(--color-dark)] bg-[var(--color-bg-light)] px-3 py-2 rounded-xl border border-[var(--color-gray-light)] inline-flex w-fit">
                {isGoogle ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </>
                ) : (
                  <>Email & Password</>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </Card>
      
      <div className="pt-4 flex justify-end">
        <Button 
          variant="outline" 
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 font-bold gap-2 shadow-sm"
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              signOut();
            }
          }}
        >
          <LogOut size={18} /> Sign Out
        </Button>
      </div>
      
    </div>
  );
}
