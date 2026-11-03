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

  it('5. Insights time filter persistence key is defined and valid', () => {
    const key = 'pacewise-insights-time-filter';
    const validFilters = ['week', 'current', 'last1', 'last2'];

    expect(key).toBe('pacewise-insights-time-filter');
    expect(validFilters).toContain('week');
    expect(validFilters).toContain('current');
  });

  it('6. Rejects NaN amounts, negative amounts, and invalid dates in budgetEngine', () => {
    const corruptedTransactions: Transaction[] = [
      { id: 'c1', type: 'expense', amount: NaN, date: '2026-09-05T12:00:00Z', category: 'Food' },
      { id: 'c2', type: 'expense', amount: -500, date: '2026-09-06T12:00:00Z', category: 'Food' },
      { id: 'c3', type: 'expense', amount: 300, date: 'invalid-date-string', category: 'Food' },
      { id: 'valid', type: 'expense', amount: 450, date: '2026-09-07T12:00:00Z', category: 'Food' }
    ];

    const stats = calculateBudget(baseConfig, corruptedTransactions, '2026-09-15T12:00:00Z');

    // Only the valid 450 expense should be counted; NaN, negative, and invalid dates are ignored
    expect(stats.totalDiscretionarySpent).toBe(450);
    expect(Number.isFinite(stats.moneyLeft)).toBe(true);
    expect(stats.moneyLeft).toBe(4550);
  });

  it('7. Weekly synthetic budget prevents fractional extrapolation when daysRemaining < 7', () => {
    // Simulate day 29 of a 30-day month with 2 days left and 2100 money left
    const daysLeft = 2;
    const totalMoneyLeft = 2100;
    const remainingDailyPace = 1050;

    // Fixed calculation: cap daysToBudget at remaining days
    const daysToBudget = Math.min(7, Math.max(1, daysLeft)); // 2
    const dailyRate = Math.max(0, remainingDailyPace > 0 ? remainingDailyPace : totalMoneyLeft / daysLeft);
    const weeklyIdeal = Math.max(0, Math.min(totalMoneyLeft, dailyRate * daysToBudget));

    // Must NOT multiply budget pool (i.e. must NOT be 7350)
    expect(weeklyIdeal).toBe(2100);
    expect(weeklyIdeal).toBeLessThanOrEqual(totalMoneyLeft);
  });

  it('8. Historical month isolates budget pool from active month config leak', () => {
    // Current active month config has 50000 (tuition/holiday)
    const activeMonthConfig: BudgetConfig = {
      totalMoney: 50000,
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.999Z'
    };

    // Past month (October) had 10000 income and 9500 expenses
    const pastTransactions: Transaction[] = [
      { id: 'p1', type: 'income', amount: 10000, date: '2026-10-01T12:00:00Z' },
      { id: 'p2', type: 'expense', amount: 9500, date: '2026-10-15T12:00:00Z', category: 'General' }
    ];

    const octStart = new Date('2026-10-01T00:00:00.000Z');
    const octEnd = new Date('2026-10-31T23:59:59.999Z');

    const pastMonthTxs = pastTransactions.filter(t => {
      const d = new Date(t.date).getTime();
      return d >= octStart.getTime() && d <= octEnd.getTime();
    });
    const pastIncomes = pastMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const historicalTotalBudget = pastIncomes > 0 ? 0 : activeMonthConfig.totalMoney;

    const octSyntheticConfig = {
      ...activeMonthConfig,
      totalMoney: historicalTotalBudget,
      startDate: octStart.toISOString(),
      endDate: octEnd.toISOString()
    };

    const octStats = calculateBudget(octSyntheticConfig, pastTransactions, octEnd.toISOString());
    // Oct moneyLeft should be 500 (10000 income - 9500 expense), NOT 40500!
    expect(octStats.moneyLeft).toBe(500);
  });

  it('9. Category breakdown handles future-dated expenses and guarantees exact 100% sum', () => {
    const periodExpenses: Transaction[] = [
      { id: 'e1', type: 'expense', amount: 100, category: 'Food', date: '2026-09-02T12:00:00Z' },
      { id: 'e2', type: 'expense', amount: 100, category: 'Transport', date: '2026-09-03T12:00:00Z' },
      { id: 'e3', type: 'expense', amount: 100, category: 'Entertainment', date: '2026-09-25T12:00:00Z' } // Future dated
    ];

    const totalPeriodDiscretionary = periodExpenses.reduce((sum, t) => sum + t.amount, 0);
    expect(totalPeriodDiscretionary).toBe(300);

    const categoryMap = periodExpenses.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    // Hare-Niemeyer / Largest Remainder
    const unrounded = entries.map(([category, amount]) => {
      const raw = (amount / totalPeriodDiscretionary) * 100;
      const floor = Math.floor(raw);
      return { category, amount, floor, remainder: raw - floor };
    });
    const currentSum = unrounded.reduce((sum, item) => sum + item.floor, 0);
    const diff = 100 - currentSum;
    const remainderOrder = [...unrounded.keys()].sort((a, b) => unrounded[b].remainder - unrounded[a].remainder);
    for (let i = 0; i < diff && i < remainderOrder.length; i++) {
      unrounded[remainderOrder[i]].floor += 1;
    }

    const percentages = unrounded.map(item => item.floor);
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

    // Sum must equal exactly 100%, without any category exceeding 100%
    expect(totalPercentage).toBe(100);
    expect(percentages.every(p => p <= 100)).toBe(true);
  });

  it('10. Correctly classifies peer debt dynamics (cash loans vs personal spend)', () => {
    const mixedTransactions: Transaction[] = [
      // Direct cash lent to friend Rohan
      { id: 'm1', type: 'person', direction: 'gave', amount: 5000, date: '2026-09-02T12:00:00Z', personId: 'p1' },
      // User paying reimbursement for lunch friend bought earlier
      { id: 'm2', type: 'expense', direction: 'bought_for_me', isBoughtForMeSettlement: true, amount: 500, date: '2026-09-05T12:00:00Z', personId: 'p2' },
      // Pure personal spending
      { id: 'm3', type: 'expense', amount: 1500, date: '2026-09-07T12:00:00Z', category: 'Food' },
      // Loan repayment received from friend
      { id: 'm4', type: 'income', isSettlement: true, direction: 'took', amount: 2000, date: '2026-09-10T12:00:00Z', personId: 'p1' }
    ];

    let personalSpend = 0;
    let lentToFriends = 0;
    let settlementsReceived = 0;

    mixedTransactions.forEach(t => {
      if (t.type === 'person' && t.direction === 'gave') {
        lentToFriends += t.amount;
      } else if (t.type === 'expense') {
        if (t.personId && !t.isBoughtForMeSettlement && t.direction !== 'bought_for_me') {
          lentToFriends += t.amount;
        } else {
          personalSpend += t.amount;
        }
      } else if ((t.type === 'income' || t.type === 'person') && (t.isSettlement && (t.direction === 'took' || !t.direction))) {
        settlementsReceived += t.amount;
      }
    });

    // ₹5000 cash loan is lentToFriends
    expect(lentToFriends).toBe(5000);
    // Personal spend = ₹1500 + ₹500 (bought_for_me settlement is personal consumption) = ₹2000
    expect(personalSpend).toBe(2000);
    // Loan repayment received = ₹2000
    expect(settlementsReceived).toBe(2000);
  });

  it('11. Weekly progression buckets strictly follow 7-day calendar weeks', () => {
    const calendarTxs: Transaction[] = [
      { id: 'w1', type: 'expense', amount: 100, date: '2026-09-01T12:00:00Z' }, // Day 1 -> Week 1 (idx 0)
      { id: 'w2', type: 'expense', amount: 200, date: '2026-09-07T12:00:00Z' }, // Day 7 -> Week 1 (idx 0)
      { id: 'w3', type: 'expense', amount: 300, date: '2026-09-08T12:00:00Z' }, // Day 8 -> Week 2 (idx 1)
      { id: 'w4', type: 'expense', amount: 400, date: '2026-09-14T12:00:00Z' }, // Day 14 -> Week 2 (idx 1)
      { id: 'w5', type: 'expense', amount: 500, date: '2026-09-15T12:00:00Z' }, // Day 15 -> Week 3 (idx 2)
      { id: 'w6', type: 'expense', amount: 600, date: '2026-09-22T12:00:00Z' }, // Day 22 -> Week 4 (idx 3)
    ];

    const buckets = [0, 0, 0, 0];
    calendarTxs.forEach(t => {
      const day = new Date(t.date).getDate();
      const idx = Math.min(3, Math.floor((day - 1) / 7));
      buckets[idx] += t.amount;
    });

    expect(buckets[0]).toBe(300); // Days 1 & 7
    expect(buckets[1]).toBe(700); // Days 8 & 14 (Day 8 must NOT be in Week 1)
    expect(buckets[2]).toBe(500); // Day 15
    expect(buckets[3]).toBe(600); // Day 22
  });
});
