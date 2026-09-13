import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { CategorySelector } from '../ui/CategorySelector';
import { getAllIncomeCategories } from '../../utils/categoryHelpers';
import { AddCategoryModal } from './AddCategoryModal';
import { parseLocalDate, getTodayDateString } from '../../utils/dateUtils';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMoneyModal({ isOpen, onClose }: AddMoneyModalProps) {
  const { 
    addTransaction,
    customIncomeCategories = [],
    hiddenCategories = [],
    incomeCategoryOrder = []
  } = useStore();
  
  const allIncomeCategories = getAllIncomeCategories(customIncomeCategories, hiddenCategories, incomeCategoryOrder);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedSource, setSelectedSource] = useState(allIncomeCategories[0]?.name || 'Parents');
  const [customSource, setCustomSource] = useState('');
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
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    const finalSource = selectedSource === 'Gift / Other' && customSource.trim() 
      ? customSource.trim() 
      : selectedSource;

    // Record income transaction. This automatically feeds into calculateBudget() effectiveTotalBudget!
    addTransaction({
      type: 'income',
      amount: val,
      category: finalSource,
      source: finalSource,
      reason: reason.trim() || `Received money from ${finalSource}`,
      date: parseLocalDate(date).toISOString(),
      note: note.trim() || undefined,
    });
    
    setAmount('');
    setReason('');
    setCustomSource('');
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
              <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
              <h2 className="font-bold text-[var(--color-dark)] text-lg">Add Money (Income)</h2>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)] cursor-pointer"
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
              style={{background: 'var(--positive-bg)', border: '1px solid var(--positive-border)'}}
            >
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{color: 'var(--positive-text)'}}
              >
                Money Received
              </label>
              <div className="flex items-center text-4xl sm:text-5xl font-extrabold text-[var(--color-success)]">
                <span className="mr-2 font-normal shrink-0 whitespace-nowrap inline-flex items-center text-[var(--color-success)]">+₹</span>
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left text-[var(--color-success)] placeholder:text-[var(--color-success)]/40"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Source Selection */}
            <div>
              <CategorySelector
                label="Income Source *"
                categories={allIncomeCategories}
                selectedCategory={selectedSource}
                onSelectCategory={(catName) => setSelectedSource(catName)}
                type="income"
                onAddCustomClick={() => setIsAddCategoryOpen(true)}
                customButtonText="Custom"
                columnsClass="grid-cols-2"
              />

              {selectedSource === 'Gift / Other' && (
                <div className="mt-2">
                  <Input 
                    placeholder="Specify source..." 
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                </div>
              )}
            </div>
          
          {/* Description */}
          <div>
            <Input 
              label="Description / Reason" 
              placeholder="e.g. Monthly Pocket Money from Mom" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Date */}
          <DatePicker 
            label="Date Received"
            value={date}
            onChange={(newDate) => setDate(newDate)}
          />

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Note (Optional)
            </label>
            <input 
              type="text"
              placeholder="Any additional notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] touch-manipulation"
            />
          </div>
          
            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full font-bold text-base shadow-md" style={{background: 'var(--positive-accent)'}}>
                Add to Budget
              </Button>
            </div>
          </form>
        </div>
      </div>

      <AddCategoryModal 
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        categoryType="income"
        title="Add Custom Income Source"
        onCategoryAdded={(newCat) => {
          setSelectedSource(newCat);
        }}
      />
    </>
  );
}
