import { useState } from 'react';
import { X, Check, ArrowRight, Share2, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGroupStore } from '../../store/useGroupStore';
import { calculateGroupSummary, formatWhatsAppSummary, type Group, type SettlementTransfer } from '../../utils/groupEngine';
import { getTodayDateString } from '../../utils/dateUtils';

interface GroupSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export function GroupSettleModal({ isOpen, onClose, group }: GroupSettleModalProps) {
  const { addTransfer, setGroupStatus } = useGroupStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currency = group.currency || '₹';
  const summary = calculateGroupSummary(group);

  const handleMarkPaid = (s: SettlementTransfer) => {
    addTransfer(group.id, {
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
      date: getTodayDateString(),
      note: 'Settled via Settle Up',
    });
  };

  const handleCopyWhatsApp = async () => {
    const text = formatWhatsAppSummary(group, currency);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleGroupSettled = () => {
    const newStatus = group.status === 'settled' ? 'active' : 'settled';
    setGroupStatus(group.id, newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Sparkles size={24} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-dark)] tracking-tight">Settle Up & Balances</h2>
              <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">
                {group.emoji} {group.name}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {/* Quick summary stats */}
          <div className="grid grid-cols-2 gap-3 bg-[var(--color-surface-light)] p-3.5 rounded-2xl border border-[var(--color-gray-light)]">
            <div>
              <p className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">Total Spent</p>
              <p className="text-lg font-extrabold text-[var(--color-dark)]">
                {currency}{summary.totalSpent.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">Your Position</p>
              <p
                className={`text-lg font-extrabold ${
                  summary.userNet > 0
                    ? 'text-[var(--color-success)]'
                    : summary.userNet < 0
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-gray-dark)]'
                }`}
              >
                {summary.userNet > 0
                  ? `+${currency}${summary.userNet.toLocaleString('en-IN')}`
                  : summary.userNet < 0
                  ? `-${currency}${Math.abs(summary.userNet).toLocaleString('en-IN')}`
                  : 'Settled'}
              </p>
            </div>
          </div>

          {/* Settlements List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">
                Minimum Transfers to Settle Up
              </h3>
              <span className="text-[11px] text-[var(--color-gray-dark)] font-medium">
                Smart Debt Simplification
              </span>
            </div>

            {summary.settlements.length === 0 ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-sm font-bold text-[var(--color-dark)]">All Settled Up!</h4>
                <p className="text-xs text-[var(--color-gray-dark)] max-w-xs mx-auto">
                  Everyone is square. There are no pending debts in this group.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.settlements.map((s, idx) => (
                  <div
                    key={`${s.fromMemberId}-${s.toMemberId}-${idx}`}
                    className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-2xl shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-[var(--color-dark)] truncate">{s.fromName}</span>
                      <ArrowRight size={14} className="text-[var(--color-gray-dark)] shrink-0" />
                      <span className="text-xs font-bold text-[var(--color-dark)] truncate">{s.toName}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-extrabold text-[var(--color-dark)]">
                        {currency}{s.amount.toLocaleString('en-IN')}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkPaid(s)}
                        className="h-8 px-2.5 text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Check size={14} className="mr-1" />
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member balance details table */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider mb-2">
              All Members Balance Summary
            </h3>
            <div className="border border-[var(--color-gray-light)] rounded-2xl overflow-hidden divide-y divide-[var(--color-gray-light)]">
              {summary.balances.map((b) => (
                <div key={b.memberId} className="p-3 flex items-center justify-between text-xs bg-[var(--color-surface)]">
                  <div>
                    <span className="font-bold text-[var(--color-dark)]">
                      {b.name} {b.isUser && '(You)'}
                    </span>
                    <p className="text-[10px] text-[var(--color-gray-dark)] mt-0.5">
                      Paid: {currency}{b.totalPaid.toLocaleString('en-IN')} · Share: {currency}{b.totalShare.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-extrabold ${
                        b.netBalance > 0
                          ? 'text-[var(--color-success)]'
                          : b.netBalance < 0
                          ? 'text-[var(--color-primary)]'
                          : 'text-[var(--color-gray-dark)]'
                      }`}
                    >
                      {b.netBalance > 0
                        ? `Gets back ${currency}${b.netBalance.toLocaleString('en-IN')}`
                        : b.netBalance < 0
                        ? `Owes ${currency}${Math.abs(b.netBalance).toLocaleString('en-IN')}`
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-gray-light)] shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyWhatsApp}
            className={`w-full sm:w-auto rounded-xl font-bold gap-2 text-xs h-10 ${
              copied ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''
            }`}
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share to WhatsApp'}</span>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleToggleGroupSettled}
              className="rounded-xl text-xs font-bold text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
            >
              {group.status === 'settled' ? 'Re-open Group' : 'Mark Entire Group Settled'}
            </Button>
            <Button type="button" variant="primary" onClick={onClose} className="rounded-xl font-bold px-4 text-xs h-10">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
