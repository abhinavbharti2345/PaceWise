import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getCurrentTimeString } from '../../utils/dateUtils';

export interface TimePickerProps {
  value: string; // 'HH:mm' 24-hour format
  onChange: (timeStr: string) => void;
  label?: string;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse 24-hour 'HH:mm' into 12-hour components
  const parsed = useMemo(() => {
    const raw = value || getCurrentTimeString();
    const parts = raw.split(':').map(Number);
    let h24 = parts[0] ?? 12;
    let m = parts[1] ?? 0;
    if (isNaN(h24) || h24 < 0 || h24 > 23) h24 = 12;
    if (isNaN(m) || m < 0 || m > 59) m = 0;

    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour12: h12,
      minute: m,
      period,
      h24
    };
  }, [value]);

  const [tempHour, setTempHour] = useState(parsed.hour12);
  const [tempMinute, setTempMinute] = useState(parsed.minute);
  const [tempPeriod, setTempPeriod] = useState(parsed.period);
  const [activeTab, setActiveTab] = useState<'hours' | 'minutes'>('hours');

  // Sync temp state when opening
  useEffect(() => {
    if (isOpen) {
      setTempHour(parsed.hour12);
      setTempMinute(parsed.minute);
      setTempPeriod(parsed.period);
      setActiveTab('hours');
    }
  }, [isOpen, parsed]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Convert 12h + period back to 'HH:mm' 24h
  const to24Hour = (h12: number, min: number, p: 'AM' | 'PM'): string => {
    let h24 = h12 % 12;
    if (p === 'PM') h24 += 12;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(min).padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  const handleApply = () => {
    const formatted = to24Hour(tempHour, tempMinute, tempPeriod);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetNow = () => {
    const nowStr = getCurrentTimeString();
    onChange(nowStr);
    setIsOpen(false);
  };

  // Formatted display for trigger button (e.g. "01:55 AM")
  const displayFormatted = `${String(parsed.hour12).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')} ${parsed.period}`;

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1 truncate">
          {label}
        </label>
      )}

      {/* Trigger Button Matching DatePicker */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "w-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-base sm:text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all flex items-center justify-between cursor-pointer shadow-sm hover:border-[var(--color-primary)]/40",
          isOpen && "ring-2 ring-[var(--color-primary)] border-transparent",
          className
        )}
      >
        <span className="truncate font-semibold">{displayFormatted}</span>
        <Clock size={16} className="text-[var(--color-primary)] shrink-0 ml-2" />
      </button>

      {/* Centered Modal Overlay matching DatePicker */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-2xl shadow-2xl p-4 w-[265px] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Large Interactive Time Display + AM/PM Toggle */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-gray-light)]">
              {/* Digit Box */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('hours')}
                  className={cn(
                    "text-2xl font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer",
                    activeTab === 'hours'
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-[var(--color-surface-light)] text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15"
                  )}
                >
                  {String(tempHour).padStart(2, '0')}
                </button>
                <span className="text-xl font-black text-[var(--color-gray-dark)] px-0.5">:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('minutes')}
                  className={cn(
                    "text-2xl font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer",
                    activeTab === 'minutes'
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-[var(--color-surface-light)] text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15"
                  )}
                >
                  {String(tempMinute).padStart(2, '0')}
                </button>
              </div>

              {/* AM / PM Segmented Control */}
              <div className="flex bg-[var(--color-surface-light)] p-1 rounded-xl border border-[var(--color-gray-light)]">
                <button
                  type="button"
                  onClick={() => setTempPeriod('AM')}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    tempPeriod === 'AM'
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setTempPeriod('PM')}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    tempPeriod === 'PM'
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Tab 1: Hours Grid (1..12) */}
            {activeTab === 'hours' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[var(--color-gray-dark)] px-1">
                  <span>Select Hour</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('minutes')}
                    className="text-[var(--color-primary)] hover:underline capitalize font-semibold"
                  >
                    Next: Minutes →
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                    const isSelected = tempHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setTempHour(h);
                          setActiveTab('minutes');
                        }}
                        className={cn(
                          "h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                          isSelected
                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                            : "bg-[var(--color-surface-light)] text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)] border border-[var(--color-gray-light)]/60"
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Minutes Grid */}
            {activeTab === 'minutes' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[var(--color-gray-dark)] px-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('hours')}
                    className="text-[var(--color-primary)] hover:underline capitalize font-semibold"
                  >
                    ← Hours
                  </button>
                  <span>Select Minute</span>
                </div>

                {/* Minute Step Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {minuteOptions.map((min) => {
                    const isSelected = tempMinute === min;
                    return (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setTempMinute(min)}
                        className={cn(
                          "h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                          isSelected
                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                            : "bg-[var(--color-surface-light)] text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)] border border-[var(--color-gray-light)]/60"
                        )}
                      >
                        :{String(min).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>

                {/* Fine Tune Adjuster */}
                <div className="flex items-center justify-between pt-1 px-1 text-xs">
                  <span className="text-[11px] font-semibold text-[var(--color-gray-dark)]">Fine Tune:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempMinute(prev => (prev > 0 ? prev - 1 : 59))}
                      className="p-1.5 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-primary)]/15 text-[var(--color-dark)] transition-colors"
                      title="-1 min"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <span className="font-extrabold w-8 text-center text-xs text-[var(--color-dark)]">
                      :{String(tempMinute).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTempMinute(prev => (prev < 59 ? prev + 1 : 0))}
                      className="p-1.5 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-primary)]/15 text-[var(--color-dark)] transition-colors"
                      title="+1 min"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions matching DatePicker */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-gray-light)] text-xs font-bold">
              <button
                type="button"
                onClick={handleSetNow}
                className="text-[var(--color-primary)] hover:underline px-1 py-0.5 rounded-md text-[11px]"
              >
                Set to Now
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] px-2 py-1 rounded-lg transition-colors text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="bg-[var(--color-primary)] text-white px-3 py-1 rounded-lg shadow-sm hover:opacity-95 transition-opacity text-[11px] font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
