import { describe, it, expect } from 'vitest';
import { calculateBudget, BudgetConfig, Transaction } from '../../src/features/budget/budgetEngine';

describe('budgetEngine', () => {
  it('calculates properly for the PRD example: 6000 starting, 30 days, spend 100 on day 1, no spend day 2, 1000 bill on day 3', () => {
    const config: BudgetConfig = {
      totalMoney: 6000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    // Day 1
    const t1: Transaction = { id: '1', type: 'expense', amount: 100, date: '2026-08-01' };
    const day1Stats = calculateBudget(config, [t1], '2026-08-01');
    
    // Effective total = 6000
    // Total days = 30
    // Base daily = 200
    // Days passed (today is Day 1) = 0
    // Normal expenses up to yesterday = 0
    // Spent today = 100
    // Carry forward = 0 - 0 = 0
    // Todays Available = 200 + 0 = 200
    // Money Left = 6000 - 0 - 100 = 5900
    expect(day1Stats.baseDailyBudget).toBe(200);
    expect(day1Stats.carryForward).toBe(0);
    expect(day1Stats.todaysAvailable).toBe(200);
    expect(day1Stats.moneyLeft).toBe(5900);

    // Day 2
    const day2Stats = calculateBudget(config, [t1], '2026-08-02');
    // Days passed = 1
    // Normal exp up to yesterday = 100
    // Carry forward = (1 * 200) - 100 = 100
    // Todays Available = 200 + 100 = 300
    // Money Left = 6000 - 100 - 0 = 5900
    expect(day2Stats.carryForward).toBe(100);
    expect(day2Stats.todaysAvailable).toBe(300);
    expect(day2Stats.moneyLeft).toBe(5900);

    // Day 4 (Day 3 a bill is paid, but we are evaluating on Day 4)
    const t2: Transaction = { id: '2', type: 'bill', amount: 1000, date: '2026-08-03' };
    const day4Stats = calculateBudget(config, [t1, t2], '2026-08-04');
    
    // Effective total = 6000 - 1000 = 5000
    // Base daily = 5000 / 30 = 166.6666...
    // Days passed = 3
    // Allowance up to yesterday = 3 * 166.666... = 500
    // Expenses up to yesterday = 100
    // Carry forward = 500 - 100 = 400
    // Todays Available = 166.66... + 400 = 566.66...
    // Money Left = 5000 - 100 = 4900
    
    expect(day4Stats.baseDailyBudget).toBeCloseTo(166.66, 1);
    expect(day4Stats.carryForward).toBeCloseTo(400, 1);
    expect(day4Stats.todaysAvailable).toBeCloseTo(566.66, 1);
    expect(day4Stats.moneyLeft).toBe(4900);
  });

  it('handles historical transactions and person debts (Bug Repro)', () => {
    const config: BudgetConfig = {
      totalMoney: 5000,
      startDate: '2026-08-01',
      endDate: '2026-08-31'
    };

    const transactions: Transaction[] = [
      // A. Historical normal expense
      { id: 't1', type: 'expense', amount: 500, date: '2026-07-25' },
      
      // B. Historical person transaction (July: give Tejas 500)
      { id: 't2', type: 'person', direction: 'gave', amount: 500, date: '2026-07-28', personId: 'p1', personName: 'Tejas' },
      
      // C. Current-month person transaction (August 10: give Tejas 200)
      { id: 't3', type: 'person', direction: 'gave', amount: 200, date: '2026-08-10', personId: 'p1', personName: 'Tejas' },

      // E. Manual repayment (August: add Income 500)
      { id: 't4', type: 'income', amount: 500, date: '2026-08-15' },
    ];

    // Evaluate on August 20
    const stats = calculateBudget(config, transactions, '2026-08-20');

    // Expected moneyLeft calculation:
    // Base allowance = 5000 (starting)
    // + 500 (Income in Aug) = 5500 effective total budget.
    // - 200 (Current month person transaction in Aug)
    // = 5300
    
    // Note: The July expense (500) and July person transaction (500) must NOT reduce August's budget.
    
    expect(stats.effectiveTotalBudget).toBe(5500); // 5000 + 500
    expect(stats.moneyLeft).toBe(5300); // 5500 - 200
  });

  it('ignores settlements to prevent double counting (Bug Repro)', () => {
    const config: BudgetConfig = {
      totalMoney: 5000,
      startDate: '2026-08-01',
      endDate: '2026-08-31'
    };

    const transactions: Transaction[] = [
      // F. Debt settlement
      // User settles a debt, meaning they paid someone back. 
      // They also manually create an Expense for it.
      { id: 't1', type: 'expense', amount: 500, date: '2026-08-05' },
      { id: 't2', type: 'person', direction: 'gave', amount: 500, date: '2026-08-05', personId: 'p1', personName: 'Tejas', isSettlement: true },
      
      // User receives settlement.
      // They also manually create an Income for it.
      { id: 't3', type: 'income', amount: 200, date: '2026-08-06' },
      { id: 't4', type: 'person', direction: 'took', amount: 200, date: '2026-08-06', personId: 'p2', personName: 'Rahul', isSettlement: true },
    ];

    const stats = calculateBudget(config, transactions, '2026-08-10');

    // Expected:
    // effectiveTotalBudget = 5000 + 200 (manual income) = 5200.
    // moneyLeft = 5200 - 500 (manual expense) = 4700.
    // The isSettlement person transactions MUST be completely ignored to prevent double counting.
    expect(stats.effectiveTotalBudget).toBe(5200);
    expect(stats.moneyLeft).toBe(4700);
  });
});
