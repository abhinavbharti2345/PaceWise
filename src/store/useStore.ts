import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateBudget, type Transaction, type BudgetConfig } from '../features/budget/budgetEngine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
  balance: number; // positive = they owe user (To Receive), negative = user owes them (To Give)
}

interface AppState {
  config: BudgetConfig;
  transactions: Transaction[];
  people: Person[];
  isHydrated: boolean; // true once Supabase data has been loaded for the current user
  
  // Actions
  setConfig: (config: BudgetConfig) => void;
  updateConfig: (partial: Partial<BudgetConfig>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  // People actions
  addPerson: (person: Omit<Person, 'id'>) => string;
  deletePerson: (id: string) => void;
  updatePersonBalance: (personId: string, amountChange: number) => void;
  
  // High-level flows
  recordPersonTransaction: (params: {
    personId: string;
    personName: string;
    amount: number;
    direction: 'gave' | 'took';
    reason: string;
    date?: string;
    note?: string;
  }) => void;
  
  settleDebt: (params: {
    personId: string;
    personName: string;
    amount: number;
    direction: 'received' | 'paid';
    note?: string;
  }) => void;
  
  clearAllData: () => void;
  resetData: () => void;
  setHydrated: (value: boolean) => void;
}

const getMonthDates = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return { start, end };
};

const { start: monthStart, end: monthEnd } = getMonthDates();

