import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useStore } from './useStore';

interface AuthState {
  user: User | null;
  profile: {
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (updates: { displayName?: string }) => void;
  clearError: () => void;
}

/**
 * Fetch the user's profile from Supabase and set it in the auth store.
 * Falls back to user metadata if no profile row exists yet.
 */
async function fetchAndSetProfile(user: User) {
  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const displayName = profileRow?.display_name
      || user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'User';

    useAuthStore.setState({
      profile: {
        displayName,
        email: profileRow?.email || user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });
  } catch (err) {
    console.warn('[PaceWise] Failed to fetch profile:', err);
    // Fallback: use user metadata
    useAuthStore.setState({
      profile: {
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: displayName ? {
          data: {
            full_name: displayName,
            name: displayName,
          }
        } : undefined,
      });

      if (error) throw error;

      if (data.user) {
        set({ user: data.user });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set({ user: data.user });
        // Profile will be fetched by useSupabaseSync
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Sign In failed';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset password failed';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear authenticated user data completely
      set({ user: null, profile: null });
      useStore.getState().resetData();
      
      // Clear the localStorage cache so the next user doesn't see stale data
      try {
        localStorage.removeItem('pacewise-storage-v2');
      } catch {
        // localStorage may be unavailable
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  checkAuthStatus: async () => {
    set({ loading: true });
    try {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        set({ user: data.session.user });
        // Eagerly fetch profile so the name is available before the full sync
        await fetchAndSetProfile(data.session.user);
      } else {
        set({ user: null, profile: null });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check auth status';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),

  clearError: () => set({ error: null }),
}));

// Automatically listen for auth state changes (email confirmation redirect, token refresh, OAuth)
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    useAuthStore.setState({ user: session.user, loading: false });
    // Fetch profile on auth state change (e.g., OAuth redirect, email confirmation)
    await fetchAndSetProfile(session.user);
  } else {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  }
});
