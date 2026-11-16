import React, { useState, useEffect, useId } from 'react';
import { 
  X, 
  AlertCircle, 
  PieChart, 
  UserPlus, 
  Sparkles,
  ArrowRight,
  Check,
  Users
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { CategorySelector } from '../ui/CategorySelector';
import { getAllExpenseCategories } from '../../utils/categoryHelpers';
import { AddCategoryModal } from './AddCategoryModal';
import { AddPersonModal } from './AddPersonModal';
import { parseLocalDate, getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currencyUtils';
import { ReceiptAttachmentInput } from '../ui/ReceiptAttachmentInput';
import { registerModal } from '../../lib/modalStack';
import { toPaise } from '../../utils/groupEngine';
import { cn } from '../../utils/cn';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitBillModal({ isOpen, onClose }: SplitBillModalProps) {
  const { 
    people, 
    config, 
    splitExpense, 
    customCategories = [], 
    hiddenCategories = [], 
    categoryOrder = [] 
  } = useStore();

  const allCategories = getAllExpenseCategories(customCategories, hiddenCategories, categoryOrder);
  const currency = config.currency || '₹';
  const formatCurrency = (val: number) => formatCurrencyUtil(val, currency);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(allCategories[0]?.name || 'Food');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Who paid: 'user' or personId
  const [payerId, setPayerId] = useState<string>('user');

  // Split mode: 'equal' or 'custom'
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  // Included people for equal split: 'user' + personId[]
  const [includedIds, setIncludedIds] = useState<string[]>(['user']);

  // Custom amounts mapping: id -> string amount
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({ user: '' });

  const [error, setError] = useState('');
  const amountInputId = useId();

  useEffect(() => {
    if (isOpen) {
      return registerModal(onClose);
    }
  }, [isOpen, onClose]);

  // Reset and initialize participants when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setSelectedCategory(allCategories[0]?.name || 'Food');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setReceiptId(null);
      setNote('');
      setError('');
      setPayerId('user');
      setSplitMode('equal');

      // Include user and all existing friends by default
      const allParticipantIds = ['user', ...people.map(p => p.id)];
      setIncludedIds(allParticipantIds);

      const initialCustom: Record<string, string> = {};
      allParticipantIds.forEach(id => {
        initialCustom[id] = '';
      });
      setCustomAmounts(initialCustom);
    }
  }, [isOpen, people.length]);

  if (!isOpen) return null;

  const totalPaise = toPaise(amount);
  const numTotalAmount = totalPaise === null ? 0 : totalPaise / 100;

  // Equal split calculation
  const includedCount = includedIds.length;
  const equalBaseShare = includedCount > 0 ? Math.floor((numTotalAmount / includedCount) * 100) / 100 : 0;
  const equalRemainder = includedCount > 0 ? Math.round((numTotalAmount - equalBaseShare * includedCount) * 100) / 100 : 0;

  // Custom split calculation
  const customSumPaise = Object.values(customAmounts).reduce((sum, val) => {
    const p = toPaise(val, { allowZero: true });
    return sum + (p || 0);
  }, 0);
  const customSum = customSumPaise / 100;
  const customDiffPaise = (totalPaise || 0) - customSumPaise;
  const isCustomMatch = totalPaise !== null && totalPaise > 0 && customDiffPaise === 0;

  const handleToggleParticipant = (id: string) => {
    if (includedIds.includes(id)) {
      if (includedIds.length === 1) {
        setError('At least one person must be included in the split');
        return;
      }
      setIncludedIds(includedIds.filter(item => item !== id));
    } else {
      setIncludedIds([...includedIds, id]);
    }
    setError('');
  };

  const handleCustomAmountChange = (id: string, val: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [id]: val
    }));
    setError('');
  };

  const handleSplitRemainingEqually = () => {
    if (!totalPaise || totalPaise <= 0) return;
    
    // Find participants with empty custom amounts
    const allParticipantIds = ['user', ...people.map(p => p.id)];
    const emptyIds = allParticipantIds.filter(id => !customAmounts[id] || Number(customAmounts[id]) === 0);
    
    if (emptyIds.length === 0) return;

    const remainingPaise = Math.max(0, customDiffPaise);
    const baseSharePaise = Math.floor(remainingPaise / emptyIds.length);
    const remainderPaise = remainingPaise - (baseSharePaise * emptyIds.length);

    const updated = { ...customAmounts };
    emptyIds.forEach((id, idx) => {
      const share = idx === 0 ? baseSharePaise + remainderPaise : baseSharePaise;
      updated[id] = (share / 100).toFixed(2);
    });

    setCustomAmounts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalPaise || totalPaise <= 0) {
      setError('Please enter a valid bill amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description (e.g. Dinner at Social, Cab to Airport)');
      return;
    }

    let splitsToSave: Array<{ personId: string; personName: string; amount: number }> = [];

    if (splitMode === 'equal') {
      if (includedIds.length === 0) {
        setError('Please select at least one person to split with');
        return;
      }

      splitsToSave = includedIds.map((id, index) => {
        // Distribute remainder paise to first person
        const share = index === 0 ? equalBaseShare + equalRemainder : equalBaseShare;
        const name = id === 'user' ? 'You' : (people.find(p => p.id === id)?.name || 'Friend');
        return {
          personId: id,
          personName: name,
          amount: Math.round(share * 100) / 100
        };
      });
    } else {
      // Custom mode
      if (!isCustomMatch) {
        if (customDiffPaise > 0) {
          setError(`Please allocate the remaining ${formatCurrency(customDiffPaise / 100)}`);
        } else {
          setError(`Total split exceeds bill by ${formatCurrency(Math.abs(customDiffPaise) / 100)}`);
        }
        return;
      }

      const allParticipantIds = ['user', ...people.map(p => p.id)];
      splitsToSave = allParticipantIds
        .map(id => {
          const rawVal = customAmounts[id] || '0';
          const p = toPaise(rawVal, { allowZero: true }) || 0;
          const name = id === 'user' ? 'You' : (people.find(p => p.id === id)?.name || 'Friend');
          return {
            personId: id,
            personName: name,
            amount: p / 100
          };
        })
        .filter(s => s.amount > 0);
    }

    const isoDate = parseLocalDate(date, time).toISOString();
    const payerName = payerId === 'user' ? 'You' : (people.find(p => p.id === payerId)?.name || 'Friend');

    splitExpense({
      totalAmount: numTotalAmount,
      description: description.trim(),
      category: selectedCategory,
      date: isoDate,
      payerId,
      payerName,
      splits: splitsToSave,
      note: note.trim() || undefined,
      receiptId: receiptId || undefined
    });

    onClose();
  };

  const payerName = payerId === 'user' ? 'You' : (people.find(p => p.id === payerId)?.name || 'Friend');

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y scrollbar-hide"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[90dvh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <PieChart size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-dark)] text-lg leading-tight">Split an Expense</h2>
              <p className="text-xs text-[var(--color-gray-dark)]">Split a shared bill among friends</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 overscroll-y-contain touch-pan-y scroll-smooth pb-8">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Total Bill Amount */}
          <div>
            <label htmlFor={amountInputId} className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Total Bill Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-[var(--color-primary)] pointer-events-none">
                {currency}
              </span>
              <input
                id={amountInputId}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] rounded-2xl text-2xl font-extrabold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          {/* 2. Who Paid the Bill? */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
              Who Paid the Bill?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPayerId('user')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                  payerId === 'user'
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-surface-light)] border-[var(--color-gray-light)] text-[var(--color-dark)] hover:border-[var(--color-primary)]/50"
                )}
              >
                {payerId === 'user' && <Check size={14} className="stroke-[3]" />}
                <span>You (Self)</span>
              </button>

              {people.map((p) => {
                const isSelected = payerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayerId(p.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm"
                        : "bg-[var(--color-surface-light)] border-[var(--color-gray-light)] text-[var(--color-dark)] hover:border-[var(--color-primary)]/50"
                    )}
                  >
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Split Method */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] flex items-center gap-1.5">
                <Users size={14} className="text-[var(--color-primary)]" />
                <span>Split Method</span>
              </label>
              {splitMode === 'custom' && totalPaise && totalPaise > 0 && (
                <button
                  type="button"
                  onClick={handleSplitRemainingEqually}
                  className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Split Remaining Equally</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)]">
              <button
                type="button"
                onClick={() => setSplitMode('equal')}
                className={cn(
                  "py-2 px-3 text-xs font-bold rounded-lg transition-all",
                  splitMode === 'equal'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm font-extrabold"
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
              >
                = Equal Split
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('custom')}
                className={cn(
                  "py-2 px-3 text-xs font-bold rounded-lg transition-all",
                  splitMode === 'custom'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm font-extrabold"
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
              >
                ✎ Custom Split
              </button>
            </div>
          </div>

          {/* 4. Participants Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">
                Participants ({splitMode === 'equal' ? includedCount : people.length + 1})
              </span>
              <button
                type="button"
                onClick={() => setIsAddPersonOpen(true)}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                <UserPlus size={13} />
                <span>Add Friend</span>
              </button>
            </div>

            <div className="divide-y divide-[var(--color-gray-light)] border border-[var(--color-gray-light)] rounded-2xl bg-[var(--color-surface-light)]/40 overflow-hidden">
              {/* You (Self) */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {splitMode === 'equal' && (
                    <input
                      type="checkbox"
                      checked={includedIds.includes('user')}
                      onChange={() => handleToggleParticipant('user')}
                      className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                  )}
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                    You
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-dark)] leading-tight truncate">
                      You (Self)
                    </p>
                    <p className="text-[11px] text-[var(--color-gray-dark)]">
                      {payerId === 'user' ? 'Payer' : 'Participant'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {splitMode === 'equal' ? (
                    includedIds.includes('user') ? (
                      <span className="text-sm font-extrabold text-[var(--color-dark)]">
                        {formatCurrency(includedIds[0] === 'user' ? equalBaseShare + equalRemainder : equalBaseShare)}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-gray-dark)] italic">Excluded</span>
                    )
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[var(--color-gray-dark)]">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={customAmounts['user'] || ''}
                        onChange={(e) => handleCustomAmountChange('user', e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl text-right text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Friends list */}
              {people.map((p) => {
                const isIncluded = includedIds.includes(p.id);
                const isPayer = payerId === p.id;
                const equalShareForPerson = includedIds[0] === p.id ? equalBaseShare + equalRemainder : equalBaseShare;

                return (
                  <div key={p.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {splitMode === 'equal' && (
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => handleToggleParticipant(p.id)}
                          className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                        />
                      )}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-dark)] leading-tight truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-gray-dark)]">
                          {isPayer ? 'Payer' : `Current balance: ${formatCurrency(p.balance)}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {splitMode === 'equal' ? (
                        isIncluded ? (
                          <span className="text-sm font-extrabold text-[var(--color-dark)]">
                            {formatCurrency(equalShareForPerson)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-gray-dark)] italic">Excluded</span>
                        )
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[var(--color-gray-dark)]">{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={customAmounts[p.id] || ''}
                            onChange={(e) => handleCustomAmountChange(p.id, e.target.value)}
                            className="w-24 px-2.5 py-1.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl text-right text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {people.length === 0 && (
                <div className="p-4 text-center text-xs text-[var(--color-gray-dark)]">
                  No friends added yet. Tap <strong>+ Add Friend</strong> above to include someone.
                </div>
              )}
            </div>

            {/* Custom Split Allocation Status */}
            {splitMode === 'custom' && totalPaise !== null && totalPaise > 0 && (
              <div className={cn(
                "p-3 rounded-xl text-xs font-bold flex items-center justify-between border mt-2",
                isCustomMatch
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : customDiffPaise > 0
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              )}>
                <span>Allocated: {formatCurrency(customSum)} of {formatCurrency(numTotalAmount)}</span>
                <span>
                  {isCustomMatch 
                    ? '✓ Exact match' 
                    : customDiffPaise > 0 
                    ? `${formatCurrency(customDiffPaise / 100)} left` 
                    : `${formatCurrency(Math.abs(customDiffPaise) / 100)} over`}
                </span>
              </div>
            )}
          </div>

          {/* 5. Description / Purpose */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Description / Purpose
            </label>
            <Input
              placeholder="e.g. Dinner at Social, Cab fare, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* 6. Expense Category */}
          <div>
            <CategorySelector
              label="Expense Category"
              type="expense"
              categories={allCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddCustomClick={() => setIsAddCategoryOpen(true)}
            />
          </div>

          {/* Date & Optional Details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
                Date
              </label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
                Time
              </label>
              <TimePicker value={time} onChange={setTime} />
            </div>
          </div>

          {/* Optional Receipt Attachment */}
          <ReceiptAttachmentInput
            receiptId={receiptId}
            onChange={setReceiptId}
          />

          {/* Summary Box */}
          {numTotalAmount > 0 && (
            <div className="p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-xs space-y-1.5">
              <p className="font-bold text-[var(--color-dark)] text-xs uppercase tracking-wider">
                Financial Impact Summary
              </p>
              {payerId === 'user' ? (
                <>
                  <p className="text-[var(--color-gray-dark)] flex items-center justify-between">
                    <span>Your personal budget expense ({selectedCategory}):</span>
                    <strong className="text-[var(--color-dark)]">
                      {formatCurrency(
                        splitMode === 'equal' 
                          ? (includedIds.includes('user') ? (includedIds[0] === 'user' ? equalBaseShare + equalRemainder : equalBaseShare) : 0)
                          : (toPaise(customAmounts['user'] || '0', { allowZero: true }) || 0) / 100
                      )}
                    </strong>
                  </p>
                  <p className="text-[var(--color-gray-dark)] flex items-center justify-between">
                    <span>Total lent to friends (to receive):</span>
                    <strong className="text-[var(--color-success)]">
                      +{formatCurrency(
                        numTotalAmount - (
                          splitMode === 'equal' 
                            ? (includedIds.includes('user') ? (includedIds[0] === 'user' ? equalBaseShare + equalRemainder : equalBaseShare) : 0)
                            : (toPaise(customAmounts['user'] || '0', { allowZero: true }) || 0) / 100
                        )
                      )}
                    </strong>
                  </p>
                </>
              ) : (
                <p className="text-[var(--color-gray-dark)] flex items-center justify-between">
                  <span>You will owe {payerName} ("Paid for Me"):</span>
                  <strong className="text-purple-600 dark:text-purple-400">
                    {formatCurrency(
                      splitMode === 'equal'
                        ? (includedIds.includes('user') ? (includedIds[0] === 'user' ? equalBaseShare + equalRemainder : equalBaseShare) : 0)
                        : (toPaise(customAmounts['user'] || '0', { allowZero: true }) || 0) / 100
                    )}
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={numTotalAmount <= 0 || (splitMode === 'custom' && !isCustomMatch)}
              className="w-full font-bold py-3 text-base flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Confirm & Split {numTotalAmount > 0 ? formatCurrency(numTotalAmount) : ''}</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      </div>

      {/* Sub-modals */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={(newCat) => {
          setSelectedCategory(newCat);
          setIsAddCategoryOpen(false);
        }}
      />

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
      />
    </div>
  );
}
