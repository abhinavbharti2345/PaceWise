import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconBadge } from '../components/ui/IconBadge';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { cn } from '../utils/cn';
import { Search, Trash2, Edit3, Calendar, Receipt } from 'lucide-react';
import { getCategoryMeta } from '../utils/categoryHelpers';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddMoneyModal } from '../components/modals/AddMoneyModal';
import { AddBillModal } from '../components/modals/AddBillModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import type { Transaction } from '../features/budget/budgetEngine';

type FilterType = 'all' | 'expense' | 'income' | 'bill' | 'person';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export function Transactions() {
  const { transactions, deleteTransaction } = useStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [search, setSearch] = useState('');

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => (filterType === 'all' ? true : t.type === filterType))
      .filter(t => {
        if (timeFilter === 'today') return isToday(new Date(t.date));
        if (timeFilter === 'week') return isThisWeek(new Date(t.date));
        if (timeFilter === 'month') return isThisMonth(new Date(t.date));
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
        <div className="flex items-center gap-1.5 bg-[var(--color-surface-light)] p-1 rounded-xl shrink-0">
          {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors",
                timeFilter === period 
                  ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Today'}
            </button>
          ))}
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
                  const meta = getCategoryMeta(t.type, t.category);
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
