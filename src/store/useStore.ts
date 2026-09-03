import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateBudget, type Transaction, type BudgetConfig } from '../features/budget/budgetEngine';
import type { CategoryMeta } from '../utils/categoryHelpers';
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
  customCategories: CategoryMeta[];
  isHydrated: boolean; // true once Supabase data has been loaded for the current user
  
  // Custom Categories actions
  addCustomCategory: (cat: CategoryMeta) => void;
  deleteCustomCategory: (name: string) => void;
  
  // Actions
  setConfig: (config: BudgetConfig) => void;
  updateConfig: (partial: Partial<BudgetConfig>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updated: Partial<Omit<Transaction, 'id'>>) => void;
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
    direction: 'gave' | 'took' | 'bought_for_me';
    category?: string;
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
    expenseCategory?: string;
    expenseReason?: string;
    settleTransactionId?: string;
  }) => void;
  
  clearAllData: () => void;
  resetData: () => void;
  setHydrated: (value: boolean) => void;
}

export const getBudgetDatesForDate = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
  return { start, end };
};

export function calculatePersonBalance(personId: string, transactions: Transaction[]): number {
  return transactions
    .filter(t => t.personId === personId)
    .reduce((sum, t) => sum + (t.direction === 'gave' ? t.amount : (t.direction === 'took' || t.direction === 'bought_for_me' ? -t.amount : 0)), 0);
}

const { start: monthStart, end: monthEnd } = getBudgetDatesForDate(new Date());

