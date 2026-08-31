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
    
    expect(day1Stats.baseDailyBudget).toBe(200);
    expect(day1Stats.carryForward).toBe(0);
    expect(day1Stats.todaysAvailable).toBe(200);
    expect(day1Stats.moneyLeft).toBe(5900);

    // Day 2
    const day2Stats = calculateBudget(config, [t1], '2026-08-02');
    expect(day2Stats.carryForward).toBe(100);
    expect(day2Stats.todaysAvailable).toBe(300);
    expect(day2Stats.moneyLeft).toBe(5900);

    // Day 4 (Day 3 a bill is paid, but we are evaluating on Day 4)
    const t2: Transaction = { id: '2', type: 'bill', amount: 1000, date: '2026-08-03' };
    const day4Stats = calculateBudget(config, [t1, t2], '2026-08-04');
    
    expect(day4Stats.baseDailyBudget).toBeCloseTo(166.66, 1);
    expect(day4Stats.carryForward).toBeCloseTo(400, 1);
    expect(day4Stats.todaysAvailable).toBeCloseTo(566.66, 1);
    expect(day4Stats.moneyLeft).toBe(4900);
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
      expect(stats.dailyStats[0].cumulativeIdealSpent).toBe(100);
      expect(stats.dailyStats[0].idealRemaining).toBe(200);
      expect(stats.dailyStats[0].actualRemaining).toBe(250);

      // Day 2 (Today)
      expect(stats.dailyStats[1].dayIndex).toBe(2);
      expect(stats.dailyStats[1].isFuture).toBe(false);
      expect(stats.dailyStats[1].discretionarySpent).toBe(20);
      expect(stats.dailyStats[1].cumulativeDiscretionarySpent).toBe(70);
      expect(stats.dailyStats[1].cumulativeIdealSpent).toBe(200);
      expect(stats.dailyStats[1].idealRemaining).toBe(100);
      expect(stats.dailyStats[1].actualRemaining).toBe(230);
    });
  });

  describe('Person Transactions & Settlements Cash Flow', () => {
    const config: BudgetConfig = {
      totalMoney: 5000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    it('Scenario 1: Lend ₹50 today - reduces moneyLeft and todaysAvailable immediately, NOT spentToday', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'gave', amount: 50, date: '2026-08-01', personId: 'p1' };
      const stats = calculateBudget(config, [t1], '2026-08-01');

      // Base daily = 5000 / 30 = 166.66...
      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(4950);
      
      // Todays available should be approx 116.66 (166.66 - 50)
      expect(stats.todaysAvailable).toBeCloseTo(166.66 - 50, 1);
      
      // Spent today (discretionary) MUST remain 0!
      expect(stats.spentToday).toBe(0);
      expect(stats.totalDiscretionarySpent).toBe(0);
    });

    it('Scenario 2: Borrow ₹50 today - increases moneyLeft and todaysAvailable immediately, NOT spentToday', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'took', amount: 50, date: '2026-08-01', personId: 'p1' };
      const stats = calculateBudget(config, [t1], '2026-08-01');

      expect(stats.effectiveTotalBudget).toBe(5000); // Does NOT increase effectiveTotalBudget (no spreading)
      expect(stats.moneyLeft).toBe(5050);
      
      // Todays available should be approx 216.66 (166.66 + 50)
      expect(stats.todaysAvailable).toBeCloseTo(166.66 + 50, 1);
      
      expect(stats.spentToday).toBe(0);
    });

    it('Scenario 3 & 4: Lend ₹50 -> settle ₹50 (perfect reversal)', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'gave', amount: 50, date: '2026-08-01', personId: 'p1' }; // Lend
      const t2: Transaction = { id: 't2', type: 'person', direction: 'took', amount: 50, date: '2026-08-02', personId: 'p1', isSettlement: true }; // Repay
      
      const stats = calculateBudget(config, [t1, t2], '2026-08-02');

      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(5000); // Perfectly restored
      
      // Day 2 (Days passed = 1, so 2 days of allowance)
      // Base daily = 166.66... -> total allowance = 333.33...
      // Net person cash flow = 0
      expect(stats.todaysAvailable).toBeCloseTo(333.33, 1);
      
      expect(stats.spentToday).toBe(0);
      expect(stats.totalDiscretionarySpent).toBe(0);
    });

    it('Scenario 9: Previous-month IOU transactions (ignored from current budget)', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'gave', amount: 500, date: '2026-07-15', personId: 'p1' }; // Previous month lend
      const stats = calculateBudget(config, [t1], '2026-08-01');

      // The transaction falls outside [Aug 1, Aug 30], so it must be ignored
      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(5000);
      expect(stats.todaysAvailable).toBeCloseTo(166.66, 1);
    });

    it('Scenario 10: Current-day IOU settlement of previous month debt', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'gave', amount: 500, date: '2026-07-15', personId: 'p1' }; // Previous month lend
      const t2: Transaction = { id: 't2', type: 'person', direction: 'took', amount: 500, date: '2026-08-05', personId: 'p1', isSettlement: true }; // Settle today
      
      // We evaluate on August 5 (Day 5, daysPassed = 4)
      const stats = calculateBudget(config, [t1, t2], '2026-08-05');

      // Only the August transaction (t2) is processed.
      // Received settlement = Cash Inflow = +500
      expect(stats.effectiveTotalBudget).toBe(5000);
      expect(stats.moneyLeft).toBe(5500);
      
      // Base daily = 166.66...
      // Allowance up to yesterday (daysPassed 4) = 666.66...
      // Carry forward = 666.66...
      // Todays Available = 166.66... + 666.66... + 500 = 1333.33...
      expect(stats.todaysAvailable).toBeCloseTo(1333.33, 1);
    });
  });
});
