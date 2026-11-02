import { describe, it, expect } from 'vitest';
import { calculateGroupSummary, simplifyDebts, formatWhatsAppSummary, toPaise, type Group, type MemberBalance } from '../../src/utils/groupEngine';

// ---------------------------------------------------------------------------
// Helper: build a minimal valid Group
// ---------------------------------------------------------------------------
function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g1',
    name: 'Test Group',
    members: [
      { id: 'm1', name: 'You', isUser: true },
      { id: 'm2', name: 'Aman', isUser: false },
      { id: 'm3', name: 'Rohit', isUser: false },
    ],
    expenses: [],
    transfers: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// EXISTING TESTS (unchanged, all pass)
// ---------------------------------------------------------------------------

describe('groupEngine', () => {
  it('calculates equal split accurately among 3 members', () => {
    const group: Group = {
      id: 'g1',
      name: 'Goa Trip',
      members: [
        { id: 'm1', name: 'You', isUser: true },
        { id: 'm2', name: 'Aman', isUser: false },
        { id: 'm3', name: 'Rohit', isUser: false },
      ],
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Hotel Room',
          amount: 3000,
          payerId: 'm1', // You paid
          date: '2026-11-01',
          splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 1000 },
            { memberId: 'm2', amount: 1000 },
            { memberId: 'm3', amount: 1000 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = calculateGroupSummary(group);
    expect(summary.totalSpent).toBe(3000);
    expect(summary.userPaid).toBe(3000);
    expect(summary.userShare).toBe(1000);
    expect(summary.userNet).toBe(2000); // You should get back 2000

    const aman = summary.balances.find((b) => b.memberId === 'm2')!;
    expect(aman.totalPaid).toBe(0);
    expect(aman.totalShare).toBe(1000);
    expect(aman.netBalance).toBe(-1000); // Aman owes 1000

    expect(summary.settlements).toHaveLength(2);
    expect(summary.settlements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromName: 'Aman', toName: 'You', amount: 1000 }),
        expect.objectContaining({ fromName: 'Rohit', toName: 'You', amount: 1000 }),
      ])
    );
  });

  it('adjusts balances when a direct cash transfer is made', () => {
    const group: Group = {
      id: 'g1',
      name: 'Dinner',
      members: [
        { id: 'm1', name: 'You', isUser: true },
        { id: 'm2', name: 'Aman', isUser: false },
      ],
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Food',
          amount: 1000,
          payerId: 'm1',
          date: '2026-11-01',
          splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 500 },
            { memberId: 'm2', amount: 500 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [
        {
          id: 't1',
          groupId: 'g1',
          fromMemberId: 'm2',
          toMemberId: 'm1',
          amount: 500, // Aman paid You 500 back
          date: '2026-11-02',
          createdAt: new Date().toISOString(),
        },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = calculateGroupSummary(group);
    expect(summary.userNet).toBe(0);
    const aman = summary.balances.find((b) => b.memberId === 'm2')!;
    expect(aman.netBalance).toBe(0);
    expect(summary.settlements).toHaveLength(0);
  });

  it('simplifies debts across multiple members to minimize transfers', () => {
    // A owes B 100, B owes C 100 -> A should just pay C 100
    const balances: MemberBalance[] = [
      { memberId: 'A', name: 'Alice', isUser: false, totalPaid: 0, totalShare: 100, netBalance: -100 },
      { memberId: 'B', name: 'Bob', isUser: false, totalPaid: 100, totalShare: 100, netBalance: 0 },
      { memberId: 'C', name: 'Charlie', isUser: false, totalPaid: 100, totalShare: 0, netBalance: 100 },
    ];

    const simplified = simplifyDebts(balances);
    expect(simplified).toHaveLength(1);
    expect(simplified[0]).toEqual({
      fromMemberId: 'A',
      fromName: 'Alice',
      toMemberId: 'C',
      toName: 'Charlie',
      amount: 100,
    });
  });

  it('generates a formatted WhatsApp summary string', () => {
    const group: Group = {
      id: 'g1',
      name: 'Weekend Trip',
      emoji: '🏖️',
      members: [
        { id: 'm1', name: 'You', isUser: true },
        { id: 'm2', name: 'Rahul', isUser: false },
      ],
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Cab',
          amount: 600,
          payerId: 'm1',
          date: '2026-11-01',
          splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 300 },
            { memberId: 'm2', amount: 300 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const text = formatWhatsAppSummary(group, '₹');
    expect(text).toContain('Weekend Trip');
    expect(text).toContain('*Total Group Spend:* ₹600');
    expect(text).toContain('Rahul');
    expect(text).toContain('*Rahul* ➡️ *You*: ₹300');
  });

  // ---------------------------------------------------------------------------
  // NEW TESTS — Edge cases & deeper coverage
  // ---------------------------------------------------------------------------

  it('returns all-zero summary for a group with no expenses or transfers', () => {
    const group = makeGroup();
    const summary = calculateGroupSummary(group);
    expect(summary.totalSpent).toBe(0);
    expect(summary.userPaid).toBe(0);
    expect(summary.userShare).toBe(0);
    expect(summary.userNet).toBe(0);
    expect(summary.settlements).toHaveLength(0);
    expect(summary.balances).toHaveLength(3);
    summary.balances.forEach((b) => {
      expect(b.netBalance).toBe(0);
      expect(b.totalPaid).toBe(0);
      expect(b.totalShare).toBe(0);
    });
  });

  it('handles a member excluded from an expense split (not in splits array)', () => {
    // Expense of 600 split only between m1 and m2; m3 is excluded
    const group = makeGroup({
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Taxi (m3 took own cab)',
          amount: 600,
          payerId: 'm1',
          date: '2026-11-01',
          splitType: 'equal',
          // m3 NOT included
          splits: [
            { memberId: 'm1', amount: 300 },
            { memberId: 'm2', amount: 300 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const summary = calculateGroupSummary(group);
    expect(summary.totalSpent).toBe(600);

    const rohit = summary.balances.find((b) => b.memberId === 'm3')!;
    // Rohit paid nothing and owes nothing — clean
    expect(rohit.totalPaid).toBe(0);
    expect(rohit.totalShare).toBe(0);
    expect(rohit.netBalance).toBe(0);

    // Only Aman owes You
    expect(summary.settlements).toHaveLength(1);
    expect(summary.settlements[0]).toMatchObject({ fromName: 'Aman', toName: 'You', amount: 300 });
  });

  it('handles non-divisible equal split amounts correctly (remainder math)', () => {
    // ₹100 split among 3 people → 33.33 each but must sum to 100
    // Engine receives pre-computed splits from the modal; we test that the engine
    // correctly handles the rounded values and does not drift
    const baseShare = Math.floor((100 / 3) * 100) / 100; // 33.33
    const remainder = Math.round((100 - baseShare * 3) * 100) / 100; // 0.01

    const group = makeGroup({
      members: [
        { id: 'm1', name: 'You', isUser: true },
        { id: 'm2', name: 'Aman', isUser: false },
        { id: 'm3', name: 'Rohit', isUser: false },
      ],
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Snacks',
          amount: 100,
          payerId: 'm1',
          date: '2026-11-01',
          splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: Math.round((baseShare + remainder) * 100) / 100 }, // 33.34 absorbs remainder
            { memberId: 'm2', amount: baseShare }, // 33.33
            { memberId: 'm3', amount: baseShare }, // 33.33
          ],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const summary = calculateGroupSummary(group);
    expect(summary.totalSpent).toBe(100);
    // userNet = paid (100) - share (33.34) = 66.66
    expect(summary.userNet).toBeCloseTo(66.66, 1);
    // Both Aman and Rohit owe 33.33
    const amanDebt = summary.settlements.find((s) => s.fromName === 'Aman');
    const rohitDebt = summary.settlements.find((s) => s.fromName === 'Rohit');
    expect(amanDebt?.amount).toBeCloseTo(33.33, 1);
    expect(rohitDebt?.amount).toBeCloseTo(33.33, 1);
  });

  it('handles complex multi-creditor, multi-debtor settlement simplification', () => {
    // 4 people: Alice & Bob each owe 500; Charlie & Dave are each owed 500
    const balances: MemberBalance[] = [
      { memberId: 'A', name: 'Alice', isUser: false, totalPaid: 0, totalShare: 500, netBalance: -500 },
      { memberId: 'B', name: 'Bob', isUser: false, totalPaid: 0, totalShare: 500, netBalance: -500 },
      { memberId: 'C', name: 'Charlie', isUser: false, totalPaid: 500, totalShare: 0, netBalance: 500 },
      { memberId: 'D', name: 'Dave', isUser: false, totalPaid: 500, totalShare: 0, netBalance: 500 },
    ];

    const settlements = simplifyDebts(balances);
    // Optimally 2 transfers: Alice→Charlie 500, Bob→Dave 500 (or equivalent)
    expect(settlements).toHaveLength(2);
    const total = settlements.reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(1000); // Total debt settled
    // All fromMembers are debtors
    settlements.forEach((s) => {
      expect(['Alice', 'Bob']).toContain(s.fromName);
      expect(['Charlie', 'Dave']).toContain(s.toName);
    });
  });

  it('returns zero settlements for a group where all members are already balanced', () => {
    // Everyone paid their exact share
    const group = makeGroup({
      expenses: [
        {
          id: 'e1',
          groupId: 'g1',
          description: 'Three-way dinner',
          amount: 3000,
          payerId: 'm1',
          date: '2026-11-01',
          splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 1000 },
            { memberId: 'm2', amount: 1000 },
            { memberId: 'm3', amount: 1000 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [
        // Both Aman and Rohit have paid You back
        {
          id: 't1', groupId: 'g1',
          fromMemberId: 'm2', toMemberId: 'm1',
          amount: 1000, date: '2026-11-02',
          createdAt: new Date().toISOString(),
        },
        {
          id: 't2', groupId: 'g1',
          fromMemberId: 'm3', toMemberId: 'm1',
          amount: 1000, date: '2026-11-02',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const summary = calculateGroupSummary(group);
    expect(summary.userNet).toBe(0);
    expect(summary.settlements).toHaveLength(0);
  });

  it('generates "All settled up" WhatsApp message when there are no pending debts', () => {
    const group = makeGroup({
      members: [
        { id: 'm1', name: 'You', isUser: true },
        { id: 'm2', name: 'Priya', isUser: false },
      ],
      expenses: [
        {
          id: 'e1', groupId: 'g1',
          description: 'Lunch',
          amount: 400, payerId: 'm1',
          date: '2026-11-01', splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 200 },
            { memberId: 'm2', amount: 200 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [
        {
          id: 't1', groupId: 'g1',
          fromMemberId: 'm2', toMemberId: 'm1',
          amount: 200, date: '2026-11-02',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const text = formatWhatsAppSummary(group, '₹');
    expect(text).toContain('All settled up');
    expect(text).not.toContain('➡️'); // No pending settlement arrows
  });

  it('correctly attributes userNet as 0 when there is no isUser member', () => {
    // Edge: group has no member with isUser: true (shouldn't happen in production but engine must not crash)
    const group: Group = {
      id: 'gx',
      name: 'Headless Group',
      members: [
        { id: 'm1', name: 'Alice', isUser: false },
        { id: 'm2', name: 'Bob', isUser: false },
      ],
      expenses: [
        {
          id: 'e1', groupId: 'gx',
          description: 'Expense',
          amount: 500, payerId: 'm1',
          date: '2026-11-01', splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 250 },
            { memberId: 'm2', amount: 250 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = calculateGroupSummary(group);
    // Engine should not throw, and userNet/userPaid/userShare should be 0
    expect(summary.userNet).toBe(0);
    expect(summary.userPaid).toBe(0);
    expect(summary.userShare).toBe(0);
    // But total and balances should still be computed
    expect(summary.totalSpent).toBe(500);
    expect(summary.balances).toHaveLength(2);
  });

  it('ensures transfers do not corrupt totalPaid or totalShare (Accounting Inversion Guard)', () => {
    // Alice paid 1000 for dinner split equally with Bob
    // Bob transfers 500 to Alice
    // Alice's totalPaid must stay 1000, totalShare must stay 500 (NOT 1000!)
    const group = makeGroup({
      members: [
        { id: 'm1', name: 'Alice', isUser: true },
        { id: 'm2', name: 'Bob', isUser: false },
      ],
      expenses: [
        {
          id: 'e1', groupId: 'g1',
          description: 'Dinner',
          amount: 1000, payerId: 'm1',
          date: '2026-11-01', splitType: 'equal',
          splits: [
            { memberId: 'm1', amount: 500 },
            { memberId: 'm2', amount: 500 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      transfers: [
        {
          id: 't1', groupId: 'g1',
          fromMemberId: 'm2', toMemberId: 'm1',
          amount: 500, date: '2026-11-02',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const summary = calculateGroupSummary(group);
    const alice = summary.balances.find((b) => b.memberId === 'm1')!;
    const bob = summary.balances.find((b) => b.memberId === 'm2')!;

    // Net balance is 0 for both (settled)
    expect(alice.netBalance).toBe(0);
    expect(bob.netBalance).toBe(0);

    // CRITICAL: Alice's totalShare must be 500, NOT 1000!
    expect(alice.totalPaid).toBe(1000);
    expect(alice.totalShare).toBe(500);

    // Bob's totalPaid must be 0 (transfers are repayments, not expense payments), totalShare is 500
    expect(bob.totalPaid).toBe(0);
    expect(bob.totalShare).toBe(500);
  });

  it('toPaise parser rejects invalid, negative, scientific notation, and sub-cent inputs', () => {
    expect(toPaise('-500')).toBeNull();
    expect(toPaise('0')).toBeNull();
    expect(toPaise('1e20')).toBeNull();
    expect(toPaise('Infinity')).toBeNull();
    expect(toPaise('NaN')).toBeNull();
    expect(toPaise('0.001')).toBeNull();
    expect(toPaise('abc')).toBeNull();

    // Valid inputs
    expect(toPaise('0.01')).toBe(1);
    expect(toPaise('100')).toBe(10000);
    expect(toPaise('99.95')).toBe(9995);
    expect(toPaise('0', { allowZero: true })).toBe(0);
  });

  it('simplifyDebts includes exact 1-paisa settlement without omitting it', () => {
    const balances: MemberBalance[] = [
      { memberId: 'm1', name: 'Alice', isUser: false, totalPaid: 0, totalShare: 0.01, netBalance: -0.01 },
      { memberId: 'm2', name: 'Bob', isUser: false, totalPaid: 0.01, totalShare: 0, netBalance: 0.01 },
    ];

    const settlements = simplifyDebts(balances);
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({
      fromName: 'Alice',
      toName: 'Bob',
      amount: 0.01,
    });
  });

  it('nets circular debts correctly without loop or leftover', () => {
    // A owes B 100, B owes C 100, C owes A 50
    // Net: A = -50, B = 0, C = +50
    const balances: MemberBalance[] = [
      { memberId: 'A', name: 'Alice', isUser: false, totalPaid: 0, totalShare: 50, netBalance: -50 },
      { memberId: 'B', name: 'Bob', isUser: false, totalPaid: 100, totalShare: 100, netBalance: 0 },
      { memberId: 'C', name: 'Charlie', isUser: false, totalPaid: 100, totalShare: 50, netBalance: 50 },
    ];

    const result = simplifyDebts(balances);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fromMemberId: 'A',
      toMemberId: 'C',
      amount: 50,
    });
  });
});
