import React, { useState, useRef, useEffect, useMemo } from 'react';
import { format, startOfMonth, getDaysInMonth, addMonths, subMonths, isSameDay, isToday as checkIsToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DatePickerProps {
  value?: string; // 'YYYY-MM-DD' format or ISO string
  onChange: (dateStr: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  className,
  placeholder = 'Select date'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months'>('days');
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse input value safely into Date
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    // Handle 'YYYY-MM-DD' format safely without UTC shift
    const parts = value.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  // Current month being viewed in calendar popover
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  // Keep viewDate updated when selectedDate changes (if popover opens)
  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDate);
      setViewMode('days');
    }
  }, [isOpen, selectedDate]);

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

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      setViewDate(prev => subMonths(prev, 1));
    } else {
      setViewDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      setViewDate(prev => addMonths(prev, 1));
    } else {
      setViewDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }
  };

  const handleSelectDay = (dayDate: Date) => {
    const formatted = format(dayDate, 'yyyy-MM-dd');
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(format(today, 'yyyy-MM-dd'));
    setViewDate(today);
    setViewMode('days');
    setIsOpen(false);
  };

  // Calendar Grid Math
  const monthStart = startOfMonth(viewDate);
  const startDayOfWeek = monthStart.getDay(); // 0 = Sun
  const totalDaysInMonth = getDaysInMonth(viewDate);
  
  const prevMonth = subMonths(viewDate, 1);
  const totalDaysInPrevMonth = getDaysInMonth(prevMonth);

  // Generate 35 or 42 grid cells
  const calendarCells = useMemo(() => {
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = totalDaysInPrevMonth - i;
      cells.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), pDay),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      cells.push({
        date: new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
        isCurrentMonth: true
      });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (cells.length > 35 ? 42 : 35) - cells.length;
    const nextM = addMonths(viewDate, 1);
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        date: new Date(nextM.getFullYear(), nextM.getMonth(), day),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [viewDate, startDayOfWeek, totalDaysInMonth, totalDaysInPrevMonth, prevMonth]);

  const displayDateStr = value ? format(selectedDate, 'dd-MMM-yyyy') : placeholder;

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
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
        <span className="truncate">{displayDateStr}</span>
        <CalendarIcon size={16} className="text-[var(--color-primary)] shrink-0 ml-2" />
      </button>

      {/* Centered Modal Overlay Calendar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-2xl shadow-2xl p-3.5 w-[245px] sm:w-[265px] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--color-gray-light)]">
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'days' ? 'months' : 'days')}
                className="flex items-center gap-1 text-xs font-bold text-[var(--color-dark)] hover:text-[var(--color-primary)] transition-colors px-1.5 py-0.5 rounded-lg hover:bg-[var(--color-surface-light)]"
                title="Click to select month"
              >
                <span>{format(viewDate, viewMode === 'days' ? 'MMMM yyyy' : 'yyyy')}</span>
                <ChevronDown size={13} className={cn("transition-transform duration-200 text-[var(--color-gray-dark)]", viewMode === 'months' && "rotate-180")} />
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-[var(--color-surface-light)] text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-colors"
                  title={viewMode === 'days' ? "Previous Month" : "Previous Year"}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-[var(--color-surface-light)] text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-colors"
                  title={viewMode === 'days' ? "Next Month" : "Next Year"}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Days View */}
            {viewMode === 'days' && (
              <>
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="text-[9px] font-extrabold uppercase text-[var(--color-gray-dark)] py-0.5">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Day Cells */}
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {calendarCells.map((cell, idx) => {
                    const isSelected = value && isSameDay(cell.date, selectedDate);
                    const isToday = checkIsToday(cell.date);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDay(cell.date)}
                        className={cn(
                          "h-7 w-7 sm:h-7.5 sm:w-7.5 mx-auto flex items-center justify-center text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                          !cell.isCurrentMonth && "text-[var(--color-gray-light)] opacity-40 font-normal",
                          cell.isCurrentMonth && "text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]",
                          isToday && !isSelected && "border border-[var(--color-primary)] text-[var(--color-primary)] font-bold",
                          isSelected && "bg-[var(--color-primary)] text-white font-bold shadow-sm hover:bg-[var(--color-primary)] hover:text-white"
                        )}
                      >
                        {cell.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Months Selector View */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, mIdx) => {
                  const isSelectedMonth = selectedDate.getMonth() === mIdx && selectedDate.getFullYear() === viewDate.getFullYear();
                  const isCurrentMonthView = viewDate.getMonth() === mIdx;

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(viewDate.getFullYear(), mIdx, 1));
                        setViewMode('days');
                      }}
                      className={cn(
                        "py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center",
                        isSelectedMonth && "bg-[var(--color-primary)] text-white font-bold shadow-sm",
                        !isSelectedMonth && isCurrentMonthView && "border border-[var(--color-primary)] text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/10",
                        !isSelectedMonth && !isCurrentMonthView && "text-[var(--color-dark)] hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)] bg-[var(--color-surface-light)]/50"
                      )}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer Quick Actions */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-gray-light)] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-colors px-1.5 py-0.5 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-[var(--color-primary)] hover:underline px-1.5 py-0.5 rounded-md"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
