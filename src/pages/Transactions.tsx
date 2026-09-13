import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconBadge } from '../components/ui/IconBadge';
import { format, isToday, isThisWeek, subMonths } from 'date-fns';
import { cn } from '../utils/cn';
import { Search, Trash2, Edit3, Calendar, Receipt, ChevronDown, Check } from 'lucide-react';
import { getCategoryMeta } from '../utils/categoryHelpers';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddMoneyModal } from '../components/modals/AddMoneyModal';
import { AddBillModal } from '../components/modals/AddBillModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { formatCurrency } from '../utils/currencyUtils';
import type { Transaction } from '../features/budget/budgetEngine';

type FilterType = 'all' | 'expense' | 'income' | 'bill' | 'person';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export function Transactions() {
  const { transactions, deleteTransaction, customCategories, customBillCategories = [] } = useStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [search, setSearch] = useState('');

  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    }
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Compute available months from transactions plus recent 6 months
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, number>();

    transactions.forEach(t => {
      try {
        const mKey = format(new Date(t.date), 'yyyy-MM');
        monthMap.set(mKey, (monthMap.get(mKey) || 0) + 1);
      } catch {}
    });

    for (let i = 0; i < 6; i++) {
      const d = subMonths(new Date(), i);
      const mKey = format(d, 'yyyy-MM');
      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, 0);
      }
    }

    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map(key => {
      const [year, month] = key.split('-').map(Number);
      const dateObj = new Date(year, month - 1, 1);
      const isCurrent = key === currentMonthKey;
      return {
        key,
        label: format(dateObj, 'MMMM yyyy'),
        shortLabel: format(dateObj, 'MMM yyyy'),
        isCurrent,
        count: monthMap.get(key) || 0
      };
    });
  }, [transactions, currentMonthKey]);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => (filterType === 'all' ? true : t.type === filterType))
      .filter(t => {
        if (timeFilter === 'today') return isToday(new Date(t.date));
        if (timeFilter === 'week') return isThisWeek(new Date(t.date));
        if (timeFilter === 'month') {
          return format(new Date(t.date), 'yyyy-MM') === selectedMonth;
        }
        return true;
      })
      .filter(t => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const reason = (t.reason || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const person = (t.personName || '').toLowerCase();
        const amt = String(t.amount);
        return reason.includes(q) || cat.includes(q) || person.includes(q) || amt.includes(q);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, timeFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const dateKey = format(new Date(t.date), 'dd MMMM yyyy');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(t);
      return acc;
    }, {} as Record<string, typeof transactions>);
  }, [filteredTransactions]);

  const handleDelete = (t: Transaction) => {
    setDeletingTransaction(t);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-[var(--color-gray-dark)] text-sm">Chronological history of all income, expenses, bills & debts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsMoneyModalOpen(true)}
            className="font-semibold"
            style={{color: 'var(--positive-text)'}}
          >
            + Income
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsBillModalOpen(true)}
            className="text-red-700 dark:text-red-400 font-semibold"
          >
            + Bill
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="font-bold shadow-sm"
          >
            + Expense
          </Button>
        </div>
      </header>

      {/* Search and Time Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
          <input 
            type="text"
            placeholder="Search by description, category, person or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium"
          />
        </div>

        {/* Time period filter dropdown */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-[var(--color-surface-light)] p-1 rounded-xl w-full sm:w-auto shrink-0">
          {(['all', 'today', 'week'] as TimeFilter[]).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => {
                setTimeFilter(period);
                setIsMonthPickerOpen(false);
              }}
              className={cn(
                "w-full sm:w-auto px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold capitalize transition-colors cursor-pointer text-center justify-center flex items-center truncate",
                timeFilter === period 
                  ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <span className="truncate">
                {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'Today'}
              </span>
            </button>
          ))}

          {/* Month Picker Pill */}
          <div className="relative w-full sm:w-auto" ref={monthPickerRef}>
            <button
              type="button"
              onClick={() => {
                setTimeFilter('month');
                setIsMonthPickerOpen(prev => !prev);
              }}
              className={cn(
                "w-full sm:w-auto px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center",
                timeFilter === 'month'
                  ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm"
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Calendar size={12} className={cn("shrink-0", timeFilter === 'month' ? "text-[var(--color-primary)]" : "opacity-70")} />
              <span className="truncate">
                {selectedMonth === currentMonthKey 
                  ? 'This Month' 
                  : (availableMonths.find(m => m.key === selectedMonth)?.shortLabel || selectedMonth)}
              </span>
              <ChevronDown size={11} className={cn("shrink-0 transition-transform duration-200", isMonthPickerOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isMonthPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-2xl shadow-xl z-50 p-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] border-b border-[var(--color-gray-light)] mb-1">
                  Select Month
                </div>
                {availableMonths.map((m) => {
                  const isSelected = timeFilter === 'month' && selectedMonth === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m.key);
                        setTimeFilter('month');
                        setIsMonthPickerOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer",
                        isSelected
                          ? "bg-[var(--color-surface-light)] text-[var(--color-primary)] font-bold"
                          : "text-[var(--color-dark)] hover:bg-[var(--color-surface-light)]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{m.label}</span>
                        {m.isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.count > 0 && (
                          <span className="text-[10px] text-[var(--color-gray-dark)]">
                            {m.count} txns
                          </span>
                        )}
                        {isSelected && <Check size={14} className="text-[var(--color-primary)]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex gap-2 overflow-x-auto py-2 my-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'expense', label: 'Expenses' },
          { id: 'income', label: 'Income / Add Money' },
          { id: 'bill', label: 'Bills & Utilities' },
          { id: 'person', label: 'People & Debts' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilterType(item.id as FilterType)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              filterType === item.id 
                ? "bg-[var(--color-dark)] text-[var(--color-surface)] shadow-sm" 
                : "bg-[var(--color-surface)] text-[var(--color-gray-dark)] border border-[var(--color-gray-light)] hover:border-gray-400"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-6 pb-20 sm:pb-0">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <Calendar size={13} />
              <span>{date}</span>
            </h3>
            <Card className="p-0 overflow-hidden border border-[var(--color-gray-light)]">
              <div className="divide-y divide-[var(--color-gray-light)]">
                {items.map(t => {
                  const meta = getCategoryMeta(t.type, t.category, customCategories, customBillCategories);
                  const isIncome = t.type === 'income' || (t.type === 'person' && t.direction === 'took' && t.isSettlement);

                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--color-surface-light)] transition-colors group gap-2">
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <IconBadge 
                          iconName={meta.icon} 
                          color={meta.color} 
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-[var(--color-dark)] truncate">
                            {t.reason || t.category || t.type}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[var(--color-gray-dark)] flex items-center gap-1 sm:gap-2 mt-0.5 truncate">
                            <span className="font-semibold text-[var(--color-dark)] capitalize shrink-0">
                              {t.personName ? t.personName : (t.category || t.type)}
                            </span>
                            <span>•</span>
                            <span className="shrink-0">{format(new Date(t.date), 'h:mm a')}</span>
                            {t.paymentMethod && <span className="truncate hidden sm:inline">• {t.paymentMethod}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className={cn(
                          'text-xs sm:text-base font-extrabold', 
                          isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'
                        )}>
                          {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingTransaction(t)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-[var(--color-gray-dark)] hover:text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-surface-light)] transition-all"
                            title="Edit transaction"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-[var(--color-gray-dark)] hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-[var(--color-gray-dark)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-gray-light)]">
            <Receipt size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-base">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
      <AddMoneyModal
        isOpen={isMoneyModalOpen}
        onClose={() => setIsMoneyModalOpen(false)}
      />
      <AddBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
      />
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />
      <ConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={() => {
          if (deletingTransaction) {
            deleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
          }
        }}
        title="Delete transaction?"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold text-[var(--color-dark)]">
              "{deletingTransaction?.reason || deletingTransaction?.category || 'Transaction'}"
            </span>
            ? This action cannot be undone.
          </>
        }
        details={
          deletingTransaction ? (
            <div className="flex items-center justify-between font-medium">
              <span className="text-[var(--color-gray-dark)]">
                {deletingTransaction.category || deletingTransaction.type} • {format(new Date(deletingTransaction.date), 'MMM dd')}
              </span>
              <span className={cn(
                'font-bold',
                deletingTransaction.type === 'income' || (deletingTransaction.type === 'person' && deletingTransaction.direction === 'took' && deletingTransaction.isSettlement)
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-primary)]'
              )}>
                {deletingTransaction.type === 'income' || (deletingTransaction.type === 'person' && deletingTransaction.direction === 'took' && deletingTransaction.isSettlement) ? '+' : '−'}
                {formatCurrency(deletingTransaction.amount)}
              </span>
            </div>
          ) : null
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
