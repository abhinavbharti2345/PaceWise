import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, LogOut, Check, Pencil, Shield, AlertTriangle } from 'lucide-react';

import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useStore } from '../store/useStore';
import { deleteAllUserData, deleteUserAccount } from '../lib/supabaseSync';

export function Profile() {
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isDeleteDataModalOpen, setIsDeleteDataModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const resetData = useStore(state => state.resetData);

  // Keep displayName in sync when profile loads asynchronously
  useEffect(() => {
    if (profile?.displayName && !isEditing) {
      setDisplayName(profile.displayName);
    }
  }, [profile?.displayName, isEditing]);

  // Authentication provider
  const provider = user?.app_metadata?.provider || 'email';
  const isGoogle = provider === 'google';

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);
    
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
      setSaveMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const displayInitial = (profile?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeleting(true);
    setSaveMessage(null);
    try {
      await deleteAllUserData(user.id);
      resetData();
      setIsDeleteDataModalOpen(false);
      setSaveMessage({ type: 'success', text: 'All your PaceWise data has been permanently deleted.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Failed to delete data:', error);
      setSaveMessage({ type: 'error', text: 'Failed to delete data. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // We need the user's session token to invoke the edge function securely
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      setSaveMessage({ type: 'error', text: 'Could not verify your session. Please sign out and sign in again before deleting your account.' });
      setIsDeleteAccountModalOpen(false);
      return;
    }

    setIsDeleting(true);
    setSaveMessage(null);
    
    try {
      // 1. First explicitly delete all their application data
      await deleteAllUserData(user.id);
      
      // 2. Invoke the edge function to delete the Supabase Auth user
      await deleteUserAccount(session.access_token);
      
      // 3. Clear local state
      resetData();
      
      // 4. Clear session and redirect to login
      await signOut();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setSaveMessage({ type: 'error', text: 'Failed to delete account. Please try again or contact support.' });
      setIsDeleting(false);
      setIsDeleteAccountModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl pb-20 sm:pb-0">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-sm">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">Profile</h1>
          <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">Manage your account and personal information.</p>
        </div>
      </header>

      {/* Save Message Toast */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl animate-in fade-in flex items-center gap-3 text-sm font-bold ${
            saveMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}
          style={saveMessage.type === 'success' ? {
            background: 'var(--positive-bg)',
            border: '1px solid var(--positive-border)',
            color: 'var(--positive-text)',
          } : undefined}
        >
          {saveMessage.type === 'success' ? (
            <Check size={18} style={{color: 'var(--positive-accent)'}} />
          ) : (
            <AlertTriangle size={18} className="text-red-500" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Account Card */}
      <Card className="border border-[var(--color-gray-light)] shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-[var(--color-primary)]" />
            <CardTitle className="text-lg">Account</CardTitle>
          </div>
        </CardHeader>
        
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          
          {/* Profile Header section */}
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-2xl sm:text-3xl shadow-md shrink-0 overflow-hidden border-2 sm:border-4 border-white dark:border-[var(--color-surface)]">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row items-start gap-2">
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter your name"
                    className="w-full max-w-[300px] font-bold text-base sm:text-lg"
                    autoFocus
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="success" 
                      onClick={handleSave} 
                      disabled={isSaving || !displayName.trim()}
                      className="gap-1 shadow-sm px-4 h-11 flex-1 sm:flex-none justify-center"
                    >
                      <Check size={16} /> Save
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setDisplayName(profile?.displayName || '');
                        setIsEditing(false);
                      }}
                      disabled={isSaving}
                      className="h-11 flex-1 sm:flex-none justify-center"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)] tracking-tight truncate">
                      {profile?.displayName || 'Set your name'}
                    </h2>
                    <p className="text-[var(--color-gray-dark)] text-sm sm:text-base mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 sm:p-2.5 shrink-0 text-[var(--color-gray-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-light)] rounded-full transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <hr className="border-[var(--color-gray-light)]" />
          
          {/* Information Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[var(--color-bg-light)] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--color-gray-light)] flex flex-col justify-center">
              <p className="text-[11px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail size={14} /> Email Address
              </p>
              <p className="font-semibold text-sm sm:text-base text-[var(--color-dark)] truncate">
                {user?.email}
              </p>
            </div>
            
            <div className="bg-[var(--color-bg-light)] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--color-gray-light)] flex flex-col justify-center">
              <p className="text-[11px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield size={14} /> Authentication
              </p>
              <div className="flex items-center gap-2 font-semibold text-sm sm:text-base text-[var(--color-dark)]">
                {isGoogle ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google OAuth
                  </>
                ) : (
                  <>Email & Password</>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </Card>
      
      {/* Account Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-[var(--color-dark)]" />
            <CardTitle className="text-base sm:text-lg">Session</CardTitle>
          </div>
        </CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <p className="font-semibold text-base text-[var(--color-dark)]">Sign Out of PaceWise</p>
            <p className="text-xs sm:text-sm text-[var(--color-gray-dark)] mt-0.5">You will need to sign back in to access your data.</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto h-11 border-[var(--color-gray-light)] font-bold gap-2 shadow-sm whitespace-nowrap justify-center"
            onClick={() => setIsSignOutConfirmOpen(true)}
          >
            <LogOut size={18} /> Sign Out
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <CardTitle className="text-base sm:text-lg text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-base text-[var(--color-dark)]">Delete All My Data</p>
              <p className="text-xs sm:text-sm text-[var(--color-gray-dark)] mt-0.5">Permanently remove your budgets, transactions, people and other PaceWise data. Your account remains active.</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 font-bold shadow-sm whitespace-nowrap justify-center"
              onClick={() => setIsDeleteDataModalOpen(true)}
            >
              Delete All My Data
            </Button>
          </div>

          <hr className="border-red-100 dark:border-red-900/30" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-base text-[var(--color-dark)]">Delete My Account</p>
              <p className="text-xs sm:text-sm text-[var(--color-gray-dark)] mt-0.5">Permanently delete your PaceWise account and all associated data.</p>
            </div>
            <Button 
              className="w-full sm:w-auto h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm whitespace-nowrap justify-center"
              onClick={() => setIsDeleteAccountModalOpen(true)}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Sign Out Modal */}
      <ConfirmModal
        isOpen={isSignOutConfirmOpen}
        onClose={() => setIsSignOutConfirmOpen(false)}
        onConfirm={signOut}
        title="Sign Out of PaceWise?"
        description="Are you sure you want to sign out? You will need to sign back in to access your budget and transactions."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
        icon={<LogOut size={20} />}
      />

      {/* Delete All Data Modal */}
      <ConfirmModal
        isOpen={isDeleteDataModalOpen}
        onClose={() => setIsDeleteDataModalOpen(false)}
        onConfirm={handleDeleteAllData}
        title="Delete all your data?"
        description="This will permanently delete your budgets, transactions, people and all other PaceWise data. Your account will remain active."
        confirmText="Delete All Data"
        cancelText="Cancel"
        variant="destructive"
        requiredMatchText="DELETE"
        isLoading={isDeleting}
      />

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This permanently deletes your PaceWise account and all associated data. You will not be able to recover it."
        confirmText="Delete Account Permanently"
        cancelText="Cancel"
        variant="destructive"
        requiredMatchText="DELETE MY ACCOUNT"
        isLoading={isDeleting}
      />
    </div>
  );
}
