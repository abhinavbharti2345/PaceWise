export interface GroupMember {
  id: string;
  name: string;
  isUser: boolean;
}

export interface GroupExpenseSplit {
  memberId: string;
  amount: number;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  date: string;
  category?: string;
  splitType: 'equal' | 'custom';
  splits: GroupExpenseSplit[];
  createdAt: string;
}

export interface GroupTransfer {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  transfers: GroupTransfer[];
  status: 'active' | 'settled';
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  isUser: boolean;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = should receive, negative = owes
}

export interface SettlementTransfer {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface GroupSummary {
  totalSpent: number;
  userShare: number;
  userPaid: number;
  userNet: number;
  balances: MemberBalance[];
  settlements: SettlementTransfer[];
}

/**
 * Calculates net balances for all members in a group.
 * Takes all expenses and all direct transfers into account.
 */
export function calculateGroupSummary(group: Group): GroupSummary {
  const balancesMap: Record<string, MemberBalance> = {};

  group.members.forEach((m) => {
    balancesMap[m.id] = {
      memberId: m.id,
      name: m.name,
      isUser: !!m.isUser,
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0,
    };
  });

  let totalSpent = 0;

  // 1. Process Expenses
  for (const exp of group.expenses) {
    totalSpent += exp.amount;

    // Credit payer
    if (balancesMap[exp.payerId]) {
      balancesMap[exp.payerId].totalPaid += exp.amount;
    }

    // Debit each member's share
    for (const split of exp.splits) {
      if (balancesMap[split.memberId]) {
        balancesMap[split.memberId].totalShare += split.amount;
      }
    }
  }

  // 2. Initial net balance from expenses
  for (const id of Object.keys(balancesMap)) {
    balancesMap[id].netBalance = balancesMap[id].totalPaid - balancesMap[id].totalShare;
  }

  // 3. Process direct transfers (debt settlements or cash handovers)
  // If fromMember gave money to toMember:
  // - fromMember has paid more -> net balance increases
  // - toMember has received cash -> net balance decreases
  // NOTE: Settlements do NOT alter totalPaid or totalShare (consumption)
  for (const transfer of group.transfers) {
    if (balancesMap[transfer.fromMemberId]) {
      balancesMap[transfer.fromMemberId].netBalance += transfer.amount;
    }
    if (balancesMap[transfer.toMemberId]) {
      balancesMap[transfer.toMemberId].netBalance -= transfer.amount;
    }
  }

  // Convert to array
  const balances = Object.values(balancesMap).map((b) => ({
    ...b,
    netBalance: Math.round(b.netBalance * 100) / 100,
    totalPaid: Math.round(b.totalPaid * 100) / 100,
    totalShare: Math.round(b.totalShare * 100) / 100,
  }));

  const userMember = group.members.find((m) => m.isUser);
  const userBalance = userMember ? balancesMap[userMember.id] : null;

  const settlements = simplifyDebts(balances);

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    userShare: userBalance ? Math.round(userBalance.totalShare * 100) / 100 : 0,
    userPaid: userBalance ? Math.round(userBalance.totalPaid * 100) / 100 : 0,
    userNet: userBalance ? Math.round(userBalance.netBalance * 100) / 100 : 0,
    balances,
    settlements,
  };
}

/**
 * Debt Simplification Algorithm:
 * Greedily matches the largest debtor with the largest creditor
 * to produce a clean, valid settlement transfer plan.
 */
export function simplifyDebts(balances: MemberBalance[]): SettlementTransfer[] {
  // Separate into debtors (< 0) and creditors (> 0)
  const debtors: { memberId: string; name: string; amount: number }[] = [];
  const creditors: { memberId: string; name: string; amount: number }[] = [];

  for (const b of balances) {
    const net = Math.round(b.netBalance * 100) / 100;
    if (net <= -0.005) {
      debtors.push({ memberId: b.memberId, name: b.name, amount: Math.abs(net) });
    } else if (net >= 0.005) {
      creditors.push({ memberId: b.memberId, name: b.name, amount: net });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementTransfer[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        fromMemberId: debtor.memberId,
        fromName: debtor.name,
        toMemberId: creditor.memberId,
        toName: creditor.name,
        amount: roundedAmount,
      });
    }

    debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;

    if (debtor.amount < 0.005) {
      i++;
    }
    if (creditor.amount < 0.005) {
      j++;
    }
  }

  return settlements;
}

/**
 * Safely parses raw amount strings to integer paise.
 * Rejects non-finite values, NaN, negative amounts, sub-paisa precision, and scientific notation.
 */
export function toPaise(raw: string, options: { allowZero?: boolean } = {}): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;

  const paise = Math.round(num * 100);
  if (!Number.isSafeInteger(paise)) return null;
  if (options.allowZero ? paise < 0 : paise <= 0) return null;

  return paise;
}

/**
 * Generates an attractive WhatsApp / text summary for the group.
 */
export function formatWhatsAppSummary(group: Group, currency = '₹'): string {
  const summary = calculateGroupSummary(group);

  const emoji = group.emoji || '✨';
  let message = `${emoji} *${group.name}* - Expense Summary\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *Total Group Spend:* ${currency}${summary.totalSpent.toLocaleString('en-IN')}\n\n`;

  message += `👥 *Individual Breakdown:*\n`;
  for (const b of summary.balances) {
    const netFormatted =
      b.netBalance > 0
        ? `🟢 gets back ${currency}${b.netBalance.toLocaleString('en-IN')}`
        : b.netBalance < 0
        ? `🔴 owes ${currency}${Math.abs(b.netBalance).toLocaleString('en-IN')}`
        : `⚪ settled`;
    message += `• *${b.name}*: Paid ${currency}${b.totalPaid.toLocaleString('en-IN')} | Share ${currency}${b.totalShare.toLocaleString('en-IN')} (${netFormatted})\n`;
  }

  message += `\n🤝 *Suggested Settlements (Simplified):*\n`;
  if (summary.settlements.length === 0) {
    message += `🎉 All settled up! No pending payments.\n`;
  } else {
    summary.settlements.forEach((s, idx) => {
      message += `${idx + 1}. *${s.fromName}* ➡️ *${s.toName}*: ${currency}${s.amount.toLocaleString('en-IN')}\n`;
    });
  }

  message += `\n_Generated via PaceWise_ 🚀`;
  return message;
}
