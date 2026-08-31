import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BILL_CATEGORIES } from '../../utils/categoryHelpers';
import { parseLocalDate, getTodayDateString } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { useEffect } from 'react';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBillModal({ isOpen, onClose }: AddBillModalProps) {
  const { addTransaction } = useStore();
  
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(BILL_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateString());
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }
    
    const finalCategory = selectedCategory === 'Other Bill' && customCategory.trim() 
      ? customCategory.trim() 
      : selectedCategory;

    // Record bill transaction. This automatically reduces effectiveTotalBudget in calculateBudget()!
    addTransaction({
      type: 'bill',
      amount: val,
      category: finalCategory,
      reason: reason.trim() || `${finalCategory} Bill Payment`,
      date: parseLocalDate(date).toISOString(),
      note: note.trim() || undefined,
    });
    
    setAmount('');
    setReason('');
    setCustomCategory('');
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Pay / Record Bill</h2>
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

          {/* Amount Card */}
          <div 
            className="p-4 rounded-2xl"
            style={{background: 'var(--negative-bg)', border: '1px solid var(--negative-border)'}}
          >
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{color: 'var(--negative-text)'}}>
                Bill Amount
              </label>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{background: 'var(--negative-bg)', color: 'var(--negative-text)', border: '1px solid var(--negative-border)'}}
              >
                Reduces Monthly Pool
              </span>
            </div>
            <div className="flex items-center text-4xl sm:text-5xl font-extrabold text-[var(--color-primary)]">
              <span className="mr-2 font-normal" style={{color: 'var(--negative-text)', opacity: 0.7}}>₹</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left placeholder:text-[var(--color-gray-light)] text-[var(--color-primary)]"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>
          
          {/* Bill Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
              Bill Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BILL_CATEGORIES.map((bill) => {
                const isSelected = selectedCategory === bill.name;
                return (
                  <button
                    key={bill.name}
                    type="button"
                    onClick={() => setSelectedCategory(bill.name)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left truncate",
                      isSelected 
                        ? "bg-[var(--color-dark)] text-[var(--color-surface)] border-[var(--color-dark)] shadow-sm"
                        : "bg-[var(--color-surface)] text-[var(--color-gray-dark)] border-[var(--color-gray-light)] hover:border-gray-400"
                    )}
                  >
                    <span className="truncate">{bill.name}</span>
                    {isSelected && <Check size={12} className="ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedCategory === 'Other Bill' && (
              <div className="mt-2">
                <Input 
                  placeholder="Specify bill name..." 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            )}
          </div>
          
          {/* Description */}
          <div>
            <Input 
              label="Description / Provider" 
              placeholder="e.g. HDFC Credit Card, Airtel Fiber" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Date Paid
            </label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Note (Optional)
            </label>
            <input 
              type="text"
              placeholder="Due date reference, transaction ID, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full font-bold text-base shadow-md">
              Record Bill Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
