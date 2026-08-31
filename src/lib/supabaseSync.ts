import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import type { BudgetConfig, Transaction } from '../features/budget/budgetEngine';
import type { Person } from '../store/useStore';

/**
 * Hook to synchronize Zustand store with Supabase
 * Handles:
 * - Ensuring user profile row exists
 * - Fetching cloud data from Supabase on auth
 * - Syncing budget configuration changes to Supabase
 */
export function useSupabaseSync() {
  const user = useAuthStore((state: any) => state.user);
  const { config, setConfig } = useStore();
  const isFetchedRef = useRef(false);

  // Fetch data from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      isFetchedRef.current = false;
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        // 1. Ensure user profile exists in public.profiles table (satisfies FK constraints)
        try {
          const profileData = {
            id: user.id,
            email: user.email || '',
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] ||
              'User',
            updated_at: new Date().toISOString(),
          };

          const { data: upsertedProfile } = await supabase.from('profiles').upsert(
            profileData,
            { onConflict: 'id' }
          ).select().single();

          if (upsertedProfile) {
            useAuthStore.setState({
              profile: {
                displayName: upsertedProfile.display_name,
                email: upsertedProfile.email,
                avatarUrl: user.user_metadata?.avatar_url || null,
              }
            });
          }
        } catch (profileErr) {
          console.warn('Profile upsert note:', profileErr);
        }

        if (!isMounted) return;

        // 2. Fetch budget config
        const { data: configData, error: configError } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (configError && configError.code !== 'PGRST116') {
          console.error('Failed to fetch budget config:', configError);
        }

        if (!isMounted) return;

        if (configData) {
          const normalizedConfig: BudgetConfig = {
            totalMoney: Number(configData.total_money) || 0,
            startDate: configData.start_date,
            endDate: configData.end_date,
            currency: configData.currency || '₹',
            theme: configData.theme || 'system',
          };
          setConfig(normalizedConfig);
        } else {
          // Initialize budget config in Supabase for first-time user
          const currentConfig = useStore.getState().config;
          await supabase.from('budget_configs').insert({
            user_id: user.id,
            total_money: currentConfig.totalMoney,
            start_date: currentConfig.startDate,
            end_date: currentConfig.endDate,
            currency: currentConfig.currency || '₹',
            theme: currentConfig.theme || 'system',
          });
        }

        if (!isMounted) return;

        // 3. Fetch people
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (peopleError) {
          console.error('Failed to fetch people:', peopleError);
        } else if (peopleData) {
          useStore.setState({
            people: peopleData.map((p) => ({
              id: p.id,
              name: p.name,
              avatarUrl: p.avatar_url,
              balance: Number(p.balance) || 0,
            })),
          });
        }

        if (!isMounted) return;

        // 4. Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (txError) {
          console.error('Failed to fetch transactions:', txError);
        } else if (txData) {
          useStore.setState({
            transactions: txData.map((tx) => ({
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
        }

        if (isMounted) {
          isFetchedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch data from Supabase:', err);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, setConfig]);

  // Sync budget config changes to Supabase ONLY after initial load
  useEffect(() => {
    if (!user || !isFetchedRef.current) return;

    const syncConfig = async () => {
      try {
        const { data: existing } = await supabase
          .from('budget_configs')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('budget_configs')
            .update({
              total_money: config.totalMoney,
              start_date: config.startDate,
              end_date: config.endDate,
              currency: config.currency,
              theme: config.theme,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          await supabase.from('budget_configs').insert({
            user_id: user.id,
            total_money: config.totalMoney,
            start_date: config.startDate,
            end_date: config.endDate,
            currency: config.currency || '₹',
            theme: config.theme || 'system',
          });
        }
      } catch (err) {
        console.error('Failed to sync budget config to Supabase:', err);
      }
    };

    syncConfig();
  }, [user, config]);
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