// Safe UUID generation that works on mobile devices over non-HTTPS local IP addresses
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
      customCategories: [],
      isHydrated: false,

      addCustomCategory: (cat) => set((state) => {
        const exists = state.customCategories.some(c => c.name.toLowerCase() === cat.name.toLowerCase());
        if (exists) return state;
        return { customCategories: [...state.customCategories, cat] };
      }),

      deleteCustomCategory: (name) => set((state) => ({
        customCategories: state.customCategories.filter(c => c.name.toLowerCase() !== name.toLowerCase())
      })),

      setConfig: (config) => set({ config }),
      
      updateConfig: async (partial) => {
        const oldConfig = useStore.getState().config;
        const oldTransactions = useStore.getState().transactions;
        const startOfDayTime = (d: string | Date) => {
          const dt = new Date(d);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime();
        };
        const isNewMonth = partial.startDate && startOfDayTime(partial.startDate) > startOfDayTime(oldConfig.startDate);
        
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
        const id = generateId();
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

      updateTransaction: (id, updated) => {
        const state = useStore.getState();
        const oldTx = state.transactions.find(t => t.id === id);
        const newTransactions = state.transactions.map((t) =>
          t.id === id ? { ...t, ...updated } : t
        );

        // Recalculate balances for any affected personId
        const affectedPersonIds = new Set<string>();
        if (oldTx?.personId) affectedPersonIds.add(oldTx.personId);
        if (updated.personId) affectedPersonIds.add(updated.personId);

        let newPeople = state.people;
        if (affectedPersonIds.size > 0) {
          newPeople = state.people.map(p => {
            if (affectedPersonIds.has(p.id)) {
              return { ...p, balance: calculatePersonBalance(p.id, newTransactions) };
            }
            return p;
          });

          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            affectedPersonIds.forEach(pId => {
              const b = calculatePersonBalance(pId, newTransactions);
              supabase.from('people').update({ balance: b, updated_at: new Date().toISOString() })
                .eq('id', pId).eq('user_id', userId).then(({ error }) => {
                  if (error) console.error('[PaceWise DB] Failed to update person balance on tx update:', error);
                });
            });
          }
        }

        set({
          transactions: newTransactions,
          people: newPeople,
        });

        const user = useAuthStore.getState().user;
        if (!user?.id) return;

        const payload: Record<string, any> = {};
        if (updated.type !== undefined) payload.type = updated.type;
        if (updated.amount !== undefined) payload.amount = updated.amount;
        if (updated.date !== undefined) payload.date = updated.date;
        if (updated.category !== undefined) payload.category = updated.category;
        if (updated.reason !== undefined) payload.reason = updated.reason;
        if (updated.source !== undefined) payload.source = updated.source;
        if (updated.personId !== undefined) payload.person_id = updated.personId;
        if (updated.personName !== undefined) payload.person_name = updated.personName;
        if (updated.direction !== undefined) payload.direction = updated.direction;
        if (updated.isSettlement !== undefined) payload.is_settlement = updated.isSettlement;
        if (updated.paymentMethod !== undefined) payload.payment_method = updated.paymentMethod;
        if (updated.note !== undefined) payload.note = updated.note;

        supabase.from('transactions').update(payload).eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) console.error('[PaceWise DB] Failed to update transaction:', error);
        });
      },

      deleteTransaction: (id) => {
        const state = useStore.getState();
        const targetTx = state.transactions.find(t => t.id === id);
        const newTransactions = state.transactions.filter(t => t.id !== id);

        let newPeople = state.people;
        if (targetTx?.personId) {
          const newBalance = calculatePersonBalance(targetTx.personId, newTransactions);
          newPeople = state.people.map(p => p.id === targetTx.personId ? { ...p, balance: newBalance } : p);

          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            supabase.from('people').update({ balance: newBalance, updated_at: new Date().toISOString() })
              .eq('id', targetTx.personId).eq('user_id', userId).then(({ error }) => {
                if (error) console.error('[PaceWise DB] Failed to update person balance on tx delete:', error);
              });
          }
        }

        set({
          transactions: newTransactions,
          people: newPeople,
        });

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
        const id = generateId();
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
          people: state.people.filter(p => p.id !== id),
          transactions: state.transactions.filter(t => t.personId !== id)
        }));
        
        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for deletePerson:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot delete person, user is not authenticated.');
          return;
        }

        console.log(`[PaceWise DB] Deleting person ${id} and cascading associated transactions...`);

        // Cascade delete person transactions first, then delete person
        supabase.from('transactions').delete().eq('person_id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) console.error('[PaceWise DB] Failed to delete person transactions:', error);
        });

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

      recordPersonTransaction: ({ personId, personName, amount, direction, category, reason, date, note }: { 
        personId: string, 
        personName: string, 
        amount: number, 
        direction: 'gave' | 'took' | 'bought_for_me', 
        category?: string, 
        reason: string, 
        date?: string, 
        note?: string 
      }) => {
        const txId = generateId();
        const txDate = date || new Date().toISOString();

        const newTx: Transaction = {
          id: txId,
          type: 'person',
          amount,
          date: txDate,
          category: category || 'People',
          reason,
          personId,
          personName,
          direction,
          status: direction === 'bought_for_me' ? 'unsettled' : undefined,
          note
        };

        const state = useStore.getState();
        const newTransactions = [newTx, ...state.transactions];
        const newBalance = calculatePersonBalance(personId, newTransactions);

        set({
          people: state.people.map(p => 
            p.id === personId ? { ...p, balance: newBalance } : p
          ),
          transactions: newTransactions
        });

        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const promises: PromiseLike<unknown>[] = [
            supabase.from('people').update({ balance: newBalance, updated_at: new Date().toISOString() })
              .eq('id', personId).eq('user_id', userId).then(({ error }) => {
                if (error) console.error('[PaceWise] Failed to update person balance:', error);
              }),
            supabase.from('transactions').insert({
              id: txId,
              user_id: userId,
              type: 'person',
              amount,
              date: txDate,
              category: newTx.category || 'People',
              reason: newTx.reason,
              person_id: personId,
              person_name: personName,
              direction,
              status: newTx.status,
              note,
            }).then(({ error }) => {
              if (error) {
                console.error('[PaceWise] Failed to insert person transaction:', error);
                alert(`Supabase Insert Failed: ${error.message}\nHint: ${error.hint || 'No hint'}\nDetails: ${error.details || 'No details'}`);
              }
            })
          ];

          Promise.all(promises).catch(err => 
            console.error('[PaceWise] Failed to sync recordPersonTransaction:', err)
          );
        }
      },

      settleDebt: ({ personId, personName, amount, direction, note, expenseCategory, expenseReason, settleTransactionId }) => {
        const txDate = new Date().toISOString();
        const txId = generateId();

        const txDirection = direction === 'received' ? 'took' : 'gave';
        
        const txReason = direction === 'received' 
          ? `Received settlement from ${personName}` 
          : `Paid settlement to ${personName}`;

        const newTx: Transaction = {
          id: txId,
          type: 'person',
          amount,
          category: 'Settlement',
          reason: txReason,
          personId,
          personName,
          direction: txDirection,
          isSettlement: true,
          isBoughtForMeSettlement: !!expenseCategory,
          date: txDate,
          note
        };

        let expenseTx: Transaction | null = null;
        if (expenseCategory) {
          expenseTx = {
            id: generateId(),
            type: 'expense',
            amount,
            date: txDate,
            category: expenseCategory,
            reason: expenseReason || `Settled expense for ${personName}`,
            personId,
            personName
          };
        }

        const state = useStore.getState();
        let newTransactions = [newTx, ...state.transactions];
        
        if (expenseTx) {
          newTransactions = [expenseTx, ...newTransactions];
        }

        // Mark the specific transaction as settled if full amount is covered
        let isFullyCovered = true;
        if (settleTransactionId) {
          const targetTx = state.transactions.find(tx => tx.id === settleTransactionId);
          isFullyCovered = !targetTx || amount >= targetTx.amount;
          if (isFullyCovered) {
            newTransactions = newTransactions.map(tx => 
              tx.id === settleTransactionId ? { ...tx, status: 'settled' } : tx
            );
          }
        }

        const newBalance = calculatePersonBalance(personId, newTransactions);

        set({
          people: state.people.map(p => 
            p.id === personId ? { ...p, balance: newBalance } : p
          ),
          transactions: newTransactions
        });

        const user = useAuthStore.getState().user;
        console.log('[PaceWise DB] Current user for settleDebt:', user?.id);

        if (!user?.id) {
          console.error('[PaceWise DB] ERROR: Cannot settle debt, user is not authenticated.');
          return;
        }

        const promises: PromiseLike<unknown>[] = [
          supabase.from('people').update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', personId).eq('user_id', user.id).then(({ error }) => {
              if (error) {
                console.error('[PaceWise DB] Failed to update person balance', { error, code: error?.code });
              }
            }),
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
            is_bought_for_me_settlement: !!expenseCategory,
            note,
          }).then(({ error }) => {
            if (error) {
              console.error('[PaceWise DB] Failed to insert settlement transaction', { error, code: error?.code });
            } else {
              console.log('[PaceWise DB] Settle debt SUCCESS');
            }
          })
        ];

        if (settleTransactionId && isFullyCovered) {
          promises.push(
            supabase.from('transactions').update({ status: 'settled' })
              .eq('id', settleTransactionId).eq('user_id', user.id)
              .then(({ error }) => {
                if (error) console.error('[PaceWise DB] Failed to update target transaction status in Supabase:', error);
              })
          );
        }

        if (expenseTx) {
          promises.push(
            supabase.from('transactions').insert({
              id: expenseTx.id,
              user_id: user.id,
              type: 'expense',
              amount: expenseTx.amount,
              date: expenseTx.date,
              category: expenseTx.category,
              reason: expenseTx.reason,
              person_id: expenseTx.personId,
              person_name: expenseTx.personName,
            }).then(({ error }) => {
              if (error) console.error('[PaceWise DB] Failed to insert expense transaction', { error });
            })
          );
        }

        if (settleTransactionId) {
          promises.push(
            supabase.from('transactions').update({ status: 'settled' })
              .eq('id', settleTransactionId).eq('user_id', user.id).then(({ error }) => {
                if (error) console.error('[PaceWise DB] Failed to update settled transaction status', { error });
              })
          );
        }
        
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
