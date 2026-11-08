import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group, GroupExpense, GroupTransfer } from '../utils/groupEngine';
import { deleteReceipt } from '../lib/receiptStorage';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

interface GroupState {
  groups: Group[];

  // Group lifecycle
  createGroup: (data: {
    name: string;
    emoji?: string;
    description?: string;
    memberNames: string[];
    currency?: string;
  }) => string;
  updateGroup: (
    groupId: string,
    data: Partial<Pick<Group, 'name' | 'emoji' | 'description' | 'status' | 'currency'>>
  ) => void;
  deleteGroup: (groupId: string) => void;

  // Member management
  addMember: (groupId: string, name: string) => void;
  removeMember: (groupId: string, memberId: string) => void;

  // Expenses
  addExpense: (
    groupId: string,
    data: Omit<GroupExpense, 'id' | 'groupId' | 'createdAt'>
  ) => string;
  deleteExpense: (groupId: string, expenseId: string) => void;
  attachExpenseReceipt: (groupId: string, expenseId: string, receiptId: string) => void;

  // Transfers / Settlements
  addTransfer: (
    groupId: string,
    data: Omit<GroupTransfer, 'id' | 'groupId' | 'createdAt'>
  ) => string;
  deleteTransfer: (groupId: string, transferId: string) => void;

  // Status
  setGroupStatus: (groupId: string, status: 'active' | 'settled') => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],

      createGroup: (data) => {
        const id = generateId();
        const now = new Date().toISOString();

        // Always include "You" as the first member
        const members = [
          { id: generateId(), name: 'You', isUser: true },
          ...data.memberNames
            .map((name) => name.trim())
            .filter((name) => name.length > 0 && name.toLowerCase() !== 'you')
            .map((name) => ({
              id: generateId(),
              name,
              isUser: false,
            })),
        ];

        const newGroup: Group = {
          id,
          name: data.name.trim() || 'Untitled Group',
          emoji: data.emoji || '🏖️',
          description: data.description?.trim(),
          currency: data.currency || '₹',
          status: 'active',
          members,
          expenses: [],
          transfers: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          groups: [newGroup, ...state.groups],
        }));

        return id;
      },

      updateGroup: (groupId, data) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
      },

      addMember: (groupId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            if (g.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
              return g;
            }
            return {
              ...g,
              members: [
                ...g.members,
                { id: generateId(), name: trimmed, isUser: false },
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeMember: (groupId, memberId) => {
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            // Guard: Cannot remove member who has transaction history (expenses or transfers)
            const hasHistory =
              g.expenses.some(
                (e) => e.payerId === memberId || e.splits.some((s) => s.memberId === memberId)
              ) ||
              g.transfers.some(
                (t) => t.fromMemberId === memberId || t.toMemberId === memberId
              );
            if (hasHistory) return g;

            return {
              ...g,
              members: g.members.filter((m) => m.id !== memberId || m.isUser),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addExpense: (groupId, data) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group || group.status === 'settled') return '';
        if (!Number.isFinite(data.amount) || data.amount <= 0) return '';
        if (!group.members.some((m) => m.id === data.payerId)) return '';
        if (!data.splits || data.splits.length === 0) return '';

        const id = generateId();
        const now = new Date().toISOString();

        const expense: GroupExpense = {
          ...data,
          id,
          groupId,
          createdAt: now,
        };

        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: [expense, ...g.expenses],
                  updatedAt: now,
                }
              : g
          ),
        }));

        return id;
      },

      deleteExpense: (groupId, expenseId) => {
        const group = get().groups.find((g) => g.id === groupId);
        const exp = group?.expenses.find((e) => e.id === expenseId);
        if (exp?.receiptId) {
          deleteReceipt(exp.receiptId);
        }

        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.filter((e) => e.id !== expenseId),
                  updatedAt: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      attachExpenseReceipt: (groupId, expenseId, receiptId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.map((e) =>
                    e.id === expenseId ? { ...e, receiptId } : e
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      addTransfer: (groupId, data) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group || group.status === 'settled') return '';
        if (!Number.isFinite(data.amount) || data.amount <= 0) return '';
        if (!group.members.some((m) => m.id === data.fromMemberId)) return '';
        if (!group.members.some((m) => m.id === data.toMemberId)) return '';

        const id = generateId();
        const now = new Date().toISOString();

        const transfer: GroupTransfer = {
          ...data,
          id,
          groupId,
          createdAt: now,
        };

        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  transfers: [transfer, ...g.transfers],
                  updatedAt: now,
                }
              : g
          ),
        }));

        return id;
      },

      deleteTransfer: (groupId, transferId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  transfers: g.transfers.filter((t) => t.id !== transferId),
                  updatedAt: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      setGroupStatus: (groupId, status) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, status, updatedAt: new Date().toISOString() }
              : g
          ),
        }));
      },
    }),
    {
      name: 'pacewise-groups-v1',
      version: 1,
    }
  )
);
