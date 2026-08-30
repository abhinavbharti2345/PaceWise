import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPersonModal({ isOpen, onClose }: AddPersonModalProps) {
  const { addPerson, recordPersonTransaction } = useStore();
  
  const [name, setName] = useState('');
  const [hasInitialBalance, setHasInitialBalance] = useState(false);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'gave' | 'took'>('gave');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a friend / person name');
      return;
    }

    const numAmount = Number(amount);
    if (hasInitialBalance && (isNaN(numAmount) || numAmount <= 0)) {
      setError('Please enter a valid amount or toggle off initial balance');
      return;
    }

    if (hasInitialBalance && !reason.trim()) {
      setError('Please provide a reason for the initial balance (e.g. Lunch split)');
      return;
    }

    // Add person with 0 initial balance first
    const personId = addPerson({
      name: name.trim(),
      balance: 0,
    });

    // If initial balance was provided, record the formal transaction so history is preserved
    if (hasInitialBalance && numAmount > 0) {
      recordPersonTransaction({
        personId,
        personName: name.trim(),
        amount: numAmount,
        direction,
        reason: reason.trim(),
      });
    }
    
    setName('');
    setAmount('');
    setHasInitialBalance(false);
    setDirection('gave');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="bg-[var(--color-surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[90vh] flex flex-col border border-[var(--color-gray-light)]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Add New Person</h2>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Input 
              label="Person / Friend Name *" 
              placeholder="e.g. Rahul, Sneha, Roommate" 
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          {/* Optional Initial Balance Toggle */}
          <div className="pt-1">
            <div className="flex items-center justify-between p-3 bg-[var(--color-surface-light)] rounded-xl">
              <div>
                <p className="text-xs font-bold text-[var(--color-dark)]">Existing / Starting Balance?</p>
                <p className="text-[11px] text-[var(--color-gray-dark)]">Record money already owed or borrowed</p>
              </div>
              <input 
                type="checkbox"
                checked={hasInitialBalance}
                onChange={(e) => setHasInitialBalance(e.target.checked)}
                className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
            </div>
          </div>

          {hasInitialBalance && (
            <div className="space-y-4 p-4 border border-[var(--color-gray-light)] rounded-2xl bg-[var(--color-surface)] animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
                  Transaction Direction *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-light)] p-1 rounded-xl">
                  <button 
                    type="button"
                    className={cn(
                      "py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                      direction === 'gave' 
                        ? "bg-[var(--color-surface)] text-[var(--color-success)] shadow-sm" 
                        : "text-[var(--color-gray-dark)]"
                    )}
                    onClick={() => setDirection('gave')}
                  >
                    {direction === 'gave' && <Check size={14} />}
                    They Owe Me (+₹)
                  </button>
                  <button 
                    type="button"
                    className={cn(
                      "py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                      direction === 'took' 
                        ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm" 
                        : "text-[var(--color-gray-dark)]"
                    )}
                    onClick={() => setDirection('took')}
                  >
                    {direction === 'took' && <Check size={14} />}
                    I Owe Them (-₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
                  Amount
                </label>
                <div className="flex items-center text-3xl font-bold text-[var(--color-dark)]">
                  <span className="text-[var(--color-gray-dark)] mr-1">₹</span>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left",
                      direction === 'gave' ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
                    )}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Input 
                  label="Reason / What for? *" 
                  placeholder="e.g. Shared Uber, Movie tickets" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full font-bold text-base shadow-md">
              Save Person
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
