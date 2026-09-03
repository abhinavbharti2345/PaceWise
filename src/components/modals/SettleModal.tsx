import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Person } from '../../store/useStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

import type { Transaction } from '../../features/budget/budgetEngine';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  transactionToSettle?: Transaction;
}

export function SettleModal({ isOpen, onClose, person, transactionToSettle }: SettleModalProps) {
  const { settleDebt } = useStore();
  
  const absBalance = Math.abs(person.balance);
  const isPersonOwing = person.balance > 0; // Person owes user -> User will receive money
  
  const [amount, setAmount] = useState(absBalance.toString());
  const [isFullSettlement, setIsFullSettlement] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Update amount when modal opens or transactionToSettle changes
  useEffect(() => {
    if (isOpen) {
      if (transactionToSettle) {
        setAmount(transactionToSettle.amount.toString());
        setIsFullSettlement(false);
      } else {
        setAmount(absBalance.toString());
        setIsFullSettlement(true);
      }
      setNote('');
      setError('');
    }
  }, [isOpen, transactionToSettle, absBalance]);

  if (!isOpen) return null;

  const handleSettleType = (full: boolean) => {
    setIsFullSettlement(full);
    if (full) {
      setAmount(absBalance.toString());
    } else {
      setAmount('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid settlement amount');
      return;
    }

    if (numAmount > absBalance && absBalance > 0) {
      setError(`Amount cannot exceed the current outstanding balance of ₹${absBalance}`);
      return;
    }

    settleDebt({
      personId: person.id,
      personName: person.name,
      amount: numAmount,
      direction: isPersonOwing ? 'received' : 'paid',
      note: note.trim() || undefined,
      expenseCategory: transactionToSettle?.direction === 'bought_for_me' ? (transactionToSettle.category || 'Other') : undefined,
      expenseReason: transactionToSettle?.direction === 'bought_for_me' ? `Settled purchase: ${transactionToSettle.reason}` : undefined,
      settleTransactionId: transactionToSettle?.id,
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
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Settle Balance with {person.name}</h2>
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

          {/* Current Status info */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Current Balance</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className={cn(
                "text-2xl font-extrabold",
                person.balance > 0 ? "text-[var(--color-success)]" : person.balance < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
              )}>
                ₹{absBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-[var(--color-gray-dark)]">
                {person.balance > 0 ? "They owe you" : person.balance < 0 ? "You owe them" : "All settled"}
              </span>
            </div>
          </div>

          {/* Full vs Partial Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
              Settlement Type
            </label>
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
                Full Settlement (₹{absBalance})
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
                Partial Repayment
              </button>
            </div>
          </div>

          {/* Settlement Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Amount to {isPersonOwing ? "Receive" : "Pay"}
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
            {!isFullSettlement && Number(amount) > 0 && Number(amount) < absBalance && (
              <p className="text-xs text-[var(--color-gray-dark)] mt-1.5 font-medium">
                Remaining balance after this will be: <strong className="text-[var(--color-dark)]">₹{(absBalance - Number(amount)).toLocaleString('en-IN')}</strong>
              </p>
            )}
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
      </div>
    </div>
  );
}
