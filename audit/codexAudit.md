PaceWise Groups & Trips audit
Overall: Unsafe to ship as a financially reliable ledger until the critical data-integrity issues are fixed. There is no obvious script-injection path in the React rendering reviewed, and group records are separate from the personal budget store. But the current feature can accept imbalanced splits, hide historical balances after member removal, and accept amounts outside a safe currency range.

The locations below refer to the current repository. Proposed diffs are illustrative patches for the specific findings; the shared validation helpers they call must be added as shown.
🔴 P0 — Custom splits can create or destroy money
- Location: [AddGroupExpenseModal.tsx (line 151)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/AddGroupExpenseModal.tsx:151)
- Flaw: The form accepts a custom split when the difference from the expense total is at most ₹0.05. It rounds individual shares only after that check. Both behaviors can make the stored shares differ from the expense amount.
- Failure scenario: Enter ₹100.00 with shares totaling ₹99.96. The form accepts the ₹0.04 difference. The payer is credited ₹100.00, while members are debited ₹99.96; the group ends with a 4-paisa residual. A raw split total that passes the tolerance can also round to a different persisted total.
- Remediation diff: Compare integer paise after validating each share; persist those same checked values.
- if (Math.abs(customRemaining) > 0.05) {
+ const amountPaise = toPaise(amount);
+ const splitEntries = group.members.map((m) => [
+   m.id,
+   toPaise(customSplits[m.id] || '0', { allowZero: true }),
+ ] as const);
+ const validSplits = splitEntries.every(([, paise]) => paise !== null);
+ const splitTotal = splitEntries.reduce((sum, [, paise]) => sum + (paise ?? 0), 0);
+ if (amountPaise === null || !validSplits || splitTotal !== amountPaise) {
    setError('Split amounts must equal the expense total to the paisa.');
    return;
  }

- amount: Math.round((parseFloat(customSplits[m.id]) || 0) * 100) / 100,
+ amount: splitEntries.find(([id]) => id === m.id)![1]! / 100,
🔴 P0 — Removing a member hides their historical balances
- Location: [useGroupStore.ts (line 136)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:136), [groupEngine.ts (line 76)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts:76)
- Flaw: Member removal filters only members. Expenses and transfers keep their old IDs. The engine ignores references to IDs missing from the current member list, while totalSpent still includes the expense amount.
- Failure scenario: A member paid ₹100 and had a ₹50 share. Remove them. The summary no longer credits their payment or debits their share. Their transfer history is omitted in the same way. The group’s visible balance can change without a financial event.
- Remediation diff: Block removal while history exists. A future archive/reassignment feature can replace this guard.
       removeMember: (groupId, memberId) => {
         set((state) => ({
           groups: state.groups.map((g) => {
             if (g.id !== groupId) return g;
+            const hasHistory =
+              g.expenses.some((e) =>
+                e.payerId === memberId ||
+                e.splits.some((split) => split.memberId === memberId)
+              ) ||
+              g.transfers.some((t) =>
+                t.fromMemberId === memberId || t.toMemberId === memberId
+              );
+            if (hasHistory) return g;
             return {
The UI should explain why removal was blocked. The current store action returns no result, so consider changing it to return a success/failure value for that message.
🔴 P0 — Amount validation accepts unsafe values
- Location: [AddGroupExpenseModal.tsx (line 73)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/AddGroupExpenseModal.tsx:73), [AddGroupTransferModal.tsx (line 60)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/AddGroupTransferModal.tsx:60)
- Flaw: Amounts are parsed as floating-point numbers. Inputs use step="any" and no min; positive Infinity passes the <= 0 check. Sub-paisa values are accepted. Scientific notation is valid for number inputs.
- Failure scenario: 1e309 parses as Infinity and passes the current positivity check. 0.00001 is positive but cannot be represented in paise. Very large finite numbers such as 1e20 exceed safe integer precision for minor-unit calculations.
- Remediation diff: Parse to safe integer paise and reject unsupported precision and range. Apply in both modals and again inside store actions.
+function toPaise(
+  raw: string,
+  options: { allowZero?: boolean } = {}
+): number | null {
+  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
+  const amount = Number(raw);
+  const paise = Math.round(amount * 100);
+  if (!Number.isFinite(amount) || !Number.isSafeInteger(paise)) return null;
+  if (options.allowZero ? paise < 0 : paise <= 0) return null;
+  return paise;
+}
+
- const numAmount = parseFloat(amount) || 0;
+ const amountPaise = toPaise(amount);
+ const numAmount = amountPaise === null ? 0 : amountPaise / 100;
- step="any"
+ min="0.01"
+ step="0.01"
Native input attributes improve the UI but do not replace parser or store validation. Test the raw string with the parser before converting it to a number.
🔴 P0 — Store actions trust callers and permit invalid records
- Location: [useGroupStore.ts (line 150)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:150), [useGroupStore.ts (line 190)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:190)
- Flaw: addExpense and addTransfer write the payload without checking that amounts are finite, members exist, or splits sum to the expense.
- Failure scenario: Any future import, devtool, or other component can call addExpense directly with an unknown payer, a negative share, or an empty split. UI checks do not protect those callers.
- Remediation diff: Validate before constructing a record. The helper functions below should be shared with the engine and UI.
       addExpense: (groupId, data) => {
+        const group = get().groups.find((g) => g.id === groupId);
+        if (!group || !isValidExpense(group, data)) return '';
         const id = generateId();
       addTransfer: (groupId, data) => {
+        const group = get().groups.find((g) => g.id === groupId);
+        if (!group || !isValidTransfer(group, data)) return '';
         const id = generateId();
This requires adding get to the Zustand initializer: (set, get) => ({ ... }). Prefer returning a typed result such as { ok: false, error } over an empty string so UI callers can report failure.
🟡 P1 — Rounding and balance invariant are not strict for malformed records
- Location: [groupEngine.ts (line 62)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts:62), [groupEngine.ts (line 112)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts:112)
- Flaw: The engine accumulates money in IEEE-754 numbers and rounds only when constructing the returned balances. The simplifier then ignores balances within one paisa of zero.
- Failure scenario: 0.1 + 0.2 can produce a floating residue. More materially, malformed/custom shares can leave one or more paise residuals that the simplifier omits. Unknown member IDs are also ignored rather than rejected.
- Remediation: Store and calculate integer minor units end-to-end. Reject unknown IDs and invalid totals rather than returning a partial summary. Currency should be explicit if multi-currency groups are intended; currently the group has one currency symbol and records carry no currency or exchange rate.
- amount: number;
+ amountPaise: number;
- if (balancesMap[split.memberId]) {
-   balancesMap[split.memberId].totalShare += split.amount;
- }
+ const balance = balancesMap[split.memberId];
+ if (!balance) throw new Error(`Unknown split member: ${split.memberId}`);
+ balance.totalSharePaise += split.amountPaise;
The same validation should apply to payerId, fromMemberId, and toMemberId.
🟡 P1 — Debt simplification is greedy, not globally optimal
- Location: [groupEngine.ts (line 130)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts:130)
- Flaw: The implementation greedily matches largest debtors and creditors. It terminates on valid finite inputs and preserves net amounts, but it does not search for zero-sum subsets and therefore does not guarantee the fewest possible transfers.
- Failure scenario: Circular obligations are netted before simplification. For A owes B ₹100, B owes C ₹100, C owes A ₹50, balances become A −₹50, B ₹0, C +₹50: one suggested payment A→C. The cycle does not create an infinite loop or inverted direction. For other balance sets, greedy matching can use more transfers than a globally minimal partition.
- Remediation: Rename the comment and UI claim from “minimize” to “simplify” unless implementing a subset-based optimizer. Avoid promising optimality. Keep tests asserting net settlement correctness and termination.
- * Greedily matches the largest debtor with the largest creditor
- * to minimize total number of settlement transfers.
+ * Greedily matches debtors and creditors to produce a valid settlement plan.
+ * This heuristic does not guarantee the globally fewest transfers.
🟡 P1 — No state/version migration guard for persisted groups
- Location: [useGroupStore.ts (line 243)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:243)
- Flaw: The key is isolated as pacewise-groups-v1, but persistence has no version or migrate handler. A future shape change has no explicit migration path. Corrupt JSON handling is delegated to Zustand’s storage parser; the feature does not validate the hydrated shape itself.
- Failure scenario: A future release changes Group shape or a malformed/old payload hydrates into groups; components assume arrays and nested properties exist.
- Remediation diff: Add versioned migration and validate persisted groups before use.
     {
       name: 'pacewise-groups-v1',
+      version: 1,
+      migrate: (persisted, version) => {
+        if (version === 0) return migrateLegacyGroups(persisted);
+        return validatePersistedGroupState(persisted);
+      },
     }
migrateLegacyGroups and validatePersistedGroupState should be explicit functions; do not silently cast unknown JSON to Group[].
🟡 P1 — Modal focus and keyboard behavior are incomplete
- Location: [CreateGroupModal.tsx (line 95)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/CreateGroupModal.tsx:95), [AddGroupExpenseModal.tsx (line 190)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/AddGroupExpenseModal.tsx:190), [AddGroupTransferModal.tsx (line 86)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/AddGroupTransferModal.tsx:86), [GroupSettleModal.tsx (line 60)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/modals/GroupSettleModal.tsx:60)
- Flaw: The inspected modals use fixed overlays but do not implement a focus trap, dialog semantics, or an Escape-key close handler. Tabbing can move into the page behind the modal; keyboard users have no consistent Escape dismissal.
- Failure scenario: Open a modal, press Tab repeatedly, then press Escape. Focus may leave the dialog, and Escape does not close it.
- Remediation diff: Apply a shared accessible Modal primitive (recommended). Minimum markup/keyboard improvement:
- <div className="fixed inset-0 ...">
+ <div
+   className="fixed inset-0 ..."
+   role="presentation"
+   onKeyDown={(event) => {
+     if (event.key === 'Escape') onClose();
+   }}
+ >
    <div
+     role="dialog"
+     aria-modal="true"
+     aria-labelledby={dialogTitleId}
This diff alone does not trap focus; use a tested dialog primitive or implement focus containment and restore focus to the opener when the modal closes.
🟡 P1 — Interactive controls are too small or unnamed
- Location: [Groups.tsx (line 209)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/Groups.tsx:209), [GroupDetails.tsx (line 448)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/GroupDetails.tsx:448), [GroupDetails.tsx (line 488)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/GroupDetails.tsx:488), [AppLayout.tsx (line 108)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/layout/AppLayout.tsx:108)
- Flaw: Icon-only back, close, delete, and emoji buttons have no accessible name in the inspected code. Delete buttons use p-1.5 (roughly 30px before icon), below a 44px touch target. Several modal toggle buttons lack aria-pressed.
- Failure scenario: A screen reader announces an unlabeled button. On a phone, a user taps near a small delete icon and may miss or hit an adjacent control.
- Remediation diff:
- className="p-1.5 text-[var(--color-gray-dark)] ..."
+ aria-label={`Delete expense: ${exp.description}`}
+ className="min-w-11 min-h-11 p-2.5 text-[var(--color-gray-dark)] ..."
                 <button
                   type="button"
+                  aria-pressed={splitType === 'equal'}
                   onClick={() => setSplitType('equal')}
Give every icon-only button a contextual aria-label; add aria-pressed to toggle buttons and semantic grouping/labels to payer and split selectors.
🟡 P1 — Group status does not prevent further edits
- Location: [useGroupStore.ts (line 150)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:150), [GroupDetails.tsx (line 379)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/GroupDetails.tsx:379)
- Flaw: The feature can mark a group settled, but the audited add actions do not check group status.
- Failure scenario: Mark the trip settled, then add another expense or transfer. The group remains marked settled despite having new activity.
- Remediation diff: Enforce this in the store, not only by hiding buttons.
       addExpense: (groupId, data) => {
         const group = get().groups.find((g) => g.id === groupId);
-        if (!group || !isValidExpense(group, data)) return '';
+        if (!group || group.status !== 'active' || !isValidExpense(group, data)) return '';
Do the same in addTransfer, or explicitly reopen the group when new activity is added.
💡 P2 — Mobile layout has spacing safeguards, but no viewport proof
- Location: [AppLayout.tsx (line 97)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/layout/AppLayout.tsx:97), [Groups.tsx (line 73)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/Groups.tsx:73), [GroupDetails.tsx (line 127)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/GroupDetails.tsx:127)
- Flaw: Main content has pb-28, and card amounts use truncation in the groups list. That is a useful baseline, but the source review does not establish behavior at 360–430px with an on-screen keyboard. The bottom bar has a safe-area inset; content padding is fixed rather than tied to that inset. Some detail header text and action rows are not consistently constrained.
- Failure scenario: At 360px, long names, amounts, or the keyboard reduce available width/height. A fixed-height modal (max-h-[90vh]) may extend behind the virtual keyboard on mobile browsers.
- Remediation diff: Use dynamic viewport height and account for safe-area spacing; constrain header text.
- max-h-[90vh]
+ max-h-[90dvh]
- className="flex-1 flex flex-col h-full relative overflow-y-auto pb-28 md:pb-8"
+ className="flex-1 flex flex-col h-full relative overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8"
Actual viewport and keyboard behavior needs device/browser verification; this audit did not run a visual viewport stress test.
💡 P2 — Hard-coded colors weaken theme consistency
- Location: [Groups.tsx (line 203)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/Groups.tsx:203), [GroupDetails.tsx (line 148)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/pages/GroupDetails.tsx:148), [Button.tsx (line 13)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/components/ui/Button.tsx:13)
- Flaw: Status, success, destructive, and hover styles use fixed emerald/blue/red/gray Tailwind colors. These can be intentional, but they do not consistently follow the app’s semantic CSS variables or guarantee contrast in custom dark themes.
- Remediation: Use semantic tokens consistently, especially for hover and focus states.
- 'bg-emerald-500/10 text-emerald-600'
+ 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
💡 P2 — Storage size is unbounded; IDs have a weak fallback
- Location: [useGroupStore.ts (line 5)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:5), [useGroupStore.ts (line 243)](/C:/CS/CS Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts:243)
- Flaw: IDs use crypto.randomUUID() when available, but fallback to timestamp plus Math.random(). The code persists all group data without field length limits. A precise LocalStorage payload size cannot be established from the code because user-provided strings are unbounded; ordinary 100-expense/10-member data should be modest, but unlimited notes/descriptions can grow it indefinitely.
- Failure scenario: A browser lacking randomUUID creates many records synchronously, or unusually long descriptions cause storage writes to grow until quota is reached.
- Remediation diff: Use getRandomValues as the fallback and cap text lengths at validation boundaries.
 export function generateId(): string {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
     return crypto.randomUUID();
   }
-  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
+  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
+    const bytes = crypto.getRandomValues(new Uint8Array(16));
+    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
+  }
+  throw new Error('Secure ID generation is unavailable.');
 }
Isolation, sharing, and performance checks
- Budget isolation: Group state uses pacewise-groups-v1; personal state uses pacewise-storage-v2. The budget engine calculates from personal transactions; the audited group flows do not add group expenses or transfers there. I found no group-to-wallet or safe-to-spend write path in the scoped code.
- Clipboard: GroupDetails has a fallback when navigator.clipboard.writeText fails. The fallback should still communicate if the legacy copy attempt also fails. Do not assume formatWhatsAppSummary itself accesses the clipboard; it only formats text.
- Re-renders: calculateGroupSummary(group) is called when GroupDetails renders. Typing in a modal updates modal-local state, so it does not inherently rerender the parent. Group-store changes and details-page local state do rerender it. A memo is optional until profiling shows summary calculation is costly.
- XSS/WhatsApp formatting: React escapes user strings in rendered text, so the inspected path does not expose direct HTML injection. Names containing WhatsApp *, _, or backticks can alter exported formatting; sanitize or escape those markers if formatting integrity matters.
- Zero members: Normal group creation requires at least one friend and always creates “You.” Equal split UI prevents deselecting the last included member. These are UI protections only; store validation must still reject empty/invalid splits.
Test gaps
The existing [groupEngine.test.ts](C:/CS/CS Projects/Web-Projects/PaceWise/tests/unit/groupEngine.test.ts) covers a standard equal split, a direct repayment, a simple debt simplification, and WhatsApp formatting. It does not cover the critical failure paths above.

Add tests for:
it('rejects a custom split that differs by one paisa', () => {
  expect(validateCustomSplit(10_000, [5_000, 4_999])).toBe(false);
});

it.each(['0', '-500', '0.00001', '1e20', '1e309', 'NaN', 'Infinity'])(
  'rejects unsafe amount input %s',
  (raw) => {
    expect(toPaise(raw)).toBeNull();
  }
);

it('rejects expense references to removed members', () => {
  const group = groupWithMemberHistory('former-member');
  expect(() => calculateGroupSummary(group)).toThrow(/unknown/i);
});

it('refuses to remove a member with recorded history', () => {
  const groupId = createGroupFixtureWithHistory('former-member');
  useGroupStore.getState().removeMember(groupId, 'former-member');
  expect(findMember(groupId, 'former-member')).toBeDefined();
});

it('nets circular debts without creating a loop', () => {
  const result = simplifyDebts([
    balance('A', -50),
    balance('B', 0),
    balance('C', 50),
  ]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    fromMemberId: 'A',
    toMemberId: 'C',
    amount: 50,
  });
});
The final test reflects the requested A→B ₹100, B→C ₹100, C→A ₹50 cycle after netting: A owes C ₹50, so one transfer is sufficient. The test names above require the validation helpers and fixture builders described in the proposed fixes. No files were changed and no tests or mobile viewport simulations were run.
