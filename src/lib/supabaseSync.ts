import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import type { BudgetConfig, Transaction } from '../features/budget/budgetEngine';
import type { Person } from '../store/useStore';

/**
 * Module-level flag to prevent duplicate fetches across React strict-mode
 * double-mounts or component remounts. This is NEVER reset on remount.
 */
let activeFetchUserId: string | null = null;

/**
 * Hook to synchronize Zustand store with Supabase.
 *
 * Flow:
 *   1. Ensure the user's profile row exists (FK requirement).
 *   2. Fetch all cloud data (config, people, transactions).
 *   3. Replace the Zustand store with cloud data (Supabase = source of truth).
 *   4. Set `isHydrated = true` so the UI can render.
 *
 * After initial hydration, individual CRUD actions in useStore handle their own
 * Supabase writes (optimistic local + async remote).
 */
export function useSupabaseSync() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      activeFetchUserId = null;
      return;
    }

    // Prevent duplicate fetches for the same user
    if (activeFetchUserId === user.id) return;
    activeFetchUserId = user.id;

    const fetchData = async () => {
      console.log(`[PaceWise Sync] starting for user ${user.id}`);
      
      try {
        console.log('[PaceWise Sync] checking profile');
        // ── 1. Ensure profile row exists ──────────────────────────────
        const { data: existingProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileErr && profileErr.code !== 'PGRST116') {
          console.warn('[PaceWise Sync] WARNING profile fetch error:', profileErr);
        }

        if (!existingProfile) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.display_name ||
            user.email?.split('@')[0] ||
            'User';

          const { error: insertErr } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email || '',
            display_name: displayName,
          });
          
          if (insertErr) console.warn('[PaceWise Sync] WARNING profile insert error:', insertErr);

          useAuthStore.setState({
            profile: {
              displayName,
              email: user.email || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
            },
          });
        } else {
          useAuthStore.setState({
            profile: {
              displayName: existingProfile.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: existingProfile.email || user.email || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
            },
          });
        }

        // Abort if the user logged out during the fetch
        if (useAuthStore.getState().user?.id !== user.id) {
          console.log('[PaceWise Sync] User changed. Aborting sync.');
          return;
        }

        console.log('[PaceWise Sync] fetching budget');
        // ── 2. Fetch budget config ───────────────────────────────────
        const { data: configData, error: configError } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (configError && configError.code !== 'PGRST116') {
          console.error('[PaceWise Sync] ERROR fetching budget config:', configError);
        }

        if (useAuthStore.getState().user?.id !== user.id) return;

        if (configData) {
          const normalizedConfig: BudgetConfig = {
            totalMoney: Number(configData.total_money) || 0,
            startDate: configData.start_date,
            endDate: configData.end_date,
            currency: configData.currency || '₹',
            theme: configData.theme || 'system',
          };
          useStore.getState().setConfig(normalizedConfig);
        } else {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
          
          const freshConfig: BudgetConfig = {
            totalMoney: 0,
            startDate: monthStart,
            endDate: monthEnd,
            currency: '₹',
            theme: 'system',
          };
          
          const { error: configInsertErr } = await supabase.from('budget_configs').insert({
            user_id: user.id,
            total_money: freshConfig.totalMoney,
            start_date: freshConfig.startDate,
            end_date: freshConfig.endDate,
            currency: freshConfig.currency,
            theme: freshConfig.theme,
          });
          
          if (configInsertErr) {
             console.error('[PaceWise Sync] ERROR inserting default budget config:', configInsertErr);
          }
          
          useStore.getState().setConfig(freshConfig);
        }

        if (useAuthStore.getState().user?.id !== user.id) return;

        console.log('[PaceWise Sync] fetching people');
        // ── 3. Fetch people ──────────────────────────────────────────
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (peopleError) {
          console.error('[PaceWise Sync] ERROR fetching people:', peopleError);
        }
        
        if (useAuthStore.getState().user?.id !== user.id) return;

        useStore.setState({
          people: (peopleData || []).map((p) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatar_url,
            balance: Number(p.balance) || 0,
          })),
        });

        console.log('[PaceWise Sync] fetching transactions');
        // ── 4. Fetch transactions ────────────────────────────────────
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (txError) {
          console.error('[PaceWise Sync] ERROR fetching transactions:', txError);
        }
        
        if (useAuthStore.getState().user?.id !== user.id) return;

        useStore.setState({
          transactions: (txData || []).map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount: Number(tx.amount),
            date: tx.date,
            category: tx.category,
            reason: tx.reason,
            source: tx.source,
            personId: tx.person_id,
            personName: tx.person_name,
            direction: tx.direction,
            isSettlement: tx.is_settlement,
            paymentMethod: tx.payment_method,
            note: tx.note,
          })),
        });

        // ── 5. Mark hydration complete ───────────────────────────────
        console.log('[PaceWise Sync] hydration complete');
        useStore.getState().setHydrated(true);

      } catch (err) {
        console.error('[PaceWise Sync] UNEXPECTED FATAL ERROR:', err);
        // Safety fallback: allow user into the app
        useStore.getState().setHydrated(true);
      }
    };

    fetchData();
  }, [user]);
}

/**
 * Add transaction to both local store and Supabase
 */
export async function addTransactionToSupabase(
  user_id: string,
  transaction: Omit<Transaction, 'id'>
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      reason: transaction.reason,
      source: transaction.source,
      person_id: transaction.personId,
      person_name: transaction.personName,
      direction: transaction.direction,
      is_settlement: transaction.isSettlement,
      payment_method: transaction.paymentMethod,
      note: transaction.note,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Delete transaction from Supabase
 */
export async function deleteTransactionFromSupabase(transaction_id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transaction_id);

  if (error) throw error;
}

/**
 * Add person to both local store and Supabase
 */
export async function addPersonToSupabase(
  user_id: string,
  person: Omit<Person, 'id'>
) {
  const { data, error } = await supabase
    .from('people')
    .insert({
      user_id,
      name: person.name,
      avatar_url: person.avatarUrl,
      balance: person.balance,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Delete person from Supabase
 */
export async function deletePersonFromSupabase(person_id: string) {
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', person_id);

  if (error) throw error;
}

/**
 * Update person balance in Supabase
 */
export async function updatePersonBalanceInSupabase(person_id: string, balance: number) {
  const { error } = await supabase
    .from('people')
    .update({ balance, updated_at: new Date().toISOString() })
    .eq('id', person_id);

  if (error) throw error;
}

/**
 * Delete all application data for a user
 */
export async function deleteAllUserData(user_id: string) {
  // Delete all user data tables
  const tables = ['transactions', 'people', 'budget_configs', 'profiles'];
  
  for (const table of tables) {
    // For profiles the column is 'id', for others it's 'user_id'
    const column = table === 'profiles' ? 'id' : 'user_id';
    const { error } = await supabase.from(table).delete().eq(column, user_id);
    if (error) {
      console.error(`[PaceWise] Error deleting ${table} for user ${user_id}:`, error);
      throw error;
    }
  }
}

/**
 * Permanently delete user auth account via Edge Function
 */
export async function deleteUserAccount(sessionToken: string) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (error) {
    console.error('[PaceWise] Error invoking delete-user Edge Function:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to delete user account');
  }

  return data;
}
