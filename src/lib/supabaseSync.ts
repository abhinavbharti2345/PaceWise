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
      // User signed out — reset the module guard
      activeFetchUserId = null;
      return;
    }

    // Prevent duplicate fetches for the same user
    if (activeFetchUserId === user.id) return;
    activeFetchUserId = user.id;

    let isMounted = true;

    const fetchData = async () => {
      try {
        // ── 1. Ensure profile row exists ──────────────────────────────
        // Use INSERT ... ON CONFLICT DO NOTHING so we never overwrite
        // a user's manually-edited display_name.
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .eq('id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            // First login — create the profile row
            const displayName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] ||
              'User';

            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email || '',
              display_name: displayName,
            });

            // Update auth store with the new name
            useAuthStore.setState({
              profile: {
                displayName,
                email: user.email || null,
                avatarUrl: user.user_metadata?.avatar_url || null,
              },
            });
          } else {
            // Profile already exists — read it (don't overwrite display_name)
            useAuthStore.setState({
              profile: {
                displayName: existingProfile.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: existingProfile.email || user.email || null,
                avatarUrl: user.user_metadata?.avatar_url || null,
              },
            });
          }
        } catch (profileErr) {
          console.warn('[PaceWise] Profile upsert note:', profileErr);
        }

        if (!isMounted) return;

        // ── 2. Fetch budget config ───────────────────────────────────
        const { data: configData, error: configError } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (configError && configError.code !== 'PGRST116') {
          console.error('[PaceWise] Failed to fetch budget config:', configError);
        }

        if (!isMounted) return;

        if (configData) {
          // Cloud config exists — use it as the source of truth
          const normalizedConfig: BudgetConfig = {
            totalMoney: Number(configData.total_money) || 0,
            startDate: configData.start_date,
            endDate: configData.end_date,
            currency: configData.currency || '₹',
            theme: configData.theme || 'system',
          };
          useStore.getState().setConfig(normalizedConfig);
        } else {
          // First-time user: create a budget config row in Supabase
          // with clean defaults (not stale localStorage)
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
          
          await supabase.from('budget_configs').insert({
            user_id: user.id,
            total_money: freshConfig.totalMoney,
            start_date: freshConfig.startDate,
            end_date: freshConfig.endDate,
            currency: freshConfig.currency,
            theme: freshConfig.theme,
          });
          
          useStore.getState().setConfig(freshConfig);
        }

        if (!isMounted) return;

        // ── 3. Fetch people ──────────────────────────────────────────
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (peopleError) {
          console.error('[PaceWise] Failed to fetch people:', peopleError);
        }
        
        if (!isMounted) return;

        // Always replace — Supabase is the source of truth
        useStore.setState({
          people: (peopleData || []).map((p) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatar_url,
            balance: Number(p.balance) || 0,
          })),
        });

        // ── 4. Fetch transactions ────────────────────────────────────
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (txError) {
          console.error('[PaceWise] Failed to fetch transactions:', txError);
        }
        
        if (!isMounted) return;

        // Always replace — Supabase is the source of truth
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
        if (isMounted) {
          useStore.getState().setHydrated(true);
        }
      } catch (err) {
        console.error('[PaceWise] Failed to fetch data from Supabase:', err);
        // Still allow the app to render with whatever local data exists
        if (isMounted) {
          useStore.getState().setHydrated(true);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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
