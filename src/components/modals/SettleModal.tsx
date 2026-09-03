import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ShoppingCart, DollarSign, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Person } from '../../store/useStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { getAllExpenseCategories } from '../../utils/categoryHelpers';
import { AddCategoryModal } from './AddCategoryModal';
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

  const totalLent = personTxs
    .filter(t => t.direction === 'gave' && !t.isBoughtForMeSettlement)
    .reduce((sum, t) => sum + (t.isSettlement ? -t.amount : t.amount), 0);

  const totalBorrowed = personTxs
    .filter(t => t.direction === 'took' && !t.isBoughtForMeSettlement)
    .reduce((sum, t) => sum + (t.isSettlement ? -t.amount : t.amount), 0);

  const totalBoughtForMe = personTxs
    .filter(t => t.direction === 'bought_for_me' && t.status !== 'settled')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const [settlementMode, setSettlementMode] = useState<'general' | 'bought_for_me'>('general');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
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
        setSelectedItemId(transactionToSettle.id);
        setSelectedCategory(transactionToSettle.category || 'Groceries');
        setAmount(transactionToSettle.amount.toString());
        setIsFullSettlement(false);
      } else if (boughtForMeItems.length > 0) {
        setSettlementMode('bought_for_me');
        const first = boughtForMeItems[0];
        setSelectedItemId(first.id);
        setSelectedCategory(first.category || 'Groceries');
        setAmount(first.amount.toString());
        setIsFullSettlement(false);
      } else {
        setSettlementMode('general');
        setSelectedItemId('');
        setSelectedCategory('Groceries');
        setAmount(absBalance.toString());
        setIsFullSettlement(true);
      }
      setNote('');
      setError('');
    }
  }, [isOpen, transactionToSettle, absBalance]);

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

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    if (itemId === 'custom') return;
    
    const item = boughtForMeItems.find(t => t.id === itemId);
    if (item) {
      setAmount(item.amount.toString());
      setSelectedCategory(item.category || 'Groceries');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid settlement amount');
      return;
    }

    const selectedItem = transactionToSettle || boughtForMeItems.find(t => t.id === selectedItemId);

    settleDebt({
      personId: person.id,
      personName: person.name,
      amount: numAmount,
      // If settling a purchase, direction is always 'paid' (paying off the purchase obligation and logging an expense)
      direction: isBoughtForMeMode ? 'paid' : (isPersonOwing ? 'received' : 'paid'),
      note: note.trim() || undefined,
      expenseCategory: isBoughtForMeMode ? selectedCategory : undefined,
      expenseReason: isBoughtForMeMode 
        ? (selectedItem ? `Settled purchase: ${selectedItem.reason}` : `Settled purchase for ${person.name}`)
        : undefined,
      settleTransactionId: selectedItem?.id,
    });

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
                  ₹{absBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-semibold text-[var(--color-gray-dark)] px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                {person.balance > 0 ? "They owe you" : person.balance < 0 ? "You owe them" : "All settled"}
              </span>
            </div>

            {/* 3-Column Breakdown */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--color-gray-light)] text-center text-[10px]">
              <div className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                <span className="text-[var(--color-gray-dark)] block font-semibold">↗ Lent</span>
                <span className="font-extrabold text-[var(--color-success)]">
                  ₹{Math.max(0, totalLent).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                <span className="text-[var(--color-gray-dark)] block font-semibold">↘ Borrowed</span>
                <span className="font-extrabold text-[var(--color-primary)]">
                  ₹{Math.max(0, totalBorrowed).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                <span className="text-[var(--color-gray-dark)] block font-semibold">🛒 Purchases</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                  ₹{totalBoughtForMe.toLocaleString('en-IN')}
                </span>
              </div>
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
                  <ShoppingCart size={14} />
                  <span>Bought for Me</span>
                </button>
              </div>
            </div>
          )}

          {/* Item Selector & Category Picker when in Bought for Me Mode */}
          {isBoughtForMeMode && (
            <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-[var(--color-surface-light)]/50 p-3.5 rounded-2xl border border-[var(--color-gray-light)]">
              {boughtForMeItems.length > 0 && !transactionToSettle && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1.5">
                    Select Purchased Item to Settle
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleSelectItem(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {boughtForMeItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.reason} — ₹{item.amount.toLocaleString('en-IN')} ({item.category || 'General'})
                      </option>
                    ))}
                    <option value="custom">Custom Purchase / Settle by Category</option>
                  </select>
                </div>
              )}

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
