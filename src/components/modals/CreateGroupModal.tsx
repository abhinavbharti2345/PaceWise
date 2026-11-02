import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGroupStore } from '../../store/useGroupStore';
import { useStore } from '../../store/useStore';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

const PRESET_EMOJIS = ['🏖️', '✈️', '🏠', '🍕', '🚗', '⛺', '🎉', '💼', '⛰️', '🍻', '🎬', '🚢'];

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const { createGroup } = useGroupStore();
  const { config } = useStore();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [description, setDescription] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmoji('🏖️');
      setDescription('');
      setMemberInput('');
      setMembers([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'you') {
      setError('You are already included by default as the organizer.');
      return;
    }
    if (members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added.`);
      return;
    }
    setMembers([...members, trimmed]);
    setMemberInput('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleRemoveMember = (nameToRemove: string) => {
    setMembers(members.filter((m) => m !== nameToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this group or trip.');
      return;
    }
    if (members.length === 0) {
      setError('Please add at least one other friend/member to split with.');
      return;
    }

    const newGroupId = createGroup({
      name: name.trim(),
      emoji,
      description: description.trim(),
      memberNames: members,
      currency: config.currency || '₹',
    });

    onClose();
    if (onCreated) {
      onCreated(newGroupId);
    }
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
            <span className="text-3xl p-2 bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-gray-light)]">
              {emoji}
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-dark)] tracking-tight">Create Group or Trip</h2>
              <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">
                Isolated space to track spending & settle up cleanly
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

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Emoji Picker */}
          <div>
            <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-2">
              Choose an Icon
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    emoji === e
                      ? 'bg-[var(--color-primary)] text-white scale-110 shadow-md ring-2 ring-[var(--color-primary)]/40'
                      : 'bg-[var(--color-surface-light)] hover:bg-[var(--color-gray-light)] border border-[var(--color-gray-light)]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
              Name <span className="text-[var(--color-primary)]">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Goa Trip 2026, Flat 402, Friday Dinner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm font-semibold"
              autoFocus
            />
          </div>

          {/* Optional Description */}
          <div>
            <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider block mb-1.5">
              Description or Note <span className="text-[10px] text-[var(--color-gray-dark)] font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., 3-day weekend trip with friends"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          {/* Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-[var(--color-primary)]" />
                Friends & Members <span className="text-[var(--color-primary)]">*</span>
              </label>
              <span className="text-[11px] text-[var(--color-gray-dark)] font-semibold">
                {members.length + 1} participant{members.length + 1 > 1 ? 's' : ''}
              </span>
            </div>

            {/* Input to add member */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type friend's name (e.g. Rohit) and press Enter"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMember}
                className="px-3 shrink-0 rounded-xl"
              >
                <Plus size={18} />
                <span className="hidden sm:inline ml-1 text-xs font-bold">Add</span>
              </Button>
            </div>

            {/* Members chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl text-xs font-bold text-[var(--color-primary)]">
                <span>👤 You (Organizer)</span>
              </div>
              {members.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] rounded-xl text-xs font-bold text-[var(--color-dark)] group"
                >
                  <span>{m}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m)}
                    className="text-[var(--color-gray-dark)] hover:text-red-500 transition-colors ml-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            {members.length === 0 && (
              <p className="text-[11px] text-[var(--color-gray-dark)] italic mt-1">
                Add at least one friend to split expenses with.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-gray-light)]">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5 font-bold shadow-md">
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
