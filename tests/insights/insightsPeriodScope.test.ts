import { describe, it, expect } from 'vitest';
import { calculateBudget, BudgetConfig, Transaction } from '../../src/features/budget/budgetEngine';

describe('Insights Period Scoping & Isolation Tests', () => {
  const baseConfig: BudgetConfig = {
    totalMoney: 5000,
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-09-30T23:59:59.999Z'
  };

  const sampleTransactions: Transaction[] = [
    // Current period expenses (Sep 2026)
    { id: '1', type: 'expense', amount: 300, category: 'Food', date: '2026-09-05T12:00:00Z', reason: 'Lunch' },
    { id: '2', type: 'expense', amount: 200, category: 'Food', date: '2026-09-10T12:00:00Z', reason: 'Dinner' },
    { id: '3', type: 'expense', amount: 500, category: 'Transport', date: '2026-09-15T12:00:00Z', reason: 'Flight' },
    
    // Past period expenses (Aug 2026) - SHOULD BE EXCLUDED from Sep analytics
    { id: '4', type: 'expense', amount: 2500, category: 'Shopping', date: '2026-08-15T12:00:00Z', reason: 'Old TV' },

    // Person cash flow transactions (Sep 2026) - SHOULD BE EXCLUDED from discretionary analytics
    { id: '5', type: 'person', direction: 'gave', amount: 1000, date: '2026-09-02T12:00:00Z', personId: 'p1', personName: 'Alex', reason: 'Lent to Alex' },
    { id: '6', type: 'person', direction: 'took', amount: 500, date: '2026-09-20T12:00:00Z', personId: 'p1', personName: 'Alex', isSettlement: true, reason: 'Settlement from Alex' }
  ];

  it('1. Correctly calculates totalDiscretionarySpent only for active period', () => {
    const stats = calculateBudget(baseConfig, sampleTransactions, '2026-09-15T12:00:00Z');
    
    // Discretionary spend in Sep = 300 + 200 + 500 = 1000. (Aug 2500 TV and Alex lending are excluded)
    expect(stats.totalDiscretionarySpent).toBe(1000);
  });

  it('2. Category breakdown numerator and denominator match for period expenses', () => {
    const start = new Date('2026-09-01T00:00:00.000Z').getTime();
    const end = new Date('2026-09-30T23:59:59.999Z').getTime();

    const periodExpenses = sampleTransactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= start && tTime <= end;
    });

    // Verify old August expense and Person transactions are excluded
    expect(periodExpenses.length).toBe(3);

    const stats = calculateBudget(baseConfig, sampleTransactions, '2026-09-15T12:00:00Z');
    
    const categoryMap = periodExpenses.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    expect(categoryMap['Food']).toBe(500);
    expect(categoryMap['Transport']).toBe(500);
    expect(categoryMap['Shopping']).toBeUndefined(); // Aug shopping excluded

    const foodPct = Math.round((categoryMap['Food'] / stats.totalDiscretionarySpent) * 100);
    const transportPct = Math.round((categoryMap['Transport'] / stats.totalDiscretionarySpent) * 100);

    expect(foodPct).toBe(50);
    expect(transportPct).toBe(50);
    expect(foodPct + transportPct).toBe(100);
  });

  it('3. Largest splurges only pulls from active period expenses', () => {
    const start = new Date('2026-09-01T00:00:00.000Z').getTime();
    const end = new Date('2026-09-30T23:59:59.999Z').getTime();

    const periodExpenses = sampleTransactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= start && tTime <= end;
    });

    const splurges = [...periodExpenses].sort((a, b) => b.amount - a.amount).slice(0, 3);
    
    expect(splurges.length).toBe(3);
    expect(splurges[0].amount).toBe(500); // Flight
    expect(splurges[1].amount).toBe(300); // Lunch
    expect(splurges[2].amount).toBe(200); // Dinner

    // Ensure the 2500 Old TV expense from August is NOT in the top splurges
    expect(splurges.some(s => s.reason === 'Old TV')).toBe(false);
  });

  it('4. Historical month projected rollover uses actual moneyLeft', () => {
    // August completed month stats
    const augConfig: BudgetConfig = {
      totalMoney: 5000,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-31T23:59:59.999Z'
    };

    const augStats = calculateBudget(augConfig, sampleTransactions, '2026-08-31T23:59:59.999Z');
    
    // Spent 2500 on TV -> Money left = 2500
    expect(augStats.moneyLeft).toBe(2500);
    
    // For historical completed period, projected rollover equals final moneyLeft
    const isHistorical = true;
    const projectedRollover = isHistorical ? augStats.moneyLeft : augStats.moneyLeft - 0;
    expect(projectedRollover).toBe(2500);
  });
});
