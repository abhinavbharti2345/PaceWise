import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  User, 
  Edit3,
  Coffee,
  Car,
  Ticket,
  ShoppingBag,
  Smartphone,
  Home,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currencyUtils';
import type { Transaction } from '../../features/budget/budgetEngine';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  transactions: Transaction[];
  totalPeriodSpend: number;
  daysInPeriod: number;
  onEditTransaction?: (tx: Transaction) => void;
}

const getCategoryIcon = (category: string) => {
  const c = (category || '').toLowerCase();
  if (c.includes('food') || c.includes('coffee') || c.includes('dining')) return <Coffee size={20} className="text-[var(--color-primary)]" />;
  if (c.includes('transport') || c.includes('travel') || c.includes('cab')) return <Car size={20} className="text-[var(--color-orange)]" />;
  if (c.includes('entertainment') || c.includes('movie') || c.includes('concert')) return <Ticket size={20} className="text-[var(--color-success)]" />;
  if (c.includes('shopping') || c.includes('clothes')) return <ShoppingBag size={20} className="text-[var(--color-primary)]" />;
  if (c.includes('tech') || c.includes('gadget') || c.includes('electronics')) return <Smartphone size={20} className="text-[var(--color-primary)]" />;
  if (c.includes('home') || c.includes('rent')) return <Home size={20} className="text-[var(--color-gray-dark)]" />;
  if (c.includes('utility') || c.includes('bill')) return <Zap size={20} className="text-[var(--color-orange)]" />;
  return <MoreHorizontal size={20} className="text-[var(--color-gray-dark)]" />;
};

export function CategoryDetailModal({
  isOpen,
  onClose,
  categoryName,
  transactions,
  totalPeriodSpend,
  daysInPeriod,
  onEditTransaction
}: CategoryDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter transactions for this specific category
  const categoryTxs = useMemo(() => {
    return transactions
      .filter(t => (t.category || 'Other').toLowerCase() === (categoryName || 'Other').toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categoryName]);

  // Total spent in this category
  const categoryTotal = useMemo(() => {
    return categoryTxs.reduce((sum, t) => sum + t.amount, 0);
  }, [categoryTxs]);

  // Percentage of total period spend
  const categoryPercentage = totalPeriodSpend > 0 
    ? Math.round((categoryTotal / totalPeriodSpend) * 100) 
    : 0;

  // Daily average for this category
  const dailyAverage = Math.round(categoryTotal / Math.max(1, daysInPeriod));

  // Search filtered transactions
  const filteredTxs = useMemo(() => {
    if (!searchQuery.trim()) return categoryTxs;
    const q = searchQuery.toLowerCase();
    return categoryTxs.filter(t => 
      (t.reason && t.reason.toLowerCase().includes(q)) ||
      (t.personName && t.personName.toLowerCase().includes(q)) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q)) ||
      (t.note && t.note.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q)
    );
  }, [categoryTxs, searchQuery]);

  // 4-Week Mini Trend Calculation
  const weeklyBuckets = useMemo(() => {
    if (categoryTxs.length === 0) return [0, 0, 0, 0];
    const buckets = [0, 0, 0, 0];
    categoryTxs.forEach(t => {
      const d = new Date(t.date).getDate();
      const bucketIdx = Math.min(3, Math.floor((d - 1) / 7.5));
      buckets[bucketIdx] += t.amount;
    });
    return buckets;
  }, [categoryTxs]);

  const maxWeeklySpend = Math.max(1, ...weeklyBuckets);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[90dvh] sm:max-h-[85vh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0 bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-center justify-center shrink-0 shadow-inner">
              {getCategoryIcon(categoryName)}
            </div>
            <div>
              <h2 className="font-extrabold text-[var(--color-dark)] text-lg sm:text-xl tracking-tight leading-tight">
                {categoryName}
              </h2>
              <p className="text-xs font-semibold text-[var(--color-gray-dark)]">
                {categoryTxs.length} transaction{categoryTxs.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 overscroll-y-contain touch-pan-y scroll-smooth pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          
          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">Total Spent</span>
              <span className="text-base sm:text-lg font-extrabold text-[var(--color-primary)] truncate block mt-0.5">
                {formatCurrency(categoryTotal)}
              </span>
            </div>
            
            <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">Share of Total</span>
              <span className="text-base sm:text-lg font-extrabold text-[var(--color-dark)] truncate block mt-0.5">
                {categoryPercentage}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">Daily Avg</span>
              <span className="text-base sm:text-lg font-extrabold text-[var(--color-success)] truncate block mt-0.5">
                {formatCurrency(dailyAverage)}
              </span>
            </div>
          </div>

          {/* 4-Week Distribution Mini-Chart */}
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-dark)]">
              <span>Monthly Distribution</span>
              <span className="text-[10px] text-[var(--color-gray-dark)] font-medium">By 7-day blocks</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {weeklyBuckets.map((amt, idx) => {
                const heightPct = Math.max(12, Math.round((amt / maxWeeklySpend) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className="w-full h-14 bg-[var(--color-surface)] rounded-xl p-1 flex items-end justify-center border border-[var(--color-gray-light)]">
                      <div 
                        className={cn(
                          "w-full rounded-lg transition-all duration-500",
                          amt > 0 ? "bg-[var(--color-primary)]" : "bg-transparent"
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-dark)]">{formatCurrency(amt)}</span>
                    <span className="text-[9px] font-semibold text-[var(--color-gray-dark)] uppercase">W{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
            <input
              type="text"
              placeholder={`Search ${categoryName} transactions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[var(--color-dark)] placeholder-[var(--color-gray-dark)] text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider px-1">
              <span>All Spends ({filteredTxs.length})</span>
              <span>Amount</span>
            </div>

            {filteredTxs.length > 0 ? (
              filteredTxs.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTx(selectedTx?.id === t.id ? null : t)}
                  className={cn(
                    "p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/40 transition-all cursor-pointer",
                    selectedTx?.id === t.id && "ring-2 ring-[var(--color-primary)] bg-[var(--color-surface)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[var(--color-dark)] truncate">
                          {t.reason || categoryName}
                        </span>
                        {t.personName && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            <User size={10} /> {t.personName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--color-gray-dark)] font-medium mt-0.5 flex items-center gap-2">
                        <span>{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>{t.paymentMethod || 'UPI / Card'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[var(--color-primary)]">
                        - {formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Transaction Details */}
                  {selectedTx?.id === t.id && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-gray-light)] space-y-2 animate-in fade-in duration-150 text-[11px]">
                      {t.note && (
                        <div className="bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-gray-light)] text-[var(--color-dark)]">
                          <span className="font-bold text-[var(--color-gray-dark)] block text-[9px] uppercase">Note</span>
                          {t.note}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[var(--color-gray-dark)]">ID: {t.id.slice(0, 8)}...</span>
                        {onEditTransaction && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(t);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit Transaction
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[var(--color-gray-dark)]">
                No matching transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
