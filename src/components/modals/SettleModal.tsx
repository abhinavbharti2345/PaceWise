import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, CreditCard, DollarSign, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Person } from '../../store/useStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { getAllExpenseCategories } from '../../utils/categoryHelpers';
import { AddCategoryModal } from './AddCategoryModal';
import { formatCurrency } from '../../utils/currencyUtils';
import type { Transaction } from '../../features/budget/budgetEngine';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  transactionToSettle?: Transaction;
}

export function SettleModal({ isOpen, onClose, person, transactionToSettle }: SettleModalProps) {
  const { settleDebt, transactions, customCategories } = useStore();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const allCategories = getAllExpenseCategories(customCategories);
  
  const absBalance = Math.abs(person.balance);
  const isPersonOwing = person.balance > 0; // Person owes user overall

  const boughtForMeItems = transactions.filter(
    t => t.personId === person.id && t.direction === 'bought_for_me' && t.status !== 'settled'
  );

  const personTxs = transactions.filter(t => t.personId === person.id);

  const totalLent = person.balance > 0 ? person.balance : 0;
  const totalBorrowed = person.balance < 0 ? Math.abs(person.balance) : 0;

  const totalBoughtForMe = personTxs
    .filter(t => t.direction === 'bought_for_me' && t.status !== 'settled')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const [settlementMode, setSettlementMode] = useState<'general' | 'bought_for_me'>('general');
  const [settlementMethod, setSettlementMethod] = useState<'cash' | 'offset_debt'>('cash');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Groceries');

  const [amount, setAmount] = useState(absBalance.toString());
  const [isFullSettlement, setIsFullSettlement] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Update state when modal opens or transactionToSettle changes
  useEffect(() => {
    if (isOpen) {
      if (transactionToSettle) {
        setSettlementMode('bought_for_me');
        setSelectedItemIds([transactionToSettle.id]);
        setIsCustomCategoryMode(false);
        setSelectedCategory(transactionToSettle.category || 'Groceries');
        setAmount(transactionToSettle.amount.toString());
        setIsFullSettlement(false);
        setSettlementMethod(person.balance > 0 ? 'offset_debt' : 'cash');
      } else if (boughtForMeItems.length > 0) {
        setSettlementMode('bought_for_me');
        const allIds = boughtForMeItems.map(t => t.id);
        setSelectedItemIds(allIds);
        setIsCustomCategoryMode(false);
        const sum = boughtForMeItems.reduce((acc, t) => acc + t.amount, 0);
        setAmount(sum.toString());
        setIsFullSettlement(false);
        setSettlementMethod(person.balance > 0 ? 'offset_debt' : 'cash');
      } else {
        setSettlementMode('general');
        setSelectedItemIds([]);
        setIsCustomCategoryMode(false);
        setSelectedCategory('Groceries');
        setAmount(absBalance.toString());
        setIsFullSettlement(true);
        setSettlementMethod('cash');
      }
      setNote('');
      setError('');
    }
  }, [isOpen, transactionToSettle, absBalance, person.balance]);

  if (!isOpen) return null;

  const isBoughtForMeMode = !!transactionToSettle || settlementMode === 'bought_for_me';

  const handleSettleType = (full: boolean) => {
    setIsFullSettlement(full);
    if (full) {
      setAmount(absBalance.toString());
    } else {
      setAmount('');
    }
  };

  const handleToggleItem = (itemId: string) => {
    setIsCustomCategoryMode(false);
    let newSelected: string[];
    if (selectedItemIds.includes(itemId)) {
      newSelected = selectedItemIds.filter(id => id !== itemId);
    } else {
      newSelected = [...selectedItemIds, itemId];
    }
    setSelectedItemIds(newSelected);
    const sum = boughtForMeItems
      .filter(t => newSelected.includes(t.id))
      .reduce((acc, t) => acc + t.amount, 0);
    setAmount(sum > 0 ? sum.toString() : '');
  };

  const handleToggleSelectAll = () => {
    setIsCustomCategoryMode(false);
    if (selectedItemIds.length === boughtForMeItems.length) {
      setSelectedItemIds([]);
      setAmount('');
    } else {
      const allIds = boughtForMeItems.map(t => t.id);
      setSelectedItemIds(allIds);
      const sum = boughtForMeItems.reduce((acc, t) => acc + t.amount, 0);
      setAmount(sum.toString());
    }
  };

  const handleQuickLentClick = () => {
    setSettlementMode('general');
    const val = Math.max(0, totalLent);
    setAmount(val.toString());
    setIsFullSettlement(val === absBalance);
  };

  const handleQuickBorrowedClick = () => {
    setSettlementMode('general');
    const val = Math.max(0, totalBorrowed);
    setAmount(val.toString());
    setIsFullSettlement(val === absBalance);
  };

  const handleQuickBoughtForMeClick = () => {
    setSettlementMode('bought_for_me');
    setIsCustomCategoryMode(false);
    const allIds = boughtForMeItems.map(t => t.id);
    setSelectedItemIds(allIds);
    setAmount(totalBoughtForMe.toString());
    setIsFullSettlement(false);
    setSettlementMethod(person.balance > 0 ? 'offset_debt' : 'cash');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid settlement amount');
      return;
    }

    if (isBoughtForMeMode) {
      const itemsToSettle = boughtForMeItems.filter(t => selectedItemIds.includes(t.id));
      if (itemsToSettle.length > 0 && !isCustomCategoryMode) {
        settleDebt({
          personId: person.id,
          personName: person.name,
          amount: itemsToSettle.reduce((sum, item) => sum + item.amount, 0),
          direction: 'paid',
          note: note.trim() || undefined,
          settleItems: itemsToSettle.map(item => ({
            id: item.id,
            amount: item.amount,
            category: item.category,
            reason: item.reason
          })),
          settlementMethod,
        });
      } else {
        settleDebt({
          personId: person.id,
          personName: person.name,
          amount: numAmount,
          direction: 'paid',
          note: note.trim() || undefined,
          expenseCategory: selectedCategory,
          expenseReason: `Settled purchases for ${person.name}`,
          settlementMethod,
        });
      }
    } else {
      settleDebt({
        personId: person.id,
        personName: person.name,
        amount: numAmount,
        direction: isPersonOwing ? 'received' : 'paid',
        note: note.trim() || undefined,
      });
    }

    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[85dvh] sm:max-h-[90vh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-[var(--color-success)]" size={20} />
            <h2 className="font-bold text-[var(--color-dark)] text-lg">
              {isBoughtForMeMode ? `Settle Purchase with ${person.name}` : `Settle Balance with ${person.name}`}
            </h2>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 overscroll-y-contain touch-pan-y scroll-smooth scroll-pb-28 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status info with 3-Way Breakdown */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Current Net Balance</p>
                <span className={cn(
                  "text-2xl font-extrabold",
                  person.balance > 0 ? "text-[var(--color-success)]" : person.balance < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
                )}>
                  {formatCurrency(absBalance)}
                </span>
              </div>
              <span className="text-xs font-semibold text-[var(--color-gray-dark)] px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                {person.balance > 0 ? "They owe you" : person.balance < 0 ? "You owe them" : "All settled"}
              </span>
            </div>

            {/* 3-Column Interactive Breakdown Shortcuts */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--color-gray-light)] text-center text-[10px]">
              <button
                type="button"
                disabled={totalLent <= 0}
                onClick={handleQuickLentClick}
                className={cn(
                  "p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] transition-all text-center flex flex-col items-center justify-center",
                  totalLent > 0 ? "hover:border-emerald-400 hover:shadow-sm active:scale-95 cursor-pointer" : "opacity-50 cursor-not-allowed"
                )}
                title={totalLent > 0 ? "Quick fill lent amount" : "No lent amount to settle"}
              >
                <span className="text-[var(--color-gray-dark)] font-semibold text-[10px] sm:text-xs leading-tight">↗ Lent</span>
                <span className="font-extrabold text-[var(--color-success)] mt-0.5">
                  {formatCurrency(Math.max(0, totalLent))}
                </span>
              </button>
              <button
                type="button"
                disabled={totalBorrowed <= 0}
                onClick={handleQuickBorrowedClick}
                className={cn(
                  "p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] transition-all text-center flex flex-col items-center justify-center",
                  totalBorrowed > 0 ? "hover:border-rose-400 hover:shadow-sm active:scale-95 cursor-pointer" : "opacity-50 cursor-not-allowed"
                )}
                title={totalBorrowed > 0 ? "Quick fill borrowed amount" : "No borrowed amount to settle"}
              >
                <span className="text-[var(--color-gray-dark)] font-semibold text-[10px] sm:text-xs leading-tight">↘ Borrowed</span>
                <span className="font-extrabold text-[var(--color-primary)] mt-0.5">
                  {formatCurrency(Math.max(0, totalBorrowed))}
                </span>
              </button>
              <button
                type="button"
                disabled={totalBoughtForMe <= 0}
                onClick={handleQuickBoughtForMeClick}
                className={cn(
                  "p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] transition-all text-center flex flex-col items-center justify-center",
                  totalBoughtForMe > 0 ? "hover:border-purple-400 hover:shadow-sm active:scale-95 cursor-pointer" : "opacity-50 cursor-not-allowed"
                )}
                title={totalBoughtForMe > 0 ? "Quick fill Paid for Me amount" : "No purchases to settle"}
              >
                <span className="text-[var(--color-gray-dark)] font-semibold text-[10px] sm:text-xs leading-tight">⇄ Paid for Me</span>
                <span className="font-extrabold text-[var(--color-purple-text)] mt-0.5">
                  {formatCurrency(totalBoughtForMe)}
                </span>
              </button>
            </div>
          </div>

          {/* Settlement Mode Selection (Available whenever user has bought_for_me items or target item) */}
          {(boughtForMeItems.length > 0 || transactionToSettle) && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
                Settlement Type
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-light)] p-1 rounded-xl">
                <button 
                  type="button"
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    !isBoughtForMeMode 
                      ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm" 
                      : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                  )}
                  onClick={() => setSettlementMode('general')}
                >
                  <DollarSign size={14} />
                  <span>Cash Repayment</span>
                </button>
                <button 
                  type="button"
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    isBoughtForMeMode 
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-primary)]/20" 
                      : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                  )}
                  onClick={() => setSettlementMode('bought_for_me')}
                >
                  <CreditCard size={14} />
                  <span>Paid for Me</span>
                </button>
              </div>
            </div>
          )}

          {/* Item Selector & Category Picker when in Paid for Me Mode */}
          {isBoughtForMeMode && (
            <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-[var(--color-surface-light)]/50 p-3.5 rounded-2xl border border-[var(--color-gray-light)]">
              {boughtForMeItems.length > 0 && !isCustomCategoryMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                      Select Purchases to Settle
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                    >
                      {selectedItemIds.length === boughtForMeItems.length ? 'Deselect All' : `Select All (${boughtForMeItems.length})`}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {boughtForMeItems.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer",
                            isSelected
                              ? "bg-[var(--color-surface)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                              : "bg-[var(--color-surface)]/60 border-[var(--color-gray-light)] hover:border-gray-400 opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
                              isSelected ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-gray-400 bg-[var(--color-surface)]"
                            )}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--color-dark)] truncate">{item.reason}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-gray-dark)] mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold truncate">
                                  {item.category || 'General'}
                                </span>
                                <span>•</span>
                                <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-extrabold text-[var(--color-purple-text)] shrink-0 ml-2">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {selectedItemIds.length > 0 && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-medium">
                      ✓ Will log {selectedItemIds.length} separate expense(s) preserving each item's original category in your budget.
                    </p>
                  )}
                </div>
              )}

              {/* Settlement Method Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                  Settlement Method
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSettlementMethod('offset_debt')}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3",
                      settlementMethod === 'offset_debt'
                        ? "bg-[var(--color-surface)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "bg-[var(--color-surface-light)] border-[var(--color-gray-light)] hover:border-gray-400"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        settlementMethod === 'offset_debt' ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-gray-400"
                      )}>
                        {settlementMethod === 'offset_debt' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[var(--color-dark)]">Offset Against Existing Debt</span>
                        {person.balance > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5 leading-normal">
                        Deduct from what {person.name} owes you without giving new cash.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementMethod('cash')}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3",
                      settlementMethod === 'cash'
                        ? "bg-[var(--color-surface)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "bg-[var(--color-surface-light)] border-[var(--color-gray-light)] hover:border-gray-400"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        settlementMethod === 'cash' ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-gray-400"
                      )}>
                        {settlementMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-[var(--color-dark)]">Paid Cash / UPI to {person.name}</span>
                      <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5 leading-normal">
                        You paid cash out-of-pocket to reimburse them.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category picker when in custom mode or no specific item selected */}
              {(isCustomCategoryMode || boughtForMeItems.length === 0) && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
                    Expense Category (Deducted from budget)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {allCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] sm:text-xs font-semibold border transition-all text-left truncate",
                            isSelected 
                              ? "bg-[var(--color-dark)] text-[var(--color-surface)] border-[var(--color-dark)] shadow-sm"
                              : "bg-[var(--color-surface)] text-[var(--color-gray-dark)] border-[var(--color-gray-light)] hover:border-gray-400"
                          )}
                        >
                          <span className="truncate">{cat.name}</span>
                          {isSelected && <Check size={12} className="ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[10px] sm:text-xs font-bold border border-dashed border-purple-400 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all"
                    >
                      <span>+ Custom</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full vs Partial Toggle for Cash Repayment */}
          {!isBoughtForMeMode && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                  Amount Option
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-light)] p-1 rounded-xl">
                <button 
                  type="button"
                  className={cn(
                    "py-2 text-xs font-bold rounded-lg transition-colors",
                    isFullSettlement 
                      ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm" 
                      : "text-[var(--color-gray-dark)]"
                  )}
                  onClick={() => handleSettleType(true)}
                >
                  Full Balance (₹{absBalance})
                </button>
                <button 
                  type="button"
                  className={cn(
                    "py-2 text-xs font-bold rounded-lg transition-colors",
                    !isFullSettlement 
                      ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm" 
                      : "text-[var(--color-gray-dark)]"
                  )}
                  onClick={() => handleSettleType(false)}
                >
                  Custom Amount
                </button>
              </div>
            </div>
          )}

          {/* Settlement Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              {isBoughtForMeMode 
                ? "Settlement Amount (Logged as Expense)" 
                : `Amount to ${isPersonOwing ? "Receive" : "Pay"}`}
            </label>
            <div className="flex items-center text-3xl font-extrabold text-[var(--color-dark)] bg-[var(--color-surface-light)] px-4 py-3 rounded-xl border border-[var(--color-gray-light)]">
              <span className="text-[var(--color-gray-dark)] mr-1">₹</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setIsFullSettlement(Number(e.target.value) === absBalance);
                  if (error) setError('');
                }}
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left"
                placeholder="0"
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Note (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. Paid via GPay / UPI, Cash in hand"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
            />
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full font-bold text-base shadow-md text-white"
              style={{background: 'var(--positive-accent)'}}
            >
              Confirm Settlement
            </Button>
          </div>
        </form>

        <AddCategoryModal 
          isOpen={isAddCategoryOpen}
          onClose={() => setIsAddCategoryOpen(false)}
          onCategoryAdded={(newCat) => setSelectedCategory(newCat)}
        />
      </div>
    </div>
  );
}
