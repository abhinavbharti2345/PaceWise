import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Share2, Receipt, AlertCircle } from 'lucide-react';
import { getReceiptUrl } from '../../lib/receiptStorage';
import { registerModal } from '../../lib/modalStack';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId?: string;
  title?: string;
  amount?: number;
  currency?: string;
  date?: string;
  category?: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  receiptId,
  title = 'Receipt',
  amount,
  currency = '₹',
  date,
  category,
}: ReceiptModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      return registerModal(onClose);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !receiptId) {
      setImageUrl('');
      setIsZoomed(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    getReceiptUrl(receiptId)
      .then((url) => {
        if (!isMounted) return;
        if (url) {
          setImageUrl(url);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, receiptId]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const lines = [
      `🧾 *PaceWise Receipt: ${title}*`,
      amount !== undefined ? `💰 *Amount:* ${currency}${amount.toLocaleString('en-IN')}` : null,
      category ? `🏷️ *Category:* ${category}` : null,
      date ? `📅 *Date:* ${date}` : null,
      '',
      '_Shared from PaceWise_',
    ].filter(Boolean);

    const shareText = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#09090b] border border-[#27272a] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#FF453A]/15 text-[#FF453A] flex items-center justify-center shrink-0">
              <Receipt size={17} />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-[#a1a1aa] truncate">
                {date ? date : 'Attached Bill / Receipt'}
                {category ? ` • ${category}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {amount !== undefined && (
              <span className="text-xs sm:text-sm font-extrabold text-white px-2.5 py-1 rounded-full bg-[#27272a]">
                {currency}{amount.toLocaleString('en-IN')}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-3 relative min-h-[260px] max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 py-12">
              <div className="w-8 h-8 border-2 border-[#FF453A] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading receipt...</span>
            </div>
          ) : hasError || !imageUrl ? (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 py-12 text-center px-4">
              <AlertCircle size={32} className="text-amber-500" />
              <p className="text-sm font-semibold text-white">Receipt image unavailable</p>
              <p className="text-xs text-zinc-500">The local receipt file may have been moved or removed.</p>
            </div>
          ) : (
            <div
              className={`relative transition-transform duration-200 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={imageUrl}
                alt="Receipt"
                className="max-h-[56vh] w-auto max-w-full object-contain rounded-xl shadow-lg select-none"
              />
            </div>
          )}

          {imageUrl && (
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white/90 border border-white/10 shadow-md backdrop-blur-sm transition-all"
              title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#0e0e11] border-t border-[#27272a] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#71717a] hidden sm:block">
            Stored locally on device
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all shadow-sm active:scale-95"
            >
              <Share2 size={14} />
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#d4d4d8] bg-[#27272a] hover:bg-[#3f3f46] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
