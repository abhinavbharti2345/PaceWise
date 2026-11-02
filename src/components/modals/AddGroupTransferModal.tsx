import { useState, useEffect, useId } from 'react';
import { X, AlertCircle, ArrowRight, ArrowRightLeft, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGroupStore } from '../../store/useGroupStore';
import type { Group } from '../../utils/groupEngine';
import { getTodayDateString } from '../../utils/dateUtils';

interface AddGroupTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  initialFromMemberId?: string;
  initialToMemberId?: string;
  initialAmount?: number;
}

export function AddGroupTransferModal({
  isOpen,
  onClose,
  group,
  initialFromMemberId,
  initialToMemberId,
  initialAmount,
}: AddGroupTransferModalProps) {
  const { addTransfer } = useGroupStore();

  const [fromMemberId, setFromMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const amountInputId = useId();

  const currency = group.currency || '₹';

  useEffect(() => {
    if (isOpen) {
      const defaultFrom = initialFromMemberId || group.members[0]?.id || '';
      const defaultTo =
        initialToMemberId ||
        group.members.find((m) => m.id !== defaultFrom)?.id ||
        '';

      setFromMemberId(defaultFrom);
      setToMemberId(defaultTo);
      setAmount(initialAmount ? initialAmount.toString() : '');
      setDate(getTodayDateString());
      setNote('');
      setError('');
    }
  }, [isOpen, group, initialFromMemberId, initialToMemberId, initialAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a transfer amount greater than 0.');
      return;
    }
    if (!fromMemberId || !toMemberId) {
      setError('Please select both the sender and receiver.');
      return;
    }
    if (fromMemberId === toMemberId) {
      setError('Sender and receiver cannot be the same person.');
      return;
    }

    addTransfer(group.id, {
      fromMemberId,
      toMemberId,
      amount: numAmount,
      date: date || getTodayDateString(),
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-2xl">
              <ArrowRightLeft size={24} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-dark)] tracking-tight">Record Cash / Transfer</h2>
              <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">
                Direct money given between friends in this group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Flow visual */}
          <div className="bg-[var(--color-surface-light)] p-4 rounded-2xl border border-[var(--color-gray-light)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1">
                  Who Gave Money?
                </label>
                <select
                  value={fromMemberId}
                  onChange={(e) => setFromMemberId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--color-gray-light)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.isUser ? 'You' : m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-5 text-[var(--color-gray-dark)] shrink-0">
                <ArrowRight size={20} />
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1">
                  Who Received?
                </label>
                <select
                  value={toMemberId}
                  onChange={(e) => setToMemberId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--color-gray-light)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.isUser ? 'You' : m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor={amountInputId} className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
              Amount ({currency}) <span className="text-[var(--color-primary)]">*</span>
            </label>
            <Input
              id={amountInputId}
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-base font-bold"
              autoFocus
            />
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--color-primary)]" /> Date
                </span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
                Note <span className="text-[10px] font-normal text-[var(--color-gray-dark)]">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Cash, UPI, Petrol advance"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-gray-light)]">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5 font-bold shadow-md">
              Record Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
