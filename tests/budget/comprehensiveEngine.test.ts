import { describe, it, expect } from 'vitest';
import { calculateBudget, BudgetConfig, Transaction } from '../../src/features/budget/budgetEngine';

describe('Comprehensive Budget & Debt Calculations', () => {
  it('handles income addition and bill deductions dynamically', () => {
    const config: BudgetConfig = {
      totalMoney: 6000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    // Income +₹1000 on day 1, Bill ₹500 on day 1
    const t1: Transaction = { id: '1', type: 'income', amount: 1000, date: '2026-08-01' };
    const t2: Transaction = { id: '2', type: 'bill', amount: 500, date: '2026-08-01' };

    const stats = calculateBudget(config, [t1, t2], '2026-08-01');
    // Effective total = 6000 + 1000 - 500 = 6500
    // Total days = 30
    // Base daily = 6500 / 30 = 216.666...
    expect(stats.effectiveTotalBudget).toBe(6500);
    expect(stats.baseDailyBudget).toBeCloseTo(216.66, 1);
    expect(stats.moneyLeft).toBe(6500);
  });

  it('handles lending (gave) as an immediate reduction in moneyLeft, NOT as discretionary spentToday', () => {
    const config: BudgetConfig = {
      totalMoney: 5000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    // Lent ₹500 to friend on day 1
    const t1: Transaction = { 
      id: '1', 
      type: 'person', 
      amount: 500, 
      direction: 'gave', 
      date: '2026-08-01' 
    };

    const day1Stats = calculateBudget(config, [t1], '2026-08-01');
    expect(day1Stats.spentToday).toBe(0); // MUST be 0! Not a discretionary expense
    expect(day1Stats.moneyLeft).toBe(4500); // 5000 - 500
    expect(day1Stats.todaysAvailable).toBe(150); // Base daily = 4500 / 30 = 150

    // Day 2: friend repaid ₹300.
    // The settlement transaction directly affects the budget without needing a manual Income transaction.
    const t2: Transaction = { 
      id: '2', 
      type: 'person', 
      amount: 300, 
      direction: 'took', 
      isSettlement: true, 
      date: '2026-08-02' 
    };

    const day2Stats = calculateBudget(config, [t1, t2], '2026-08-02');
    // Money left = 5000 - 500 (lent) + 300 (settlement) = 4800
    expect(day2Stats.moneyLeft).toBe(4800);
  });

  it('calculates overspent status correctly', () => {
    const config: BudgetConfig = {
      totalMoney: 3000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    // Base daily = 100/day. Spend 150 today -> overspent
    const t1: Transaction = { id: '1', type: 'expense', amount: 150, date: '2026-08-01' };
    const stats = calculateBudget(config, [t1], '2026-08-01');

    expect(stats.todaysAvailable).toBe(100);
    expect(stats.spentToday).toBe(150);
    expect(stats.isOverspent).toBe(true);
  });
});
