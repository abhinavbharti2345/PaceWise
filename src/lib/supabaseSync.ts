import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useStore, calculatePersonBalance } from '../store/useStore';
import type { BudgetConfig, Transaction } from '../features/budget/budgetEngine';
import type { Person } from '../store/useStore';
import { getIsOnline, subscribeNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Module-level flag to prevent duplicate fetches across React strict-mode
 * double-mounts or component remounts.
 * Call resetSyncFlag() after data deletion so the next mount triggers a
 * clean re-sync against the now-empty Supabase tables.
 */
let activeFetchUserId: string | null = null;

/** Reset the sync flag. Must be called after successful "Delete All My Data". */
export function resetSyncFlag() {
  activeFetchUserId = null;
}

let isFlushingQueue = false;

/**
 * Iterates through pendingSyncQueue in chronological order and executes
 * corresponding Supabase actions. Dequeues successfully flushed items.
 */
export async function flushPendingSyncQueue(): Promise<{ flushedCount: number; errors: number }> {
  if (isFlushingQueue) return { flushedCount: 0, errors: 0 };
  if (!getIsOnline()) return { flushedCount: 0, errors: 0 };

  const user = useAuthStore.getState().user;
  if (!user?.id) return { flushedCount: 0, errors: 0 };

  const queue = useStore.getState().pendingSyncQueue || [];
  if (queue.length === 0) return { flushedCount: 0, errors: 0 };

  isFlushingQueue = true;
  console.log(`[PaceWise Sync Queue] Starting flush of ${queue.length} pending operations...`);

  let flushedCount = 0;
  let errorCount = 0;
  const flushedIds: string[] = [];

  try {
    for (const item of queue) {
      if (!getIsOnline()) break;

      try {
        // Strip out purely local fields like receipt_id before transmitting to Supabase
        if (item.payload && typeof item.payload === 'object') {
          delete (item.payload as Record<string, any>).receipt_id;
        }

        // If an update only contained local fields and is now empty, consider it handled
        if (item.action === 'update' && Object.keys(item.payload || {}).length === 0) {
          flushedIds.push(item.id);
          flushedCount++;
          continue;
        }

        if (item.action === 'insert') {
          if (item.table === 'budget_configs') {
            const { data: existing } = await supabase
              .from('budget_configs')
              .select('id')
              .eq('user_id', item.payload.user_id)
              .maybeSingle();

            if (existing) {
              const { error } = await supabase
                .from('budget_configs')
                .update(item.payload)
                .eq('user_id', item.payload.user_id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from('budget_configs').insert(item.payload);
              if (error) throw error;
            }
          } else {
            // Upsert for idempotency
            const { error } = await supabase.from(item.table).upsert(item.payload, { onConflict: 'id' });
            if (error) throw error;
          }
        } else if (item.action === 'update') {
          let q = supabase.from(item.table).update(item.payload);
          if (item.match) {
            for (const [k, v] of Object.entries(item.match)) {
              q = q.eq(k, v);
            }
          }
          const { error } = await q;
          if (error) throw error;
        } else if (item.action === 'delete') {
          let q = supabase.from(item.table).delete();
          if (item.match) {
            for (const [k, v] of Object.entries(item.match)) {
              q = q.eq(k, v);
            }
          }
          const { error } = await q;
          if (error) throw error;
        }

        flushedIds.push(item.id);
        flushedCount++;
      } catch (itemErr: unknown) {
        console.warn(`[PaceWise Sync Queue] Item ${item.id} flush failed:`, itemErr);
        errorCount++;
        // If error is a permanent schema mismatch or missing column, discard so queue doesn't stick
        const errStr = String(itemErr && typeof itemErr === 'object' && 'message' in itemErr ? (itemErr as any).message : itemErr);
        if (errStr.includes('column') || errStr.includes('PGRST204') || errStr.includes('schema') || errStr.includes('does not exist')) {
          flushedIds.push(item.id);
        }
        if (!getIsOnline()) break;
      }
    }
  } finally {
    if (flushedIds.length > 0) {
      useStore.getState().removeFromSyncQueue(flushedIds);
    }
    isFlushingQueue = false;
    console.log(`[PaceWise Sync Queue] Flush complete: ${flushedCount} succeeded, ${errorCount} failed.`);
  }

  return { flushedCount, errors: errorCount };
}

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

  // Setup automatic background flush whenever network status turns online
  useEffect(() => {
    // Clean up any stale receipt_id-only items from previous sessions
    const queue = useStore.getState().pendingSyncQueue || [];
    const staleReceiptIds = queue
      .filter((q) => q.table === 'transactions' && q.payload && Object.keys(q.payload).every((k) => k === 'receipt_id'))
      .map((q) => q.id);
    if (staleReceiptIds.length > 0) {
      useStore.getState().removeFromSyncQueue(staleReceiptIds);
    }

    const unsubscribe = subscribeNetworkStatus((status) => {
      if (status.isOnline) {
        console.log('[PaceWise Sync] Connection restored. Flushing pending queue...');
        flushPendingSyncQueue();
      }
    });
    return unsubscribe;
  }, []);

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

      // If offline, bypass network call immediately and let user work with local data
      if (!getIsOnline()) {
        console.log('[PaceWise Sync] Device is offline. Using local storage data.');
        useStore.getState().setHydrated(true);
        return;
      }

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

        console.log('[PaceWise Sync] fetching cloud data in parallel');
        // ── 2, 3, 4. Fetch budget config, people, and transactions concurrently ──────────
        const [
          { data: configData, error: configError },
          { data: peopleData, error: peopleError },
          { data: txData, error: txError }
        ] = await Promise.all([
          supabase
            .from('budget_configs')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('people')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('transactions')
            .select('id, type, amount, date, category, reason, source, person_id, person_name, direction, is_settlement, is_bought_for_me_settlement, payment_method, note, status')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
        ]);

        if (configError && configError.code !== 'PGRST116') {
          console.error('[PaceWise Sync] ERROR fetching budget config:', configError);
        }
        if (peopleError) {
          console.error('[PaceWise Sync] ERROR fetching people:', peopleError);
        }
        if (txError) {
          console.error('[PaceWise Sync] ERROR fetching transactions:', txError);
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

        const currentLocalTxs = useStore.getState().transactions || [];
        const localReceiptMap = new Map(currentLocalTxs.filter(t => t.receiptId).map(t => [t.id, t.receiptId]));

        const txs: Transaction[] = (txData || []).map((tx) => ({
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
          isBoughtForMeSettlement: tx.is_bought_for_me_settlement,
          paymentMethod: tx.payment_method,
          note: tx.note,
          status: tx.status,
          receiptId: localReceiptMap.get(tx.id) || (tx as any).receipt_id || undefined,
        }));

        const peopleList: Person[] = (peopleData || []).map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatar_url,
          balance: calculatePersonBalance(p.id, txs),
        }));

        // ── 5. Merge with any uncommitted local transactions ──────────
        const pendingQueue = useStore.getState().pendingSyncQueue || [];
        const pendingInsertIds = new Set(
          pendingQueue
            .filter((q) => q.table === 'transactions' && q.action === 'insert')
            .map((q) => q.id)
        );
        const uncommittedTxs = currentLocalTxs.filter((t) => pendingInsertIds.has(t.id));

        const combinedTxs = [
          ...uncommittedTxs,
          ...txs.filter((t) => !uncommittedTxs.some((local) => local.id === t.id)),
        ];

        useStore.setState({
          people: peopleList,
          transactions: combinedTxs,
        });

        // ── 6. Mark hydration complete & flush queued operations ──────
        console.log('[PaceWise Sync] hydration complete');
        useStore.getState().setHydrated(true);
        flushPendingSyncQueue();

      } catch (err) {
        console.error('[PaceWise Sync] UNEXPECTED FATAL ERROR:', err);
        // Reset activeFetchUserId so retry is possible without requiring relogin
        activeFetchUserId = null;
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
      status: transaction.status,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Delete transaction from Supabase.
 * Scoped to both transaction ID and authenticated user_id to prevent
 * accidental cross-user deletion if RLS has any gap.
 */
export async function deleteTransactionFromSupabase(transaction_id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const user_id = session?.user?.id;
  if (!user_id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transaction_id)
    .eq('user_id', user_id);

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
 * Delete person from Supabase.
 * Scoped to both person ID and authenticated user_id to prevent
 * accidental cross-user deletion if RLS has any gap.
 */
export async function deletePersonFromSupabase(person_id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const user_id = session?.user?.id;
  if (!user_id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', person_id)
    .eq('user_id', user_id);

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
 * Delete all application data for the currently authenticated user.
 * Security: user identity is derived from the live Supabase session JWT,
 * NOT from a user_id supplied by the caller. This prevents cross-user
 * deletion even if RLS has a gap.
 *
 * NOTE: If you add new user-owned tables, add them to the `tables` array below.
 */
export async function deleteAllUserData() {
  // Verify identity from the server-confirmed session, not caller-supplied data.
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !session?.user?.id) {
    throw new Error('Cannot delete data: no authenticated session found.');
  }
  const user_id = session.user.id;

  // Tables owned by user_id. Profiles uses 'id' as the FK column.
  // UPDATE THIS LIST if new user-owned tables are added.
  const tables: Array<{ table: string; column: string }> = [
    { table: 'transactions',  column: 'user_id' },
    { table: 'people',        column: 'user_id' },
    { table: 'budget_configs', column: 'user_id' },
    { table: 'profiles',      column: 'id' },
  ];

  for (const { table, column } of tables) {
    const { error } = await supabase.from(table).delete().eq(column, user_id);
    if (error) {
      console.error(`[PaceWise] Error deleting ${table}:`, error.message);
      throw new Error(`Failed to delete your ${table}. Please try again.`);
    }
  }
}

/**
 * Permanently delete the authenticated user's Supabase Auth account via Edge Function.
 * Identity is validated server-side from the JWT; the browser never controls which account
 * is deleted.
 */
export async function deleteUserAccount(sessionToken: string) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (error) {
    console.error('[PaceWise] Error invoking delete-user Edge Function.');
    throw new Error('Failed to delete account. Please try again or contact support.');
  }

  if (!data?.success) {
    throw new Error('Failed to delete account. Please try again or contact support.');
  }

  return data;
}
