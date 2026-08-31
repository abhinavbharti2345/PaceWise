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
}

const getMonthDates = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return { start, end };
};

const { start: monthStart, end: monthEnd } = getMonthDates();

const mockConfig: BudgetConfig = {
  totalMoney: 6000,
  startDate: monthStart,
  endDate: monthEnd,
  currency: '₹',
  theme: 'system',
};

const now = new Date();
const todayIso = now.toISOString();
const yesterdayIso = new Date(now.getTime() - 86400000).toISOString();
const twoDaysAgoIso = new Date(now.getTime() - 86400000 * 2).toISOString();

const mockPeople: Person[] = [
  { id: 'p1', name: 'Rahul', balance: 500 },
  { id: 'p2', name: 'Aman', balance: -300 },
  { id: 'p3', name: 'Karan', balance: 350 },
];

const mockTransactions: Transaction[] = [
  { 
    id: 't1', 
    type: 'expense', 
    amount: 150, 
    category: 'Food', 
    reason: 'Dinner with friends', 
    date: todayIso 
  },
  { 
    id: 't2', 
    type: 'bill', 
    amount: 1000, 
    category: 'Credit Card', 
    reason: 'Monthly Credit Card Payment', 
    date: todayIso 
  },
  { 
    id: 't3', 
    type: 'expense', 
    amount: 40, 
    category: 'Transport', 
    reason: 'Bus fare to campus', 
    date: todayIso 
  },
  { 
    id: 't4', 
    type: 'expense', 
    amount: 320, 
    category: 'Shopping', 
    reason: 'Notebooks & stationery', 
    date: yesterdayIso 
  },
  { 
    id: 't5', 
    type: 'person', 
    amount: 500, 
    category: 'Food', 
    reason: 'Lunch bill paid for Rahul', 
    personId: 'p1', 
    personName: 'Rahul', 
    direction: 'gave', 
    date: twoDaysAgoIso 
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      config: mockConfig,
      transactions: mockTransactions,
      people: mockPeople,

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
            if (error) console.error('Failed to sync config', error);
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
            if (error) console.error('Failed to sync transaction', error);
          });
        }
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }));
        
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to delete transaction', error);
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
            if (error) console.error('Failed to sync person', error);
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
          supabase.from('people').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to delete person', error);
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
            supabase.from('people').update({ balance: person.balance }).eq('id', personId).then(({ error }) => {
              if (error) console.error('Failed to update person balance', error);
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
          const newTx = useStore.getState().transactions.find(t => t.id === txId);
          
          if (person && newTx) {
            Promise.all([
              supabase.from('people').update({ balance: person.balance }).eq('id', personId),
              supabase.from('transactions').insert({
                id: txId,
                user_id: userId,
                type: newTx.type,
                amount: newTx.amount,
                date: newTx.date,
                category: newTx.category,
                reason: newTx.reason,
                person_id: newTx.personId,
                person_name: newTx.personName,
                direction: newTx.direction,
                note: newTx.note,
              })
            ]).catch(err => console.error('Failed to sync recordPersonTransaction', err));
          }
        }
      },

      settleDebt: ({ personId, personName, amount, direction, note }) => {
        const txDate = new Date().toISOString();
        const balanceChange = direction === 'received' ? -amount : amount;
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
              category: 'Settlement',
              reason: direction === 'received' 
                ? `Received settlement from ${personName}` 
                : `Paid settlement to ${personName}`,
              personId,
              personName,
              direction: direction === 'received' ? 'took' : 'gave',
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
          const newTx = useStore.getState().transactions.find(t => t.id === txId);
          
          if (person && newTx) {
            Promise.all([
              supabase.from('people').update({ balance: person.balance }).eq('id', personId),
              supabase.from('transactions').insert({
                id: txId,
                user_id: userId,
                type: newTx.type,
                amount: newTx.amount,
                date: newTx.date,
                category: newTx.category,
                reason: newTx.reason,
                person_id: newTx.personId,
                person_name: newTx.personName,
                direction: newTx.direction,
                is_settlement: newTx.isSettlement,
                note: newTx.note,
              })
            ]).catch(err => console.error('Failed to sync settleDebt', err));
          }
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
        people: []
      }),

      resetData: () => set({ 
        config: mockConfig, 
        transactions: mockTransactions, 
        people: mockPeople 
      }),
    }),
    {
      name: 'pacewise-storage-v2',
    }
  )
);
