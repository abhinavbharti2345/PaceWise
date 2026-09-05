import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Edit3 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import type { Transaction } from '../../features/budget/budgetEngine';
import { getAllExpenseCategories } from '../../utils/categoryHelpers';
import { parseLocalDate } from '../../utils/dateUtils';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { updateTransaction, customCategories } = useStore();
  const allCategories = getAllExpenseCategories(customCategories);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setReason(transaction.reason || '');
      setCategory(transaction.category || 'Other');
      setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaymentMethod(transaction.paymentMethod || 'UPI / Card');
      setNote(transaction.note || '');
      setError('');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a description/reason');
      return;
    }

    updateTransaction(transaction.id, {
      amount: numAmount,
      reason: reason.trim(),
      category: category.trim() || 'Other',
      date: parseLocalDate(date, transaction.date).toISOString(),
      paymentMethod: paymentMethod || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[85dvh] sm:max-h-[90vh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Edit Transaction</h2>
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

          {/* Amount */}
          <div className="bg-[var(--color-surface-light)] p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Amount
            </label>
            <div className="flex items-center text-3xl sm:text-4xl font-extrabold text-[var(--color-dark)]">
              <span className="text-[var(--color-gray-dark)] mr-2 font-normal">₹</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left placeholder:text-[var(--color-gray-light)] text-[var(--color-dark)] font-extrabold"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Input 
              label="Description / Reason *" 
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs font-bold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
              >
                {allCategories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="Income">Income</option>
                <option value="Bills">Bills</option>
                <option value="People">People</option>
              </select>
            </div>

            <div>
              <DatePicker 
                label="Date *" 
                value={date}
                onChange={(newDate) => setDate(newDate)}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Input 
              label="Note (Optional)" 
              placeholder="Add extra context..." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--color-gray-light)]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold gap-2">
              <Check size={18} />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
