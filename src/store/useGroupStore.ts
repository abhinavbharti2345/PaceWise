import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group, GroupExpense, GroupTransfer } from '../utils/groupEngine';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
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
    (set) => ({
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
            // Keep every member whose id differs from the target, BUT always retain the
            // "You" member (isUser: true) even if memberId accidentally matches.
            // The OR short-circuits: isUser members are unconditionally kept.
            return {
              ...g,
              members: g.members.filter((m) => m.id !== memberId || m.isUser),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addExpense: (groupId, data) => {
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

      addTransfer: (groupId, data) => {
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
    }
  )
);
