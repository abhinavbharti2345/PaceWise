import { useState, useId, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share } from '@capacitor/share';
import {
  ArrowLeft,
  Plus,
  ArrowRightLeft,
  Share2,
  Receipt,
  Users,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  UserPlus,
  Check,
  Camera,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useGroupStore } from '../store/useGroupStore';
import { calculateGroupSummary, formatWhatsAppSummary } from '../utils/groupEngine';
import { AddGroupExpenseModal } from '../components/modals/AddGroupExpenseModal';
import { AddGroupTransferModal } from '../components/modals/AddGroupTransferModal';
import { GroupSettleModal } from '../components/modals/GroupSettleModal';
import { ReceiptModal } from '../components/modals/ReceiptModal';
import { ReceiptPickerModal } from '../components/modals/ReceiptPickerModal';
import { captureReceipt } from '../lib/receiptStorage';
import type { GroupExpense } from '../utils/groupEngine';

// Moved to module scope so it is not re-created on every render
type ActivityItem =
  | { type: 'expense'; data: import('../utils/groupEngine').GroupExpense; sortTime: number }
  | { type: 'transfer'; data: import('../utils/groupEngine').GroupTransfer; sortTime: number };

export function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, addMember, deleteExpense, deleteTransfer, attachExpenseReceipt } = useGroupStore();

  const group = groups.find((g) => g.id === id);

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [activityTab, setActivityTab] = useState<'all' | 'expenses' | 'transfers'>('all');
  const [copied, setCopied] = useState(false);
  const [activeReceiptExpense, setActiveReceiptExpense] = useState<GroupExpense | null>(null);
  const [pickerExpense, setPickerExpense] = useState<GroupExpense | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);
  const newMemberInputId = useId();

  if (!group) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-dark)]">Group or Trip Not Found</h2>
        <p className="text-xs text-[var(--color-gray-dark)]">
          This group may have been deleted or the link is invalid.
        </p>
        <Button variant="primary" onClick={() => navigate('/groups')} className="rounded-xl text-xs font-bold">
          ← Back to All Groups
        </Button>
      </div>
    );
  }

  const currency = group.currency || '₹';
  const summary = calculateGroupSummary(group);

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    addMember(group.id, trimmed);
    setNewMemberName('');
    setIsAddMemberOpen(false);
  };

  const handleShareSummary = async () => {
    const text = formatWhatsAppSummary(group, currency);
    const title = `${group.name} — Expense Breakdown`;

    // 1. Try Native Capacitor Share Drawer (Android)
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title,
          text,
          dialogTitle: `Share ${group.name} Summary`,
        });
        return;
      }
    } catch (err) {
      console.debug('Capacitor Share unavailable, falling back:', err);
    }

    // 2. Try Standard Browser Web Share API
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (err: any) {
        // User dismissed share dialog
        if (err.name === 'AbortError') return;
      }
    }

    // 3. Desktop / Unsupported Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDeleteExpense = (expenseId: string, desc: string) => {
    if (window.confirm(`Delete expense "${desc}"?`)) {
      deleteExpense(group.id, expenseId);
    }
  };

  const handleDeleteTransfer = (transferId: string) => {
    if (window.confirm('Delete this cash transfer record?')) {
      deleteTransfer(group.id, transferId);
    }
  };

  // Combine expenses and transfers into a unified chronological feed
  const activities: ActivityItem[] = [
    ...group.expenses.map((e) => ({
      type: 'expense' as const,
      data: e,
      sortTime: new Date(e.createdAt || e.date).getTime(),
    })),
    ...group.transfers.map((t) => ({
      type: 'transfer' as const,
      data: t,
      sortTime: new Date(t.createdAt || t.date).getTime(),
    })),
  ].sort((a, b) => b.sortTime - a.sortTime);

  const filteredActivities = activities.filter((act) => {
    if (activityTab === 'expenses') return act.type === 'expense';
    if (activityTab === 'transfers') return act.type === 'transfer';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-all"
            title="Back to Groups"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl p-1.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-2xl">
              {group.emoji || '🏖️'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-dark)] tracking-tight">
                  {group.name}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    group.status === 'settled'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-blue-500/10 text-blue-600'
                  }`}
                >
                  {group.status === 'settled' ? 'Settled' : 'Active'}
                </span>
              </div>
              {group.description && (
                <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareSummary}
            className={`rounded-xl text-xs font-bold gap-1.5 h-9 ${
              copied ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? 'Copied!' : 'Share Summary'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSettleOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            <Sparkles size={14} />
            <span>Settle Up</span>
          </Button>
        </div>
      </div>

      {/* Main Stats Card */}
      <Card className="p-5 sm:p-6 border border-[var(--color-gray-light)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-light)] space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[var(--color-gray-light)]">
          <div>
            <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
              Total Group Spend
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)]">
              {currency}{summary.totalSpent.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
              You Actually Paid
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)]">
              {currency}{summary.userPaid.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
              Your Fair Share
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)]">
              {currency}{summary.userShare.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
              Your Net Position
            </span>
            {summary.userNet > 0 ? (
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-success)] flex items-center gap-1">
                <ArrowDownRight size={20} />
                +{currency}{summary.userNet.toLocaleString('en-IN')}
              </span>
            ) : summary.userNet < 0 ? (
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-primary)] flex items-center gap-1">
                <ArrowUpRight size={20} />
                -{currency}{Math.abs(summary.userNet).toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-gray-dark)] flex items-center gap-1">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Settled
              </span>
            )}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsExpenseOpen(true)}
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 shadow-md"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2"
          >
            <ArrowRightLeft size={16} />
            <span>Record Cash / Transfer</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsAddMemberOpen(true)}
            className="rounded-xl px-3 py-2 text-xs font-bold gap-1.5 text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </Button>
        </div>
      </Card>

      {/* Inline Add Member Box */}
      {isAddMemberOpen && (
        <form
          onSubmit={handleAddMemberSubmit}
          className="p-4 bg-[var(--color-surface)] border border-[var(--color-primary)]/40 rounded-2xl flex items-center gap-3 animate-in fade-in"
        >
          <div className="flex-1">
            <label htmlFor={newMemberInputId} className="text-[11px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1">
              Friend's Name
            </label>
            <Input
              id={newMemberInputId}
              type="text"
              placeholder="e.g. Sneha"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full text-xs font-bold"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddMemberOpen(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="rounded-xl text-xs font-bold">
              Add
            </Button>
          </div>
        </form>
      )}

      {/* Members & Balances Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} className="text-[var(--color-primary)]" />
            Members & Balances ({group.members.length})
          </h2>
          <button
            onClick={() => setIsSettleOpen(true)}
            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            View Simplified Settlements →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {summary.balances.map((b) => (
            <Card key={b.memberId} className="p-3.5 border border-[var(--color-gray-light)] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--color-dark)] truncate">
                  {b.name} {b.isUser && '(You)'}
                </span>
                <span
                  className={`text-[11px] font-extrabold ${
                    b.netBalance > 0
                      ? 'text-[var(--color-success)]'
                      : b.netBalance < 0
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-gray-dark)]'
                  }`}
                >
                  {b.netBalance > 0
                    ? `+${currency}${b.netBalance.toLocaleString('en-IN')}`
                    : b.netBalance < 0
                    ? `-${currency}${Math.abs(b.netBalance).toLocaleString('en-IN')}`
                    : 'Settled'}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-[var(--color-gray-dark)] flex items-center justify-between">
                <span>Paid: {currency}{b.totalPaid.toLocaleString('en-IN')}</span>
                <span>Share: {currency}{b.totalShare.toLocaleString('en-IN')}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">
            Activity & Expenses Log ({activities.length})
          </h2>

          <div className="flex bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-gray-light)] text-xs font-bold self-start sm:self-auto">
            {(['all', 'expenses', 'transfers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivityTab(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  activityTab === tab
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl space-y-3">
            <Receipt size={32} className="mx-auto text-[var(--color-gray-dark)] opacity-40" />
            <p className="text-xs font-bold text-[var(--color-gray-dark)]">
              No transactions logged yet in this space.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpenseOpen(true)}
              className="rounded-xl text-xs font-bold"
            >
              <Plus size={14} className="mr-1" />
              Add First Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredActivities.map((act) => {
              if (act.type === 'expense') {
                const exp = act.data;
                const payer = group.members.find((m) => m.id === exp.payerId);
                const userSplit = exp.splits.find((s) => {
                  const m = group.members.find((mem) => mem.id === s.memberId);
                  return m?.isUser;
                });

                return (
                  <Card
                    key={exp.id}
                    className="p-4 border border-[var(--color-gray-light)] flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-center justify-center text-lg shrink-0">
                        {exp.category?.includes('Food')
                          ? '🍕'
                          : exp.category?.includes('Stay')
                          ? '🏨'
                          : exp.category?.includes('Transport')
                          ? '🚗'
                          : exp.category?.includes('Activities')
                          ? '🏄'
                          : '🧾'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-sm font-bold text-[var(--color-dark)] truncate">
                            {exp.description}
                          </h4>
                          {exp.receiptId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickerExpense(exp);
                              }}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#FF453A]/15 text-[#FF453A] hover:bg-[#FF453A]/25 transition-colors cursor-pointer shrink-0"
                              title="Receipt attached • Tap options"
                            >
                              <Receipt size={12} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickerExpense(exp);
                              }}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-surface-light)] hover:bg-[var(--color-primary)]/10 text-[var(--color-gray-dark)] hover:text-[var(--color-primary)] transition-colors cursor-pointer shrink-0"
                              title="Attach receipt"
                            >
                              <Camera size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-gray-dark)] flex items-center gap-2 mt-0.5">
                          <span>Paid by <strong className="text-[var(--color-dark)]">{payer?.isUser ? 'You' : payer?.name || 'Someone'}</strong></span>
                          <span>•</span>
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span>Split: {exp.splits.length} people</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[var(--color-dark)] block">
                          {currency}{exp.amount.toLocaleString('en-IN')}
                        </span>
                        {userSplit ? (
                          <span className="text-[10px] font-semibold text-[var(--color-gray-dark)]">
                            Your share: {currency}{userSplit.amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[var(--color-gray-dark)] italic">
                            Not in split
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        className="p-1.5 text-[var(--color-gray-dark)] hover:text-red-500 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete Expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                );
              } else {
                const tr = act.data;
                const fromMem = group.members.find((m) => m.id === tr.fromMemberId);
                const toMem = group.members.find((m) => m.id === tr.toMemberId);

                return (
                  <Card
                    key={tr.id}
                    className="p-4 border border-[var(--color-gray-light)] bg-[var(--color-surface-light)]/40 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowRightLeft size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[var(--color-dark)] flex items-center gap-1.5">
                          <span>{fromMem?.isUser ? 'You' : fromMem?.name}</span>
                          <span className="text-[var(--color-gray-dark)] font-normal">paid</span>
                          <span>{toMem?.isUser ? 'You' : toMem?.name}</span>
                        </h4>
                        <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">
                          {tr.date} {tr.note && `• ${tr.note}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-extrabold text-emerald-600">
                        +{currency}{tr.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleDeleteTransfer(tr.id)}
                        className="p-1.5 text-[var(--color-gray-dark)] hover:text-red-500 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete Transfer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddGroupExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        group={group}
      />

      <AddGroupTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        group={group}
      />

      <GroupSettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        group={group}
      />

      <ReceiptModal
        isOpen={Boolean(activeReceiptExpense?.receiptId)}
        onClose={() => setActiveReceiptExpense(null)}
        receiptId={activeReceiptExpense?.receiptId}
        title={activeReceiptExpense?.description || 'Group Expense'}
        amount={activeReceiptExpense?.amount}
        currency={currency}
        date={activeReceiptExpense?.date}
        category={activeReceiptExpense?.category}
      />

      <ReceiptPickerModal
        isOpen={!!pickerExpense}
        onClose={() => setPickerExpense(null)}
        title={pickerExpense?.description || 'Group Expense'}
        hasExistingReceipt={!!pickerExpense?.receiptId}
        onSelectCamera={async () => {
          if (!pickerExpense || !group) return;
          const captured = await captureReceipt('camera');
          if (captured) {
            attachExpenseReceipt(group.id, pickerExpense.id, captured);
          }
        }}
        onSelectGallery={async () => {
          if (!pickerExpense || !group) return;
          const captured = await captureReceipt('photos');
          if (captured) {
            attachExpenseReceipt(group.id, pickerExpense.id, captured);
          }
        }}
        onView={() => {
          if (pickerExpense) setActiveReceiptExpense(pickerExpense);
        }}
        onDelete={() => {
          if (pickerExpense && group) {
            attachExpenseReceipt(group.id, pickerExpense.id, '');
          }
        }}
      />
    </div>
  );
}
