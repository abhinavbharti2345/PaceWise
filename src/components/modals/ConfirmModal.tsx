import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
  icon?: React.ReactNode;
  isLoading?: boolean;
  requiredMatchText?: string; // e.g. "DELETE"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details,
  confirmText,
  cancelText = 'Cancel',
  variant = 'destructive',
  icon,
  isLoading = false,
  requiredMatchText,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [matchValue, setMatchValue] = React.useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchValue('');
    }
  }, [isOpen]);

  const isMatchValid = !requiredMatchText || matchValue === requiredMatchText;

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when modal opens (unless input exists)
    if (!requiredMatchText) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !isLoading && isMatchValid) {
        if (modalRef.current && modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, isLoading, requiredMatchText, isMatchValid]);

  if (!isOpen) return null;

  const isDestructive = variant === 'destructive';
  const defaultConfirmText = isDestructive ? 'Delete' : 'Confirm';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-surface)] w-[calc(100%-2rem)] max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 fade-in duration-200 border border-[var(--color-gray-light)] p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                isDestructive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              )}
            >
              {icon || (isDestructive ? <Trash2 size={20} /> : <AlertTriangle size={20} />)}
            </div>
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-[var(--color-dark)] leading-snug">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)] shrink-0"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        {description && (
          <p id="confirm-dialog-description" className="text-sm text-[var(--color-gray-dark)] leading-relaxed">
            {description}
          </p>
        )}

        {/* Optional Secondary Details Card */}
        {details && (
          <div className="bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] rounded-xl p-3 text-xs">
            {details}
          </div>
        )}

        {/* Match Text Requirement */}
        {requiredMatchText && (
          <div className="pt-2">
            <label className="block text-xs font-bold text-[var(--color-dark)] mb-2">
              To confirm, type <span className="text-[var(--color-primary)] bg-[var(--color-surface-light)] px-1 py-0.5 rounded select-all font-mono">{requiredMatchText}</span> below:
            </label>
            <input
              type="text"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-gray-light)] rounded-xl px-3 h-11 text-sm font-semibold focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              placeholder={requiredMatchText}
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 px-4 font-bold border-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-surface-light)]"
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !isMatchValid}
            className={cn(
              'h-11 px-5 font-bold text-white shadow-sm transition-all disabled:opacity-50',
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-[var(--color-primary)] hover:opacity-90'
            )}
          >
            {isLoading ? 'Processing...' : confirmText || defaultConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