// Empty defaults — no mock data
const defaultConfig: BudgetConfig = {
  totalMoney: 0,
  startDate: monthStart,
  endDate: monthEnd,
  currency: '₹',
  theme: 'system',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      transactions: [],
      people: [],
      isHydrated: false,

      setConfig: (config) => set({ config }),
      
      updateConfig: async (partial) => {
        const oldConfig = useStore.getState().config;
        const oldTransactions = useStore.getState().transactions;
        const isNewMonth = partial.startDate && new Date(partial.startDate).getTime() > new Date(oldConfig.startDate).getTime();
        
        let rolloverTx: Omit<Transaction, 'id'> | null = null;
        
        if (isNewMonth) {
          const finalStats = calculateBudget(oldConfig, oldTransactions, oldConfig.endDate);
          const unusedAmount = finalStats.todaysAvailable - finalStats.spentToday;
          
          if (unusedAmount > 0) {
            rolloverTx = {
              type: 'income',
              amount: unusedAmount,
              date: partial.startDate!, 
              category: 'Rollover',
              reason: 'Rollover from previous month',
              source: 'other',
            };
          }
        }

        set((state) => ({
          config: { ...state.config, ...partial }
        }));
        
        if (rolloverTx) {
          useStore.getState().addTransaction(rolloverTx);
        }
        
        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for updateConfig:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot update budget config, user is not authenticated.');
          return;
        }

        const newConfig = useStore.getState().config;
        console.log('[PaceWise DB] Saving budget...');
        console.log('[PaceWise DB] Budget payload:', newConfig);

        try {
          // Manual UPSERT since user_id is not uniquely constrained in DB
          const { data: existing } = await supabase
            .from('budget_configs')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase.from('budget_configs').update({
              total_money: newConfig.totalMoney,
              start_date: newConfig.startDate,
              end_date: newConfig.endDate,
              currency: newConfig.currency,
              theme: newConfig.theme,
              updated_at: new Date().toISOString(),
            }).eq('user_id', user.id);
            
            if (error) throw error;
            console.log('[PaceWise DB] Budget save SUCCESS (updated)');
          } else {
            const { error } = await supabase.from('budget_configs').insert({
              user_id: user.id,
              total_money: newConfig.totalMoney,
              start_date: newConfig.startDate,
              end_date: newConfig.endDate,
              currency: newConfig.currency,
              theme: newConfig.theme,
            });
            
            if (error) throw error;
            console.log('[PaceWise DB] Budget save SUCCESS (inserted)');
          }
        } catch (error: any) {
          console.error('[PaceWise DB] Failed to save budget config', {
            error,
            code: error?.code,
            message: error?.message,
            details: error?.details,
            hint: error?.hint
          });
        }
      },
      
      addTransaction: (transaction) => {
        const id = crypto.randomUUID();
        const newTx = { ...transaction, id };
        set((state) => ({
          transactions: [newTx, ...state.transactions]
        }));

        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for addTransaction:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot add transaction, user is not authenticated.');
          return;
        }

        console.log('[PaceWise DB] Saving transaction...');
        console.log('[PaceWise DB] Transaction payload:', newTx);

        // Fire and forget cloud write
        supabase.from('transactions').insert({
          id,
          user_id: user.id,
          type: newTx.type,
          amount: newTx.amount,
          date: newTx.date,
          category: newTx.category,
          reason: newTx.reason,
          source: newTx.source,
          person_id: newTx.personId,
          person_name: newTx.personName,
          direction: newTx.direction,
          is_settlement: newTx.isSettlement,
          payment_method: newTx.paymentMethod,
          note: newTx.note,
        }).then(({ error }) => {
          if (error) {
            console.error('[PaceWise DB] Failed to save transaction', {
              error,
              code: error?.code,
              message: error?.message,
              details: error?.details,
              hint: error?.hint
            });
          } else {
            console.log('[PaceWise DB] Transaction save SUCCESS');
          }
        });
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }));
        
        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for deleteTransaction:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot delete transaction, user is not authenticated.');
          return;
        }

        console.log(`[PaceWise DB] Deleting transaction ${id}...`);

        supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) {
            console.error('[PaceWise DB] Failed to delete transaction', {
              error,
              code: error?.code,
              message: error?.message,
              details: error?.details,
              hint: error?.hint
            });
          } else {
            console.log('[PaceWise DB] Transaction delete SUCCESS');
          }
        });
      },
      
      addPerson: (person) => {
        const id = crypto.randomUUID();
        const newPerson = { ...person, id };
        set((state) => ({
          people: [...state.people, newPerson]
        }));
        
        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for addPerson:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot add person, user is not authenticated.');
          return id;
        }

        console.log('[PaceWise DB] Saving person...');
        console.log('[PaceWise DB] Person payload:', newPerson);

        // Fire and forget
        supabase.from('people').insert({
          id,
          user_id: user.id,
          name: newPerson.name,
          avatar_url: newPerson.avatarUrl,
          balance: newPerson.balance,
        }).then(({ error }) => {
          if (error) {
            console.error('[PaceWise DB] Failed to save person', {
              error,
              code: error?.code,
              message: error?.message,
              details: error?.details,
              hint: error?.hint
            });
          } else {
            console.log('[PaceWise DB] Person save SUCCESS');
          }
        });
        
        return id;
      },

      deletePerson: (id) => {
        set((state) => ({
          people: state.people.filter(p => p.id !== id)
        }));
        
        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for deletePerson:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot delete person, user is not authenticated.');
          return;
        }

        console.log(`[PaceWise DB] Deleting person ${id}...`);

        supabase.from('people').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) {
            console.error('[PaceWise DB] Failed to delete person', {
              error,
              code: error?.code,
              message: error?.message,
              details: error?.details,
              hint: error?.hint
            });
          } else {
            console.log('[PaceWise DB] Person delete SUCCESS');
          }
        });
      },

      updatePersonBalance: (personId, amountChange) => {
        set((state) => ({
          people: state.people.map(p => 
            p.id === personId ? { ...p, balance: p.balance + amountChange } : p
          )
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const person = useStore.getState().people.find(p => p.id === personId);
          if (person) {
            supabase.from('people').update({ balance: person.balance, updated_at: new Date().toISOString() })
              .eq('id', personId).eq('user_id', userId).then(({ error }) => {
              if (error) console.error('[PaceWise] Failed to update person balance in Supabase:', error);
            });
          }
        }
      },

      recordPersonTransaction: ({ personId, personName, amount, direction, reason, date, note }) => {
        const txDate = date || new Date().toISOString();
        const balanceChange = direction === 'gave' ? amount : -amount;
        const txId = crypto.randomUUID();

        set((state) => ({
          people: state.people.map(p => 
            p.id === personId ? { ...p, balance: p.balance + balanceChange } : p
          ),
          transactions: [
            {
              id: txId,
              type: 'person',
              amount,
              category: 'People',
              reason: reason || (direction === 'gave' ? `Lent money to ${personName}` : `Borrowed from ${personName}`),
              personId,
              personName,
              direction,
              date: txDate,
              note
            },
            ...state.transactions
          ]
        }));

        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const person = useStore.getState().people.find(p => p.id === personId);
          
          const promises: PromiseLike<unknown>[] = [];
          
          if (person) {
            promises.push(
              supabase.from('people').update({ balance: person.balance, updated_at: new Date().toISOString() })
                .eq('id', personId).eq('user_id', userId).then(({ error }) => {
                  if (error) console.error('[PaceWise] Failed to update person balance:', error);
                })
            );
          }
          
          promises.push(
            supabase.from('transactions').insert({
              id: txId,
              user_id: userId,
              type: 'person',
              amount,
              date: txDate,
              category: 'People',
              reason: reason || (direction === 'gave' ? `Lent money to ${personName}` : `Borrowed from ${personName}`),
              person_id: personId,
              person_name: personName,
              direction,
              note,
            }).then(({ error }) => {
              if (error) console.error('[PaceWise] Failed to insert person transaction:', error);
            })
          );
          
          Promise.all(promises).catch(err => 
            console.error('[PaceWise] Failed to sync recordPersonTransaction:', err)
          );
        }
      },

      settleDebt: ({ personId, personName, amount, direction, note }) => {
        const txId = crypto.randomUUID();
        const txDate = new Date().toISOString();
        
        const txDirection = direction === 'received' ? 'took' : 'gave';
        const balanceChange = direction === 'received' ? -amount : amount;
        
        const txReason = direction === 'received' 
          ? `Received settlement from ${personName}` 
          : `Paid settlement to ${personName}`;

        set((state) => ({
          people: state.people.map(p => 
            p.id === personId ? { ...p, balance: p.balance + balanceChange } : p
          ),
          transactions: [
            {
              id: txId,
              type: 'person',
              amount,
              category: 'Settlement',
              reason: txReason,
              personId,
              personName,
              direction: txDirection,
              isSettlement: true,
              date: txDate,
              note
            },
            ...state.transactions
          ]
        }));

        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for settleDebt:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot settle debt, user is not authenticated.');
          return;
        }

        const person = useStore.getState().people.find(p => p.id === personId);
        
        const promises: PromiseLike<unknown>[] = [];
        
        if (person) {
          console.log(`[PaceWise DB] Updating person balance for ${personId}...`);
          promises.push(
            supabase.from('people').update({ balance: person.balance, updated_at: new Date().toISOString() })
              .eq('id', personId).eq('user_id', user.id).then(({ error }) => {
                if (error) {
                  console.error('[PaceWise DB] Failed to update person balance', { error, code: error?.code });
                }
              })
          );
        }
        
        console.log('[PaceWise DB] Inserting settlement transaction...');
        promises.push(
          supabase.from('transactions').insert({
            id: txId,
            user_id: user.id,
            type: 'person',
            amount,
            date: txDate,
            category: 'Settlement',
            reason: txReason,
            person_id: personId,
            person_name: personName,
            direction: txDirection,
            is_settlement: true,
            note,
          }).then(({ error }) => {
            if (error) {
              console.error('[PaceWise DB] Failed to insert settlement transaction', { error, code: error?.code });
            } else {
              console.log('[PaceWise DB] Settle debt SUCCESS');
            }
          })
        );
        
        Promise.all(promises).catch((error: any) => {
          console.error('[PaceWise DB] Failed to sync settleDebt', {
            error,
            code: error?.code,
            message: error?.message
          });
        });
      },
      
      clearAllData: () => set({
        config: {
          totalMoney: 0,
          startDate: monthStart,
          endDate: monthEnd,
          currency: '₹',
          theme: 'system',
        },
        transactions: [],
        people: [],
        isHydrated: false,
      }),

      resetData: () => set({ 
        config: defaultConfig, 
        transactions: [], 
        people: [],
        isHydrated: false,
      }),

      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'pacewise-storage-v2',
      partialize: (state) => ({
        // Only persist data fields, NOT the isHydrated flag
        config: state.config,
        transactions: state.transactions,
        people: state.people,
      }),
    }
  )
);
