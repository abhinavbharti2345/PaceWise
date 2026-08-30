import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import type { BudgetConfig, Transaction } from '../features/budget/budgetEngine';
import type { Person } from '../store/useStore';

/**
 * Hook to synchronize Zustand store with Supabase
 * Handles:
 * - Fetching data from Supabase on auth
 * - Syncing local changes to Supabase
 * - Migrating localStorage data to Supabase
 */
export function useSupabaseSync() {
  const user = useAuthStore((state: any) => state.user);
  const { config, setConfig, addPerson } = useStore();

  // Fetch data from Supabase when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch budget config
        const { data: configData, error: configError } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (configError && configError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine for first login
          throw configError;
        }

        if (configData) {
          const normalizedConfig: BudgetConfig = {
            totalMoney: configData.total_money,
            startDate: configData.start_date,
            endDate: configData.end_date,
            currency: configData.currency || '₹',
            theme: configData.theme || 'system',
          };
          setConfig(normalizedConfig);
        }

        // Fetch people
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', user.id);

        if (peopleError) throw peopleError;

        // Clear existing people and reload from Supabase
        if (peopleData && peopleData.length > 0) {
          useStore.setState({ people: [] });
          for (const p of peopleData) {
            addPerson({
              name: p.name,
              avatarUrl: p.avatar_url,
              balance: p.balance,
            });
          }
        }

        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (txError) throw txError;

        if (txData && txData.length > 0) {
          useStore.setState({
            transactions: txData.map((tx) => ({
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
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
      } catch (err) {
        console.error('Failed to fetch data from Supabase:', err);
        // Fall back to localStorage
      }
    };

    fetchData();
  }, [user, setConfig, addPerson]);

  // Sync budget config changes to Supabase
  useEffect(() => {
    if (!user) return;

    const syncConfig = async () => {
      try {
        const existing = await supabase
          .from('budget_configs')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing.data) {
          // Update existing
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
        } else if (!existing.error || existing.error.code === 'PGRST116') {
          // Insert new
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

  // Note: For transactions and people, we sync on add/delete via modals
  // This hook handles initial load and periodic sync
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
