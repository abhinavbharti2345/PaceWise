import { differenceInDays, startOfDay } from 'date-fns';

export type TransactionType = 'expense' | 'income' | 'bill' | 'person';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  category?: string;
  reason?: string;
  source?: string; // For income: 'parents' | 'salary' | 'scholarship' | 'other'
  personId?: string;
  personName?: string;
  direction?: 'gave' | 'took'; // 'gave' = lent money (they owe), 'took' = borrowed money (I owe)
  isSettlement?: boolean;
  paymentMethod?: string;
  note?: string;
}

export interface BudgetConfig {
  totalMoney: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  currency?: string;
  theme?: 'light' | 'dark' | 'system';
}

export interface BudgetStats {
  baseDailyBudget: number;
  carryForward: number;
  todaysAvailable: number;
  spentToday: number;
  moneyLeft: number;
  daysRemaining: number;
  totalDays: number;
  daysPassed: number;
  effectiveTotalBudget: number;
  totalAddedMoney: number;
  totalBills: number;
  isOverspent: boolean;
}

export function calculateBudget(
  config: BudgetConfig,
  transactions: Transaction[],
  currentDateStr: string
): BudgetStats {
  const start = startOfDay(new Date(config.startDate));
  const end = startOfDay(new Date(config.endDate));
  const today = startOfDay(new Date(currentDateStr));

  const totalDays = Math.max(1, differenceInDays(end, start) + 1); // Inclusive of start and end day
  
  // Cap daysPassed at totalDays, and ensure it's at least 0
  let daysPassed = differenceInDays(today, start);
  if (daysPassed < 0) daysPassed = 0;
  if (daysPassed > totalDays) daysPassed = totalDays;

  const daysRemaining = Math.max(1, totalDays - daysPassed);

  let totalAddedMoney = 0;
  let totalBills = 0;
  let normalExpensesUpToYesterday = 0;
  let spentToday = 0;

  for (const t of transactions) {
    const tDate = startOfDay(new Date(t.date));
    const isToday = tDate.getTime() === today.getTime();
    const isBeforeToday = tDate.getTime() < today.getTime();

    if (t.type === 'income') {
      totalAddedMoney += t.amount;
    } else if (t.type === 'bill') {
      totalBills += t.amount;
    } else if (t.type === 'expense') {
      if (isBeforeToday) {
        normalExpensesUpToYesterday += t.amount;
      } else if (isToday) {
        spentToday += t.amount;
      }
    } else if (t.type === 'person') {
      // If user gave money (lent), it's treated as cash outflow (expense)
      // If user received settlement money, it is cash inflow
      if (t.direction === 'gave') {
        if (isBeforeToday) {
          normalExpensesUpToYesterday += t.amount;
        } else if (isToday) {
          spentToday += t.amount;
        }
      } else if (t.direction === 'took' && t.isSettlement) {
        // Person repayment received
        totalAddedMoney += t.amount;
      }
    }
  }

  // 1. Effective Total Budget
  const effectiveTotalBudget = config.totalMoney + totalAddedMoney - totalBills;

  // 2. Base Daily Budget
  const baseDailyBudget = totalDays > 0 ? effectiveTotalBudget / totalDays : 0;

  // 3. Carry Forward
  const totalAllowanceUpToYesterday = baseDailyBudget * daysPassed;
  const carryForward = totalAllowanceUpToYesterday - normalExpensesUpToYesterday;

  // 4. Today's Available
  const todaysAvailable = baseDailyBudget + carryForward;

  // 5. Money Left (Actual Cash)
  const moneyLeft = effectiveTotalBudget - normalExpensesUpToYesterday - spentToday;

  const isOverspent = spentToday > todaysAvailable;

  return {
    baseDailyBudget,
    carryForward,
    todaysAvailable,
    spentToday,
    moneyLeft,
    daysRemaining,
    totalDays,
    daysPassed,
    effectiveTotalBudget,
    totalAddedMoney,
    totalBills,
    isOverspent,
  };
}
