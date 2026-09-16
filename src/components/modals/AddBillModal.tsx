import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { CategorySelector } from '../ui/CategorySelector';
import { getAllBillCategories } from '../../utils/categoryHelpers';
import { AddCategoryModal } from './AddCategoryModal';
import { parseLocalDate, getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBillModal({ isOpen, onClose }: AddBillModalProps) {
  const { 
    addTransaction, 
    customBillCategories = [], 
    hiddenCategories = [], 
    billCategoryOrder = [] 
  } = useStore();
  
  const allBillCategories = getAllBillCategories(customBillCategories, hiddenCategories, billCategoryOrder);
  
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(allBillCategories[0]?.name || 'Credit Card');
  const [customCategory, setCustomCategory] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
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
      date: parseLocalDate(date, time).toISOString(),
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
    <>
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

            {/* Amount Input */}
            <div className="p-4 rounded-2xl bg-[var(--color-negative-bg)] border border-[var(--color-negative-border)]">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-negative-text)]">
                  Bill Amount
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-negative-bg)] text-[var(--color-negative-text)] border border-[var(--color-negative-border)]">
                  Reduces Monthly Pool
                </span>
              </div>
              <div className="flex items-center text-4xl sm:text-5xl font-extrabold text-[var(--color-primary)]">
                <span className="mr-2 font-normal shrink-0 whitespace-nowrap inline-flex items-center text-[var(--color-negative-text)] opacity-70">₹</span>
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
              <CategorySelector
                label="Bill Type *"
                categories={allBillCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={(catName) => setSelectedCategory(catName)}
                type="bill"
                onAddCustomClick={() => setIsAddCategoryOpen(true)}
                customButtonText="Custom"
                columnsClass="grid-cols-2"
              />

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

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <DatePicker 
                label="Date Paid"
                value={date}
                onChange={(newDate) => setDate(newDate)}
              />
              <TimePicker
                label="Time"
                value={time}
                onChange={(newTime) => setTime(newTime)}
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

      <AddCategoryModal 
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        categoryType="bill"
        title="Add Custom Bill Type"
        onCategoryAdded={(newCat) => {
          setSelectedCategory(newCat);
        }}
      />
    </>
  );
}

