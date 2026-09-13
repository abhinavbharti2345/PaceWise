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

    // Day 4 (Day 3 a bill is paid, forward-looking over remaining 28 days)
    const t2: Transaction = { id: '2', type: 'bill', amount: 1000, date: '2026-08-03' };
    const day4Stats = calculateBudget(config, [t1, t2], '2026-08-04');
    
    // Day 3 bill of 1000 has 28 remaining days (Aug 3..30) -> -35.71/day
    // Base daily from Aug 3 onward = 200 - 35.714 = 164.29
    // Carry forward = Day 1 saved (100) + Day 2 saved (200) + Day 3 saved (164.29) = 464.29
    expect(day4Stats.baseDailyBudget).toBeCloseTo(164.29, 1);
    expect(day4Stats.carryForward).toBeCloseTo(464.29, 1);
    expect(day4Stats.todaysAvailable).toBeCloseTo(628.57, 1);
    expect(day4Stats.moneyLeft).toBe(4900);
  });

  it('preserves past carry-forward when a bill is paid mid-month (no retroactive penalty)', () => {
    const config: BudgetConfig = {
      totalMoney: 3000,
      startDate: '2026-08-01',
      endDate: '2026-08-30'
    };

    // Day 1..10 no spending -> saved 10 days * 100 = 1000 carry forward into Day 11
    const day11BeforeBill = calculateBudget(config, [], '2026-08-11');
    expect(day11BeforeBill.carryForward).toBe(1000);
    expect(day11BeforeBill.baseDailyBudget).toBe(100);
    expect(day11BeforeBill.todaysAvailable).toBe(1100);

    // Pay bill of 200 on Day 11 (20 days remaining: Day 11..30)
    const billTx: Transaction = { id: 'b1', type: 'bill', amount: 200, date: '2026-08-11' };
    const day11AfterBill = calculateBudget(config, [billTx], '2026-08-11');

    // Past 10 days carry forward must remain exactly 1000!
    expect(day11AfterBill.carryForward).toBe(1000);
    // Base for remaining 20 days drops by 200 / 20 = 10 -> new base = 90
    expect(day11AfterBill.baseDailyBudget).toBe(90);
    // Today's available = 90 + 1000 = 1090 (drops by only 10, not penalized for past 10 days!)
    expect(day11AfterBill.todaysAvailable).toBe(1090);
    // Money left drops by the exact 200
    expect(day11AfterBill.moneyLeft).toBe(2800);
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

    it('Scenario 1: Lend ₹50 today - adjusts effectiveTotalBudget and daily pace, NOT spentToday', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'gave', amount: 50, date: '2026-08-01', personId: 'p1' };
      const stats = calculateBudget(config, [t1], '2026-08-01');

      // Effective total = 5000 - 50 = 4950. Base daily = 4950 / 30 = 165
      expect(stats.effectiveTotalBudget).toBe(4950);
      expect(stats.moneyLeft).toBe(4950);
      expect(stats.todaysAvailable).toBe(165);
      
      // Spent today (discretionary) MUST remain 0!
      expect(stats.spentToday).toBe(0);
      expect(stats.totalDiscretionarySpent).toBe(0);
    });

    it('Scenario 2: Borrow ₹50 today - increases effectiveTotalBudget and daily pace, NOT spentToday', () => {
      const t1: Transaction = { id: 't1', type: 'person', direction: 'took', amount: 50, date: '2026-08-01', personId: 'p1' };
      const stats = calculateBudget(config, [t1], '2026-08-01');

      // Effective total = 5000 + 50 = 5050. Base daily = 5050 / 30 = 168.33
      expect(stats.effectiveTotalBudget).toBe(5050);
      expect(stats.moneyLeft).toBe(5050);
      expect(stats.todaysAvailable).toBeCloseTo(168.33, 1);
      
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
      expect(stats.effectiveTotalBudget).toBe(5500);
      expect(stats.moneyLeft).toBe(5500);
      
      // Base daily = 5500 / 30 = 183.33...
      // Allowance up to yesterday (daysPassed 4) = 733.33...
      // Todays Available = 183.33... + 733.33... = 916.66...
      expect(stats.todaysAvailable).toBeCloseTo(916.66, 1);
    });
  });
});
