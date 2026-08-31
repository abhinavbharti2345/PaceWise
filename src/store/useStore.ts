import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, BudgetConfig } from '../features/budget/budgetEngine';
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
      
      updateConfig: (partial) => {
        set((state) => ({
          config: { ...state.config, ...partial }
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const newConfig = useStore.getState().config;
          supabase.from('budget_configs').update({
            total_money: newConfig.totalMoney,
            start_date: newConfig.startDate,
            end_date: newConfig.endDate,
            currency: newConfig.currency,
            theme: newConfig.theme,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId).then(({ error }) => {
            if (error) console.error('[PaceWise] Failed to sync config to Supabase:', error);
          });
        }
      },
      
      addTransaction: (transaction) => {
        const id = crypto.randomUUID();
        const newTx = { ...transaction, id };
        set((state) => ({
          transactions: [newTx, ...state.transactions]
        }));

        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          supabase.from('transactions').insert({
            id,
            user_id: userId,
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
            if (error) console.error('[PaceWise] Failed to insert transaction in Supabase:', error);
          });
        }
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          supabase.from('transactions').delete().eq('id', id).eq('user_id', userId).then(({ error }) => {
            if (error) console.error('[PaceWise] Failed to delete transaction from Supabase:', error);
          });
        }
      },
      
      addPerson: (person) => {
        const id = crypto.randomUUID();
        const newPerson = { ...person, id };
        set((state) => ({
          people: [...state.people, newPerson]
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          supabase.from('people').insert({
            id,
            user_id: userId,
            name: newPerson.name,
            avatar_url: newPerson.avatarUrl,
            balance: newPerson.balance,
          }).then(({ error }) => {
            if (error) console.error('[PaceWise] Failed to insert person in Supabase:', error);
          });
        }
        
        return id;
      },

      deletePerson: (id) => {
        set((state) => ({
          people: state.people.filter(p => p.id !== id)
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          supabase.from('people').delete().eq('id', id).eq('user_id', userId).then(({ error }) => {
            if (error) console.error('[PaceWise] Failed to delete person from Supabase:', error);
          });
        }
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
        const txDate = new Date().toISOString();
        const balanceChange = direction === 'received' ? -amount : amount;
        const txId = crypto.randomUUID();
        const txDirection = direction === 'received' ? 'took' : 'gave';
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
              category: 'Settlement',
              reason: txReason,
              person_id: personId,
              person_name: personName,
              direction: txDirection,
              is_settlement: true,
              note,
            }).then(({ error }) => {
              if (error) console.error('[PaceWise] Failed to insert settlement transaction:', error);
            })
          );
          
          Promise.all(promises).catch(err => 
            console.error('[PaceWise] Failed to sync settleDebt:', err)
          );
        }
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
