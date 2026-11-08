import { useState, useEffect } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { captureReceipt, getReceiptUrl, deleteReceipt } from '../../lib/receiptStorage';
import { ReceiptPickerModal } from '../modals/ReceiptPickerModal';
import { cn } from '../../utils/cn';

interface ReceiptAttachmentInputProps {
  receiptId: string | null;
  onChange: (receiptId: string | null) => void;
  className?: string;
}

export function ReceiptAttachmentInput({
  receiptId,
  onChange,
  className,
}: ReceiptAttachmentInputProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (receiptId) {
      getReceiptUrl(receiptId).then((url) => {
        if (isMounted) setThumbnailUrl(url);
      });
    } else {
      setThumbnailUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  const handleCapture = async (source: 'camera' | 'photos') => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const id = await captureReceipt(source);
      if (id) {
        onChange(id);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (receiptId) {
      await deleteReceipt(receiptId);
      onChange(null);
      setThumbnailUrl(null);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-xs font-semibold text-[var(--color-gray-dark)] mb-1.5">
        Bill / Receipt <span className="text-[10px] text-[var(--color-gray-dark)] font-normal">(Optional • Stored locally)</span>
      </label>

      {receiptId ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 transition-all">
          <div 
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-3 min-w-0 cursor-pointer"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Receipt thumbnail"
                className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Check size={18} />
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-[var(--color-dark)] flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Receipt attached
              </p>
              <p className="text-[10px] text-[var(--color-gray-dark)] truncate">
                Tap to change or view options
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-[var(--color-gray-dark)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
            title="Remove receipt"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          disabled={isCapturing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[var(--color-gray-light)] hover:border-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] text-xs font-bold text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-all active:scale-[0.99] cursor-pointer"
        >
          {isCapturing ? (
            <>
              <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
              <span>Opening...</span>
            </>
          ) : (
            <>
              <Camera size={16} className="text-[var(--color-primary)]" />
              <span>Attach Bill / Receipt</span>
            </>
          )}
        </button>
      )}

      <ReceiptPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Transaction Receipt"
        hasExistingReceipt={!!receiptId}
        onSelectCamera={() => handleCapture('camera')}
        onSelectGallery={() => handleCapture('photos')}
        onDelete={receiptId ? () => {
          deleteReceipt(receiptId);
          onChange(null);
          setThumbnailUrl(null);
        } : undefined}
      />
    </div>
  );
}
