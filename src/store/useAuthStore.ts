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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (updates: { displayName?: string }) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({ user: null, profile: null });
      useStore.getState().resetData();
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
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState((state) => ({
    user: session?.user ?? null,
    profile: session ? state.profile : null,
    loading: false,
  }));
});
