import { useEffect } from 'react';
import { Camera, Image as ImageIcon, Eye, Trash2, X } from 'lucide-react';
import { registerModal } from '../../lib/modalStack';

interface ReceiptPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hasExistingReceipt?: boolean;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onView?: () => void;
  onDelete?: () => void;
}

export function ReceiptPickerModal({
  isOpen,
  onClose,
  title = 'Receipt',
  hasExistingReceipt = false,
  onSelectCamera,
  onSelectGallery,
  onView,
  onDelete,
}: ReceiptPickerModalProps) {
  useEffect(() => {
    if (isOpen) {
      return registerModal(onClose);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="truncate pr-2">
            <h3 className="text-sm font-bold text-white truncate">
              {hasExistingReceipt ? 'Receipt Options' : 'Attach Receipt'}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 pt-1">
          {hasExistingReceipt && onView && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onView();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Eye size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">View Full Receipt</div>
                <div className="text-[11px] text-zinc-400">View or share with WhatsApp</div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCamera();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-left transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF453A]/15 text-[#FF453A] flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">
                {hasExistingReceipt ? 'Retake Photo' : 'Take Photo'}
              </div>
              <div className="text-[11px] text-zinc-400">Open camera to capture receipt</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGallery();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-left transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ImageIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">
                {hasExistingReceipt ? 'Replace from Gallery' : 'Choose from Gallery'}
              </div>
              <div className="text-[11px] text-zinc-400">Select saved photo or document</div>
            </div>
          </button>

          {hasExistingReceipt && onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-red-400">Remove Receipt</div>
                <div className="text-[11px] text-red-400/70">Detach receipt from transaction</div>
              </div>
            </button>
          )}
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-1 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

