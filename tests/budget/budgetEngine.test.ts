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

  describe('Progress Percentage Calculations (Bug Repro)', () => {
    it('calculates 100% when budget is full (5000 budget, 5000 remaining)', () => {
      const config = { totalMoney: 5000, startDate: '2026-08-01', endDate: '2026-08-31' };
      const stats = calculateBudget(config, [], '2026-08-01');
      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(5000);
      expect(stats.progressPercentage).toBe(100);
    });

    it('calculates 50% when half budget remains (5000 budget, 2500 remaining)', () => {
      const config = { totalMoney: 5000, startDate: '2026-08-01', endDate: '2026-08-31' };
      const transactions: Transaction[] = [{ id: '1', type: 'expense', amount: 2500, date: '2026-08-01' }];
      const stats = calculateBudget(config, transactions, '2026-08-01');
      expect(stats.moneyLeft).toBe(2500);
      expect(stats.progressPercentage).toBe(50);
    });

    it('calculates 0% when 0 remaining (5000 budget, 0 remaining)', () => {
      const config = { totalMoney: 5000, startDate: '2026-08-01', endDate: '2026-08-31' };
      const transactions: Transaction[] = [{ id: '1', type: 'expense', amount: 5000, date: '2026-08-01' }];
      const stats = calculateBudget(config, transactions, '2026-08-01');
      expect(stats.moneyLeft).toBe(0);
      expect(stats.progressPercentage).toBe(0);
    });

    it('handles 0 starting budget + 5000 income properly (no 500000% or NaN)', () => {
      const config = { totalMoney: 0, startDate: '2026-08-01', endDate: '2026-08-31' };
      const transactions: Transaction[] = [{ id: '1', type: 'income', amount: 5000, date: '2026-08-01' }];
      const stats = calculateBudget(config, transactions, '2026-08-01');
      
      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(5000);
      // Since they have 5000 out of a 5000 effective budget, they have 100% of their money remaining
      expect(stats.progressPercentage).toBe(100);
    });

    it('clamps to 0% for negative remaining money', () => {
      const config = { totalMoney: 1000, startDate: '2026-08-01', endDate: '2026-08-31' };
      const transactions: Transaction[] = [{ id: '1', type: 'expense', amount: 1500, date: '2026-08-01' }];
      const stats = calculateBudget(config, transactions, '2026-08-01');
      
      expect(stats.effectiveTotalBudget).toBe(1000);
      expect(stats.moneyLeft).toBe(-500); // the actual amount should correctly report negative
      expect(stats.progressPercentage).toBe(0); // the percentage must be clamped
    });

    it('clamps to 100% if for some edge case moneyLeft exceeds effective budget', () => {
      const config = { totalMoney: 0, startDate: '2026-08-01', endDate: '2026-08-31' };
      const stats = calculateBudget(config, [], '2026-08-01');
      expect(stats.effectiveTotalBudget).toBe(0);
      expect(stats.moneyLeft).toBe(0);
      expect(stats.progressPercentage).toBe(0);
    });
  });

  describe('dailyStats generation', () => {
    it('generates a correct array of daily stats for the budget period', () => {
      const config = { totalMoney: 300, startDate: '2026-08-01', endDate: '2026-08-03' };
      const transactions: Transaction[] = [
        { id: '1', type: 'expense', amount: 50, date: '2026-08-01' },
        { id: '2', type: 'expense', amount: 20, date: '2026-08-02' }
      ];
      const stats = calculateBudget(config, transactions, '2026-08-02');
      
      expect(stats.dailyStats.length).toBe(3); // 3 days total
      
      // Day 1
      expect(stats.dailyStats[0].dayIndex).toBe(1);
      expect(stats.dailyStats[0].isFuture).toBe(false);
      expect(stats.dailyStats[0].discretionarySpent).toBe(50);
      expect(stats.dailyStats[0].cumulativeDiscretionarySpent).toBe(50);
      expect(stats.dailyStats[0].cumulativeIdealSpent).toBe(100); // 300 / 3 * 1
      expect(stats.dailyStats[0].idealRemaining).toBe(200); // 300 - (100 * 1)
      expect(stats.dailyStats[0].actualRemaining).toBe(250); // 300 - 50

      // Day 2 (Today)
      expect(stats.dailyStats[1].dayIndex).toBe(2);
      expect(stats.dailyStats[1].isFuture).toBe(false);
      expect(stats.dailyStats[1].discretionarySpent).toBe(20);
      expect(stats.dailyStats[1].cumulativeDiscretionarySpent).toBe(70);
      expect(stats.dailyStats[1].cumulativeIdealSpent).toBe(200);
      expect(stats.dailyStats[1].idealRemaining).toBe(100); // 300 - (100 * 2)
      expect(stats.dailyStats[1].actualRemaining).toBe(230); // 300 - 50 - 20

      // Day 3 (Future)
      expect(stats.dailyStats[2].dayIndex).toBe(3);
      expect(stats.dailyStats[2].isFuture).toBe(true);
      expect(stats.dailyStats[2].discretionarySpent).toBe(0);
      expect(stats.dailyStats[2].cumulativeDiscretionarySpent).toBe(70);
      expect(stats.dailyStats[2].cumulativeIdealSpent).toBe(300);
      expect(stats.dailyStats[2].idealRemaining).toBe(0); // 300 - (100 * 3)
      expect(stats.dailyStats[2].actualRemaining).toBe(0); // Future day is 0
    });
  });

  describe('Borrowed Money Cash Flow Regression Tests', () => {
    it('increases available budget and moneyLeft when money is borrowed (direction: took)', () => {
      const config: BudgetConfig = {
        totalMoney: 5000,
        startDate: '2026-08-01',
        endDate: '2026-08-31'
      };

      const transactions: Transaction[] = [
        {
          id: 'b1',
          type: 'person',
          direction: 'took',
          amount: 1000,
          date: '2026-08-10',
          personId: 'p1',
          personName: 'Rahul'
        }
      ];

      const stats = calculateBudget(config, transactions, '2026-08-10');

      // Starting budget (5000) + borrowed money (1000) = 6000 effective budget
      expect(stats.effectiveTotalBudget).toBe(6000);
      expect(stats.moneyLeft).toBe(6000);
      // spentToday and totalDiscretionarySpent MUST remain 0
      expect(stats.spentToday).toBe(0);
      expect(stats.totalDiscretionarySpent).toBe(0);
    });
  });
});

