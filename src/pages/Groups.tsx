import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, ArrowUpRight, ArrowDownRight, CheckCircle2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';
import { useGroupStore } from '../store/useGroupStore';
import { calculateGroupSummary } from '../utils/groupEngine';

export function Groups() {
  const navigate = useNavigate();
  const { groups, deleteGroup } = useGroupStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || g.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate high-level stats across all active groups
  const activeGroups = groups.filter((g) => g.status === 'active');
  let totalActiveSpent = 0;
  let totalToReceive = 0;
  let totalToGive = 0;

  activeGroups.forEach((g) => {
    const s = calculateGroupSummary(g);
    totalActiveSpent += s.totalSpent;
    if (s.userNet > 0) totalToReceive += s.userNet;
    if (s.userNet < 0) totalToGive += Math.abs(s.userNet);
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteGroup(id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-dark)] tracking-tight">Groups & Trips</h1>
            <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              Isolated Ledger
            </span>
          </div>
          <p className="text-[var(--color-gray-dark)] text-xs sm:text-sm mt-0.5 leading-relaxed">
            Split trips, flatmate bills, and outings without touching your daily budget pace.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm shrink-0 w-full sm:w-auto"
        >
          <Plus size={18} />
          <span className="text-xs sm:text-sm">New Group / Trip</span>
        </Button>
      </header>

      {/* Summary Stat Cards - Compact 3-col on Mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-2.5 sm:p-5 flex flex-col justify-between border border-[var(--color-gray-light)] rounded-2xl">
          <p className="text-[10px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider truncate">
            <span className="sm:hidden">Active</span>
            <span className="hidden sm:inline">Active Groups</span>
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-extrabold text-[var(--color-dark)]">{activeGroups.length}</span>
            <span className="text-[10px] sm:text-xs text-[var(--color-gray-dark)] font-semibold truncate hidden xs:inline sm:inline">
              {groups.length} total
            </span>
          </div>
        </Card>

        <Card className="p-2.5 sm:p-5 flex flex-col justify-between border border-[var(--color-gray-light)] rounded-2xl">
          <p className="text-[10px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1 truncate">
            <ArrowDownRight size={13} className="text-[var(--color-success)] shrink-0" />
            <span className="truncate">Receive</span>
          </p>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-lg sm:text-2xl font-extrabold text-[var(--color-success)] truncate block">
              ₹{totalToReceive.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        <Card className="p-2.5 sm:p-5 flex flex-col justify-between border border-[var(--color-gray-light)] rounded-2xl">
          <p className="text-[10px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1 truncate">
            <ArrowUpRight size={13} className="text-[var(--color-primary)] shrink-0" />
            <span className="truncate">You Owe</span>
          </p>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-lg sm:text-2xl font-extrabold text-[var(--color-primary)] truncate block">
              ₹{totalToGive.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
          <Input
            type="text"
            placeholder="Search groups by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs sm:text-sm font-medium w-full rounded-xl"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-gray-light)] text-xs font-bold w-full sm:w-auto">
          {(['all', 'active', 'settled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all text-center ${
                filter === tab
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-10 sm:py-16 px-4 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl space-y-3 sm:space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--color-surface-light)] rounded-2xl flex items-center justify-center mx-auto text-2xl sm:text-3xl">
            🏖️
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-dark)]">
              {search ? 'No groups match your search' : 'No trips or groups yet'}
            </h3>
            <p className="text-xs text-[var(--color-gray-dark)] max-w-sm mx-auto mt-1 leading-relaxed">
              {search
                ? 'Try searching with a different term or clear the filter.'
                : 'Heading out on a trip or splitting apartment rent? Create a group to track who paid what in a clean isolated ledger.'}
            </p>
          </div>
          {!search && (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl px-5 py-2 text-xs font-bold shadow-md"
            >
              <Plus size={16} className="mr-1.5" />
              Create First Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const summary = calculateGroupSummary(group);
            const currency = group.currency || '₹';

            return (
              <Card
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="p-5 border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top line: Emoji, Name, Status, Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl p-2 bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-gray-light)] shrink-0">
                        {group.emoji || '🏖️'}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[var(--color-dark)] tracking-tight truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-[11px] text-[var(--color-gray-dark)] flex items-center gap-1.5 mt-0.5">
                          <Users size={12} />
                          <span>{group.members.length} members</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          group.status === 'settled'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {group.status === 'settled' ? 'Settled' : 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, group.id, group.name)}
                        className="p-1.5 text-[var(--color-gray-dark)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete Group"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Members pill preview */}
                  <div className="flex flex-wrap gap-1 mt-3.5">
                    {group.members.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 bg-[var(--color-surface-light)] text-[var(--color-gray-dark)] text-[10px] font-semibold rounded-md"
                      >
                        {m.isUser ? 'You' : m.name}
                      </span>
                    ))}
                    {group.members.length > 4 && (
                      <span className="px-2 py-0.5 bg-[var(--color-surface-light)] text-[var(--color-gray-dark)] text-[10px] font-semibold rounded-md">
                        +{group.members.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom line: Financial summary */}
                <div className="mt-5 pt-3.5 border-t border-[var(--color-gray-light)] flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
                      Total Spent
                    </span>
                    <span className="text-sm font-extrabold text-[var(--color-dark)]">
                      {currency}{summary.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block">
                      Your Position
                    </span>
                    {summary.userNet > 0 ? (
                      <span className="text-xs font-extrabold text-[var(--color-success)] flex items-center justify-end gap-0.5">
                        <ArrowDownRight size={13} />
                        +{currency}{summary.userNet.toLocaleString('en-IN')}
                      </span>
                    ) : summary.userNet < 0 ? (
                      <span className="text-xs font-extrabold text-[var(--color-primary)] flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={13} />
                        -{currency}{Math.abs(summary.userNet).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-[var(--color-gray-dark)] flex items-center justify-end gap-1">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Settled
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => navigate(`/groups/${id}`)}
      />
    </div>
  );
}
