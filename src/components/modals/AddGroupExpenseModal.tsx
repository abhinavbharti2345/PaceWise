import { useState, useEffect, useId } from 'react';
import { X, AlertCircle, Check, Users, Receipt, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGroupStore } from '../../store/useGroupStore';
import { toPaise, type Group, type GroupExpenseSplit } from '../../utils/groupEngine';
import { getTodayDateString } from '../../utils/dateUtils';

interface AddGroupExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

const CATEGORIES = [
  { name: 'Food & Drinks', emoji: '🍕' },
  { name: 'Stay & Hotel', emoji: '🏨' },
  { name: 'Transport & Fuel', emoji: '🚗' },
  { name: 'Activities & Fun', emoji: '🏄' },
  { name: 'Shopping & Supplies', emoji: '🛍️' },
  { name: 'General', emoji: '🧾' },
];

export function AddGroupExpenseModal({ isOpen, onClose, group }: AddGroupExpenseModalProps) {
  const { addExpense } = useGroupStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('Food & Drinks');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  // For Equal split: set of memberIds included
  const [includedMemberIds, setIncludedMemberIds] = useState<string[]>([]);

  // For Custom split: map of memberId -> string amount
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const amountInputId = useId();

  const currency = group.currency || '₹';

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setDate(getTodayDateString());
      setCategory('Food & Drinks');
      setError('');
      setSplitType('equal');

      // Default payer is "You" (isUser) or the first member
      const userMember = group.members.find((m) => m.isUser);
      setPayerId(userMember ? userMember.id : group.members[0]?.id || '');

      // By default, everyone is included in the split
      const allIds = group.members.map((m) => m.id);
      setIncludedMemberIds(allIds);

      // Initialize custom splits to empty
      const initialCustom: Record<string, string> = {};
      allIds.forEach((id) => {
        initialCustom[id] = '';
      });
      setCustomSplits(initialCustom);
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const amountPaise = toPaise(amount);
  const numAmount = amountPaise === null ? 0 : amountPaise / 100;

  // Calculate per-person share for equal split — use the same floor+remainder
  // logic as the actual save path so the preview matches stored values exactly.
  const equalCount = includedMemberIds.length;
  const equalBaseShare = equalCount > 0 ? Math.floor((numAmount / equalCount) * 100) / 100 : 0;
  // First member absorbs the remainder; show that explicitly only when it differs
  const equalRemainder = equalCount > 0 ? Math.round((numAmount - equalBaseShare * equalCount) * 100) / 100 : 0;
  const equalSharePreviewLabel =
    numAmount > 0 && equalCount > 0
      ? equalRemainder !== 0
        ? `~${equalBaseShare.toFixed(2)} / person`
        : `${equalBaseShare.toFixed(2)} / person`
      : '';

  const handleToggleMember = (memberId: string) => {
    if (includedMemberIds.includes(memberId)) {
      if (includedMemberIds.length <= 1) {
        setError('At least one member must be included in the split.');
        return;
      }
      setIncludedMemberIds(includedMemberIds.filter((id) => id !== memberId));
    } else {
      setIncludedMemberIds([...includedMemberIds, memberId]);
    }
    setError('');
  };

  const handleCustomChange = (memberId: string, val: string) => {
    setCustomSplits((prev) => ({ ...prev, [memberId]: val }));
    setError('');
  };

  const customTotalPaise = Object.values(customSplits).reduce((sum, v) => {
    const p = toPaise(v, { allowZero: true });
    return sum + (p ?? 0);
  }, 0);
  const customRemainingPaise = (amountPaise ?? 0) - customTotalPaise;
  const customRemaining = customRemainingPaise / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please provide a short description for this expense.');
      return;
    }
    if (amountPaise === null || amountPaise <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!payerId) {
      setError('Please select who paid for this expense.');
      return;
    }

    let finalSplits: GroupExpenseSplit[] = [];

    if (splitType === 'equal') {
      if (includedMemberIds.length === 0) {
        setError('At least one person must be included in the split.');
        return;
      }

      // Distribute amount with remainder cents handled on the first member
      const count = includedMemberIds.length;
      const baseShare = Math.floor((numAmount / count) * 100) / 100;
      let distributedSum = baseShare * count;
      let remainder = Math.round((numAmount - distributedSum) * 100) / 100;

      finalSplits = includedMemberIds.map((mId, index) => {
        let memberShare = baseShare;
        if (index === 0 && remainder !== 0) {
          memberShare = Math.round((memberShare + remainder) * 100) / 100;
        }
        return {
          memberId: mId,
          amount: memberShare,
        };
      });
    } else {
      // Custom splits validation
      const hasNegativeOrInvalid = Object.values(customSplits).some((v) => {
        if (!v || !v.trim()) return false;
        const p = toPaise(v, { allowZero: true });
        return p === null;
      });

      if (hasNegativeOrInvalid) {
        setError('Split amounts must be valid non-negative numbers.');
        return;
      }

      const splitEntries = group.members.map((m) => {
        const valStr = customSplits[m.id] || '0';
        const p = toPaise(valStr, { allowZero: true }) ?? 0;
        return { memberId: m.id, paise: p };
      });

      const totalSplitPaise = splitEntries.reduce((sum, s) => sum + s.paise, 0);

      if (totalSplitPaise !== amountPaise) {
        const diffPaise = Math.abs(amountPaise - totalSplitPaise);
        const diffStr = (diffPaise / 100).toFixed(2);
        setError(
          `Custom splits must exactly equal ${currency}${numAmount.toFixed(2)}. Difference: ${currency}${diffStr}`
        );
        return;
      }

      finalSplits = splitEntries
        .filter((s) => s.paise > 0)
        .map((s) => ({
          memberId: s.memberId,
          amount: s.paise / 100,
        }));

      if (finalSplits.length === 0) {
        setError('Please assign custom amounts to at least one member.');
        return;
      }
    }

    addExpense(group.id, {
      description: description.trim(),
      amount: numAmount,
      payerId,
      date: date || getTodayDateString(),
      category,
      splitType,
      splits: finalSplits,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl">
              <Receipt size={24} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-dark)] tracking-tight">Add Group Expense</h2>
              <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">
                In {group.emoji} {group.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                Description <span className="text-[var(--color-primary)]">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Dinner at Beach Shack, Cab, Tickets"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm font-medium"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor={amountInputId} className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                Amount ({currency}) <span className="text-[var(--color-primary)]">*</span>
              </label>
              <Input
                id={amountInputId}
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm font-bold"
              />
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--color-primary)]" /> Date
                </span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-gray-light)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Who Paid? */}
          <div>
            <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-2">
              Who Paid?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {group.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayerId(m.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    payerId === m.id
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[var(--color-dark)] hover:border-[var(--color-primary)]/40'
                  }`}
                >
                  {payerId === m.id && <Check size={14} />}
                  <span>{m.isUser ? 'You' : m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split Mode Selector */}
          <div className="pt-2 border-t border-[var(--color-gray-light)]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-[var(--color-primary)]" />
                How to Split?
              </label>
              <div className="flex bg-[var(--color-surface-light)] p-1 rounded-xl border border-[var(--color-gray-light)] text-xs">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    splitType === 'equal'
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    splitType === 'custom'
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  Custom Amounts
                </button>
              </div>
            </div>

            {/* Split Type: Equally */}
            {splitType === 'equal' ? (
              <div className="space-y-2 bg-[var(--color-surface-light)]/60 p-3.5 rounded-2xl border border-[var(--color-gray-light)]">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-gray-dark)] pb-2 border-b border-[var(--color-gray-light)]">
                  <span>Select who is included in this expense:</span>
                  <span className="font-bold text-[var(--color-primary)]">
                    {equalSharePreviewLabel ? `${currency}${equalSharePreviewLabel}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {group.members.map((m) => {
                    const isChecked = includedMemberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMember(m.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isChecked
                            ? 'bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-dark)] shadow-sm'
                            : 'bg-transparent border-dashed border-[var(--color-gray-light)] text-[var(--color-gray-dark)] opacity-60'
                        }`}
                      >
                        <span>{m.isUser ? 'You' : m.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-white ${
                            isChecked ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Split Type: Custom */
              <div className="space-y-2.5 bg-[var(--color-surface-light)]/60 p-3.5 rounded-2xl border border-[var(--color-gray-light)]">
                <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-[var(--color-gray-light)]">
                  <span className="text-[var(--color-gray-dark)]">Enter exact amounts per member:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(customRemaining) <= 0.05 ? 'text-[var(--color-success)]' : 'text-amber-500'
                    }`}
                  >
                    Remaining: {currency}{customRemaining.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-[var(--color-dark)] w-28 truncate">
                        {m.isUser ? 'You' : m.name}
                      </span>
                      <div className="relative flex-1 max-w-[160px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-gray-dark)]">
                          {currency}
                        </span>
                        <Input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={customSplits[m.id] || ''}
                          onChange={(e) => handleCustomChange(m.id, e.target.value)}
                          className="w-full pl-7 text-xs font-bold h-9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-gray-light)]">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5 font-bold shadow-md">
              Save Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
