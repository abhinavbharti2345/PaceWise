import { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { cn } from '../../utils/cn';
import { parseLocalDate, getTodayDateString } from '../../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currencyUtils';
import { format } from 'date-fns';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InitialTransactionItem {
  id: string;
  direction: 'gave' | 'took';
  amount: string;
  reason: string;
  date: string;
}

const createEmptyTransactionItem = (): InitialTransactionItem => ({
  id: Math.random().toString(36).substring(2, 9),
  direction: 'gave',
  amount: '',
  reason: '',
  date: getTodayDateString(),
});

export function AddPersonModal({ isOpen, onClose }: AddPersonModalProps) {
  const { people, config, addPerson, recordPersonTransaction } = useStore();
  
  const [name, setName] = useState('');
  const [hasInitialBalance, setHasInitialBalance] = useState(false);
  const [initialTransactions, setInitialTransactions] = useState<InitialTransactionItem[]>([
    createEmptyTransactionItem()
  ]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const formatCurrency = (val: number) => formatCurrencyUtil(val, config.currency || '₹');

  useEffect(() => {
    if (isOpen) {
      const initialItem = createEmptyTransactionItem();
      setHasInitialBalance(false);
      setName('');
      setInitialTransactions([initialItem]);
      setExpandedItemId(initialItem.id);
      setError('');
    }
  }, [isOpen]);

  const trimmedName = name.trim();
  const existingPerson = trimmedName 
    ? people.find(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase())
    : undefined;
  
  if (!isOpen) return null;

  const updateTransactionItem = (id: string, field: keyof InitialTransactionItem, value: any) => {
    setInitialTransactions(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (error) setError('');
  };

  const addTransactionRow = () => {
    const newItem = createEmptyTransactionItem();
    setInitialTransactions(prev => [...prev, newItem]);
    // Auto collapse previous and expand newly added item
    setExpandedItemId(newItem.id);
  };

  const removeTransactionRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (initialTransactions.length <= 1) {
      const fresh = createEmptyTransactionItem();
      setInitialTransactions([fresh]);
      setExpandedItemId(fresh.id);
    } else {
      setInitialTransactions(prev => {
        const next = prev.filter(item => item.id !== id);
        if (expandedItemId === id) {
          setExpandedItemId(next[next.length - 1]?.id || null);
        }
        return next;
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  // Live computed net balance
  const netBalance = initialTransactions.reduce((acc, item) => {
    const amt = Number(item.amount);
    if (!isNaN(amt) && amt > 0) {
      return item.direction === 'gave' ? acc + amt : acc - amt;
    }
    return acc;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) {
      setError('Please enter a friend / person name');
      return;
    }

    if (existingPerson) {
      setError(`A person named "${existingPerson.name}" already exists. Please use a unique name or nickname.`);
      return;
    }

    if (hasInitialBalance) {
      const validItems = initialTransactions.filter(item => item.amount.trim() || item.reason.trim());
      
      if (validItems.length === 0) {
        setError('Please enter at least one transaction amount and reason, or uncheck initial balance');
        return;
      }

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const numAmount = Number(item.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          setError(`Please enter a valid amount for Transaction #${i + 1}`);
          setExpandedItemId(item.id);
          return;
        }
        if (!item.reason.trim()) {
          setError(`Please provide a reason for Transaction #${i + 1} (e.g. Shared Uber)`);
          setExpandedItemId(item.id);
          return;
        }
      }
    }

    // Add person with 0 initial balance first
    const personId = addPerson({
      name: trimmedName,
      balance: 0,
    });

    // If initial balance transactions were provided, record each transaction in order
    if (hasInitialBalance) {
      const validItems = initialTransactions.filter(item => {
        const num = Number(item.amount);
        return !isNaN(num) && num > 0 && item.reason.trim();
      });

      for (const item of validItems) {
        const txDate = item.date ? parseLocalDate(item.date).toISOString() : new Date().toISOString();
        recordPersonTransaction({
          personId,
          personName: trimmedName,
          amount: Number(item.amount),
          direction: item.direction,
          reason: item.reason.trim(),
          date: txDate,
        });
      }
    }
    
    const fresh = createEmptyTransactionItem();
    setName('');
    setHasInitialBalance(false);
    setInitialTransactions([fresh]);
    setExpandedItemId(fresh.id);
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 max-h-[85dvh] sm:max-h-[90vh] flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <h2 className="font-bold text-[var(--color-dark)] text-lg">Add New Person</h2>
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

          <div>
            <Input 
              label="Person / Friend Name *" 
              placeholder="e.g. Rahul, Sneha, Roommate" 
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />
            {existingPerson && (
              <div className="mt-2 flex items-start gap-2 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  <strong>"{existingPerson.name}"</strong> already exists in your People list. Use a nickname or last name to distinguish them.
                </span>
              </div>
            )}
          </div>

          {/* Optional Initial Balance Toggle */}
          <div className="pt-1">
            <div className="flex items-center justify-between p-3.5 bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-gray-light)]">
              <div>
                <p className="text-xs font-bold text-[var(--color-dark)]">Existing / Starting Balance?</p>
                <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">Record one or multiple past loans & expenses</p>
              </div>
              <input 
                type="checkbox"
                checked={hasInitialBalance}
                onChange={(e) => {
                  setHasInitialBalance(e.target.checked);
                  if (e.target.checked && !expandedItemId) {
                    setExpandedItemId(initialTransactions[0]?.id || null);
                  }
                }}
                className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
            </div>
          </div>

          {/* Multiple Existing Transactions List with Auto-Collapse Accordion */}
          {hasInitialBalance && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-gray-dark)]">
                  Past Transactions ({initialTransactions.length})
                </label>
                <button
                  type="button"
                  onClick={addTransactionRow}
                  className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Transaction</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {initialTransactions.map((item, index) => {
                  const isExpanded = expandedItemId === item.id;
                  const itemAmountNum = Number(item.amount);
                  const hasAmount = !isNaN(itemAmountNum) && itemAmountNum > 0;
                  
                  let formattedDate = item.date;
                  try {
                    formattedDate = format(parseLocalDate(item.date), 'dd MMM yyyy');
                  } catch {
                    formattedDate = item.date;
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "border rounded-2xl transition-all overflow-hidden shadow-xs",
                        isExpanded 
                          ? "border-[var(--color-gray-light)] bg-[var(--color-surface)] p-4 space-y-3.5" 
                          : "border-[var(--color-gray-light)] bg-[var(--color-surface)] hover:border-gray-400 p-3"
                      )}
                    >
                      {/* Header / Summary Bar */}
                      <div 
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xs font-black text-[var(--color-dark)] bg-[var(--color-surface-light)] px-2.5 py-1 rounded-lg border border-[var(--color-gray-light)] shrink-0">
                            #{index + 1}
                          </span>

                          {!isExpanded ? (
                            <div className="truncate flex-1 min-w-0">
                              <p className="text-xs font-bold text-[var(--color-dark)] truncate">
                                {item.reason.trim() || `Transaction #${index + 1}`}
                              </p>
                              <p className="text-[11px] text-[var(--color-gray-dark)] font-medium mt-0.5 truncate">
                                {formattedDate} • <span className={item.direction === 'gave' ? "text-[var(--color-success)] font-bold" : "text-[var(--color-primary)] font-bold"}>{item.direction === 'gave' ? 'They owe you' : 'You owe them'}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-[var(--color-dark)]">
                              {item.reason.trim() || `Transaction #${index + 1}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isExpanded && (
                            hasAmount ? (
                              <span className={cn(
                                "text-xs font-black px-2.5 py-1 rounded-lg border shadow-xs",
                                item.direction === 'gave' 
                                  ? "bg-[var(--color-surface-light)] text-[var(--color-success)] border-[var(--color-gray-light)]"
                                  : "bg-[var(--color-surface-light)] text-[var(--color-primary)] border-[var(--color-gray-light)]"
                              )}>
                                {item.direction === 'gave' ? '+' : '-'}{formatCurrency(itemAmountNum)}
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-[var(--color-gray-dark)] px-2 py-0.5 rounded-md bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
                                Set amount
                              </span>
                            )
                          )}

                          {initialTransactions.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => removeTransactionRow(item.id, e)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remove transaction"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="p-1 rounded-lg text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Full Form */}
                      {isExpanded && (
                        <div className="space-y-3.5 pt-1 animate-in fade-in duration-150">
                          {/* Direction toggle */}
                          <div>
                            <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-light)] p-1 rounded-xl border border-[var(--color-gray-light)]">
                              <button 
                                type="button"
                                className={cn(
                                  "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                  item.direction === 'gave' 
                                    ? "bg-[var(--color-surface)] text-[var(--color-success)] shadow-sm font-black" 
                                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                                )}
                                onClick={() => updateTransactionItem(item.id, 'direction', 'gave')}
                              >
                                {item.direction === 'gave' && <Check size={14} />}
                                They Owe Me (+₹)
                              </button>
                              <button 
                                type="button"
                                className={cn(
                                  "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                  item.direction === 'took' 
                                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm font-black" 
                                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                                )}
                                onClick={() => updateTransactionItem(item.id, 'direction', 'took')}
                              >
                                {item.direction === 'took' && <Check size={14} />}
                                I Owe Them (-₹)
                              </button>
                            </div>
                          </div>

                          {/* Amount Input */}
                          <div className="p-3 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)]">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-0.5">
                              Amount *
                            </label>
                            <div className="flex items-center text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)]">
                              <span className="text-[var(--color-gray-dark)] mr-1.5 font-normal text-xl">₹</span>
                              <input 
                                type="number" 
                                inputMode="decimal"
                                value={item.amount}
                                onChange={(e) => updateTransactionItem(item.id, 'amount', e.target.value)}
                                className={cn(
                                  "w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-left font-extrabold",
                                  item.direction === 'gave' ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
                                )}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Reason & Date Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input 
                              label="Reason / What for? *" 
                              placeholder="e.g. Shared Uber, Dinner" 
                              value={item.reason}
                              onChange={(e) => updateTransactionItem(item.id, 'reason', e.target.value)}
                            />

                            <DatePicker 
                              label="Date" 
                              value={item.date}
                              onChange={(newDate) => updateTransactionItem(item.id, 'date', newDate)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add row button */}
              <button
                type="button"
                onClick={addTransactionRow}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[var(--color-gray-light)] hover:border-[var(--color-primary)] text-xs font-bold text-[var(--color-gray-dark)] hover:text-[var(--color-primary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-[var(--color-surface)] shadow-xs"
              >
                <Plus size={14} />
                <span>Add Another Past Transaction</span>
              </button>

              {/* Real-time Net Balance summary banner */}
              <div className={cn(
                "p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all",
                netBalance > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                  : netBalance < 0
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                  : "bg-[var(--color-surface-light)] border-[var(--color-gray-light)] text-[var(--color-dark)]"
              )}>
                <div>
                  <p className="font-bold">Calculated Starting Balance</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {netBalance > 0
                      ? `${trimmedName || 'They'} will owe you ${formatCurrency(netBalance)}`
                      : netBalance < 0
                      ? `You will owe ${trimmedName || 'them'} ${formatCurrency(Math.abs(netBalance))}`
                      : 'All transactions balanced (₹0 net)'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black">
                    {netBalance > 0 ? `+${formatCurrency(netBalance)}` : formatCurrency(netBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full font-bold text-base shadow-md cursor-pointer">
              Save Person
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
