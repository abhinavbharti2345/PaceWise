import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, AlertCircle, ShoppingCart, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Person } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { parseLocalDate, getTodayDateString } from '../../utils/dateUtils';
import { EXPENSE_CATEGORIES } from '../../utils/categoryHelpers';
import { cn } from '../../utils/cn';
import { useEffect } from 'react';

interface PersonTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  defaultDirection?: 'gave' | 'took' | 'bought_for_me';
}

export function PersonTransactionModal({
  isOpen,
  onClose,
  person,
  defaultDirection = 'gave'
}: PersonTransactionModalProps) {
  const { recordPersonTransaction } = useStore();
  
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'gave' | 'took' | 'bought_for_me'>(defaultDirection);
  const [category, setCategory] = useState('Groceries');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateString());
      setDirection(defaultDirection);
    }
  }, [isOpen, defaultDirection]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason (e.g. Pizza split, Cab fare, Cash loan)');
      return;
    }

    recordPersonTransaction({
      personId: person.id,
      personName: person.name,
      amount: numAmount,
      direction,
      category: direction === 'bought_for_me' ? category : undefined,
      reason: reason.trim(),
      date: parseLocalDate(date).toISOString(),
      note: note.trim() || undefined,
    });

    setAmount('');
    setReason('');
    setNote('');
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
          <div>
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Transaction with {person.name}</h2>
            <p className="text-xs text-[var(--color-gray-dark)]">Record lending or borrowing</p>
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

          {/* Direction Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
              What happened? *
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[var(--color-surface-light)] p-1 rounded-xl">
              <button 
                type="button"
                className={cn(
                  "py-2.5 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                  direction === 'gave' 
                    ? "bg-[var(--color-surface)] text-[var(--color-success)] shadow-sm" 
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
                onClick={() => setDirection('gave')}
              >
                <ArrowUpRight size={14} />
                <span className="truncate">I Gave</span>
              </button>
              <button 
                type="button"
                className={cn(
                  "py-2.5 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                  direction === 'took' 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm" 
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
                onClick={() => setDirection('took')}
              >
                <ArrowDownRight size={14} />
                <span className="truncate">I Took</span>
              </button>
              <button 
                type="button"
                className={cn(
                  "py-2.5 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                  direction === 'bought_for_me' 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-primary)]/20" 
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
                onClick={() => setDirection('bought_for_me')}
              >
                <ShoppingCart size={14} />
                <span className="truncate">Bought for Me</span>
              </button>
            </div>
          </div>

          {direction === 'bought_for_me' && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
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
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="bg-[var(--color-surface-light)] p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                Amount
              </label>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={direction === 'gave'
                  ? {background: 'var(--positive-bg)', color: 'var(--positive-text)', border: '1px solid var(--positive-border)'}
                  : {background: 'var(--negative-bg)', color: 'var(--negative-text)', border: '1px solid var(--negative-border)'}
                }
              >
                {direction === 'gave' ? `${person.name} will owe you` : `You will owe ${person.name}`}
              </span>
            </div>
            <div className="flex items-center text-4xl sm:text-5xl font-extrabold text-[var(--color-dark)]">
              <span className="text-[var(--color-gray-dark)] mr-2 font-normal">₹</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className={cn(
                  "w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left",
                  direction === 'gave' ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
                )}
                placeholder="0"
              />
            </div>
          </div>
          
          {/* Reason */}
          <div>
            <Input 
              label={direction === 'bought_for_me' ? "What was it? *" : "Reason / Purpose *"}
              placeholder={direction === 'bought_for_me' ? "e.g. Amul Butter & Bread" : "e.g. Lunch split, Movie ticket, Uber ride"}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          {/* Date */}
          <DatePicker 
            label="Date"
            value={date}
            onChange={(newDate) => setDate(newDate)}
          />

          {/* Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Note (Optional)
            </label>
            <input 
              type="text"
              placeholder="Additional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full font-bold text-base shadow-md">
              Save Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
