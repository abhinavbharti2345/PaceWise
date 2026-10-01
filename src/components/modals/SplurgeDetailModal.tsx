import { 
  X, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  User, 
  Edit3, 
  TrendingDown,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currencyUtils';
import type { Transaction } from '../../features/budget/budgetEngine';

interface SplurgeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEditTransaction?: (tx: Transaction) => void;
}

export function SplurgeDetailModal({
  isOpen,
  onClose,
  transaction,
  onEditTransaction
}: SplurgeDetailModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[85dvh] sm:max-h-[80vh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
              <ShoppingBag size={18} />
            </div>
            <h2 className="font-extrabold text-[var(--color-dark)] text-base sm:text-lg tracking-tight">
              Splurge Details
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          
          {/* Main Hero Amount Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-surface-light)] to-[var(--color-surface)] border border-[var(--color-gray-light)] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Amount Spent</span>
            <div className="text-3xl sm:text-4xl font-black text-[var(--color-primary)] tracking-tight">
              - {formatCurrency(transaction.amount)}
            </div>
            <div className="text-xs font-bold text-[var(--color-dark)] pt-1">
              {transaction.reason || transaction.category || 'Purchase'}
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-light)]">
              <span className="text-[var(--color-gray-dark)] font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Date & Time
              </span>
              <span className="font-bold text-[var(--color-dark)]">
                {format(new Date(transaction.date), 'MMMM dd, yyyy · hh:mm a')}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-light)]">
              <span className="text-[var(--color-gray-dark)] font-medium flex items-center gap-1.5">
                <TrendingDown size={14} /> Category
              </span>
              <span className="font-bold text-[var(--color-dark)] px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-gray-light)]">
                {transaction.category || 'Other'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-light)]">
              <span className="text-[var(--color-gray-dark)] font-medium flex items-center gap-1.5">
                <CreditCard size={14} /> Payment Method
              </span>
              <span className="font-bold text-[var(--color-dark)]">
                {transaction.paymentMethod || 'UPI / Card'}
              </span>
            </div>

            {transaction.personName && (
              <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-light)]">
                <span className="text-[var(--color-gray-dark)] font-medium flex items-center gap-1.5">
                  <User size={14} /> Involves Person
                </span>
                <span className="font-bold text-[var(--color-primary)]">
                  {transaction.personName}
                </span>
              </div>
            )}

            {transaction.note && (
              <div className="pt-1">
                <span className="text-[var(--color-gray-dark)] font-medium flex items-center gap-1.5 mb-1">
                  <FileText size={14} /> Note
                </span>
                <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] font-medium text-[var(--color-dark)]">
                  {transaction.note}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            {onEditTransaction && (
              <button
                type="button"
                onClick={() => {
                  onEditTransaction(transaction);
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Edit3 size={14} /> Edit Transaction
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[var(--color-dark)] font-bold text-xs hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
