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

export interface DailyBudgetStat {
  dayIndex: number;
  date: string; // ISO string for the day
  actualRemaining: number;
  idealRemaining: number;
  discretionarySpent: number;
  cumulativeDiscretionarySpent: number;
  cumulativeIdealSpent: number;
  isFuture: boolean;
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
  progressPercentage: number;
  totalDiscretionarySpent: number;
  zeroSpendDays: number;
  dailyStats: DailyBudgetStat[];
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
  
  let netPersonCashFlowUpToYesterday = 0;
  let netPersonCashFlowToday = 0;

  const discretionarySpendByDate: Record<string, number> = {};
  const netPersonCashFlowByDate: Record<string, number> = {};

  for (const t of transactions) {
    const tDate = startOfDay(new Date(t.date));
    
    // Ignore transactions that occurred before the current budget period start date
    // OR after the current budget period end date.
    if (tDate.getTime() < start.getTime() || tDate.getTime() > end.getTime()) {
      continue;
    }

    const isToday = tDate.getTime() === today.getTime();
    const isBeforeToday = tDate.getTime() < today.getTime();
    const dateKey = tDate.getTime().toString();

    if (t.type === 'income') {
      totalAddedMoney += t.amount;
    } else if (t.type === 'bill') {
      totalBills += t.amount;
    } else if (t.type === 'expense') {
      if (isBeforeToday || isToday) {
        discretionarySpendByDate[dateKey] = (discretionarySpendByDate[dateKey] || 0) + t.amount;
      }
      
      if (isBeforeToday) {
        normalExpensesUpToYesterday += t.amount;
      } else if (isToday) {
        spentToday += t.amount;
      }
    } else if (t.type === 'person') {
      // All person transactions are treated strictly as cash flow, not discretionary expenses.
      // direction === 'gave': User lent money or paid a settlement (Cash OUT).
      // direction === 'took': User borrowed money or received a settlement (Cash IN).
      const flow = t.direction === 'took' ? t.amount : -t.amount;
      
      if (isBeforeToday || isToday) {
        netPersonCashFlowByDate[dateKey] = (netPersonCashFlowByDate[dateKey] || 0) + flow;
      }

      if (isBeforeToday) {
        netPersonCashFlowUpToYesterday += flow;
      } else if (isToday) {
        netPersonCashFlowToday += flow;
      }
    }
  }

  const totalNetPersonCashFlow = netPersonCashFlowUpToYesterday + netPersonCashFlowToday;

  // 1. Effective Total Budget
  // Person transactions adjust the effective budget pool for the period, smoothing daily allowance.
  const effectiveTotalBudget = config.totalMoney + totalAddedMoney - totalBills + totalNetPersonCashFlow;

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

  // 6. Progress Percentage
  // Using effectiveTotalBudget (the planned budget pool) to calculate progress.
  let progressPercentage = 0;
  if (effectiveTotalBudget > 0) {
    progressPercentage = Math.round((moneyLeft / effectiveTotalBudget) * 100);
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));
  } else if (effectiveTotalBudget === 0 && moneyLeft === 0) {
    progressPercentage = 0; // If they have absolutely nothing, they have 0% left
  }

  // 7. Discretionary Specifics
  const totalDiscretionarySpent = normalExpensesUpToYesterday + spentToday;
  
  // Calculate zero spend days (total days up to today - days with discretionary spend)
  const daysUpToToday = daysPassed + 1;
  const activeSpendDays = Object.keys(discretionarySpendByDate).length;
  const zeroSpendDays = Math.max(0, daysUpToToday - activeSpendDays);

  const dailyStats: DailyBudgetStat[] = [];
  let cumulativeDiscretionarySpent = 0;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = d.getTime().toString();
    const daySpent = discretionarySpendByDate[dateKey] || 0;
    
    const isFuture = d.getTime() > today.getTime();
    
    if (!isFuture) {
      cumulativeDiscretionarySpent += daySpent;
    }
    
    const idealRemaining = effectiveTotalBudget - (baseDailyBudget * (i + 1));
    const actualRemaining = isFuture ? 0 : effectiveTotalBudget - cumulativeDiscretionarySpent;

    dailyStats.push({
      dayIndex: i + 1,
      date: d.toISOString(),
      actualRemaining: isFuture ? 0 : actualRemaining,
      idealRemaining,
      discretionarySpent: daySpent,
      cumulativeDiscretionarySpent,
      cumulativeIdealSpent: baseDailyBudget * (i + 1),
      isFuture
    });
  }

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
    progressPercentage,
    totalDiscretionarySpent,
    zeroSpendDays,
    dailyStats,
  };
}
