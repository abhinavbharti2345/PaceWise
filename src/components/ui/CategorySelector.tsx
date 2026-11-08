import React, { useState, useRef, useEffect } from 'react';
import { Check, X, SlidersHorizontal, ChevronLeft, ChevronRight, Trash2, EyeOff, Plus, GripVertical } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { type CategoryMeta } from '../../utils/categoryHelpers';

interface CategorySelectorProps {
  label: string;
  categories: CategoryMeta[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
  type: 'expense' | 'bill' | 'income';
  onAddCustomClick: () => void;
  customButtonText?: string;
  columnsClass?: string;
}

export function CategorySelector({
  label,
  categories,
  selectedCategory,
  onSelectCategory,
  type,
  onAddCustomClick,
  customButtonText = 'Custom',
  columnsClass = 'grid-cols-3',
}: CategorySelectorProps) {
  const { 
    hideCategory, 
    deleteCustomCategory, 
    deleteCustomBillCategory,
    deleteCustomIncomeCategory,
    reorderCategories,
    customCategories = [],
    customBillCategories = [],
    customIncomeCategories = []
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    catName: string;
    isCustom: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Drag-and-drop & Touch state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 30, y: 20, width: 110, height: 40 });

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    const handleScroll = () => setContextMenu(null);

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
      if (dragHoldTimerRef.current) clearTimeout(dragHoldTimerRef.current);
    };
  }, []);

  // Global touchmove & touchend listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      if (!touch) return;
      setTouchPos({ x: touch.clientX, y: touch.clientY });

      for (let i = 0; i < categories.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (
          touch.clientX >= rect.left - 6 &&
          touch.clientX <= rect.right + 6 &&
          touch.clientY >= rect.top - 6 &&
          touch.clientY <= rect.bottom + 6
        ) {
          setDragOverIndex(i);
          break;
        }
      }
    };

    const handleWindowTouchEnd = () => {
      if (dragHoldTimerRef.current) {
        clearTimeout(dragHoldTimerRef.current);
        dragHoldTimerRef.current = null;
      }

      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
        const newOrder = categories.map(c => c.name);
        const [moved] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dragOverIndex, 0, moved);
        reorderCategories(newOrder, type);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }

      setIsDragging(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTouchPos(null);
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, [isDragging, draggedIndex, dragOverIndex, categories, reorderCategories, type]);

  const isCustomCategory = (name: string) => {
    if (type === 'income') {
      return (customIncomeCategories || []).some(c => c.name.toLowerCase() === name.toLowerCase());
    }
    if (type === 'bill') {
      return (customBillCategories || []).some(c => c.name.toLowerCase() === name.toLowerCase());
    }
    return (customCategories || []).some(c => c.name.toLowerCase() === name.toLowerCase());
  };

  const handleRemoveCategory = (catName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCustom = isCustomCategory(catName);
    
    if (isCustom) {
      if (type === 'income') {
        deleteCustomIncomeCategory(catName);
      } else if (type === 'bill') {
        deleteCustomBillCategory(catName);
      } else {
        deleteCustomCategory(catName);
      }
    } else {
      hideCategory(catName);
    }

    // If removed category was selected, fallback to the first remaining one
    if (selectedCategory.toLowerCase() === catName.toLowerCase()) {
      const remaining = categories.filter(c => c.name.toLowerCase() !== catName.toLowerCase());
      if (remaining.length > 0) {
        onSelectCategory(remaining[0].name);
      }
    }

    setContextMenu(null);
  };

  const handleMove = (index: number, direction: 'left' | 'right', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= categories.length) return;

    const newOrder = categories.map(c => c.name);
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIdx];
    newOrder[newIdx] = temp;

    reorderCategories(newOrder, type);
    setContextMenu(null);
  };

  // 450ms long press to activate Customize mode when not editing
  const handleTouchStart = () => {
    isLongPressTriggeredRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsEditing(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  // Touch handlers for Hold & Drag while in Customize mode
  const handleItemTouchStart = (index: number, e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditing) {
      handleTouchStart();
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

    if (dragHoldTimerRef.current) {
      clearTimeout(dragHoldTimerRef.current);
    }

    dragHoldTimerRef.current = setTimeout(() => {
      setDragOffset(offset);
      setIsDragging(true);
      setDraggedIndex(index);
      setDragOverIndex(index);
      setTouchPos({ x: touch.clientX, y: touch.clientY });
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    }, 150);
  };

  const handleItemTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditing) {
      handleTouchEnd();
      return;
    }

    if (dragHoldTimerRef.current && !isDragging && touchStartPosRef.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(dragHoldTimerRef.current);
          dragHoldTimerRef.current = null;
        }
      }
    }
  };

  const handleItemTouchEnd = () => {
    if (dragHoldTimerRef.current) {
      clearTimeout(dragHoldTimerRef.current);
      dragHoldTimerRef.current = null;
    }
    if (!isEditing) {
      handleTouchEnd();
    }
  };

  // Desktop HTML5 drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditing) return;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    if (!isEditing) return;
    e.preventDefault();
    const fromStr = e.dataTransfer.getData('text/plain');
    const fromIdx = fromStr !== '' ? parseInt(fromStr, 10) : draggedIndex;
    if (fromIdx !== null && !isNaN(fromIdx) && fromIdx !== index && fromIdx < categories.length) {
      const newOrder = categories.map(c => c.name);
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(index, 0, moved);
      reorderCategories(newOrder, type);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleContextMenu = (catName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isCustom = isCustomCategory(catName);
    setContextMenu({
      catName,
      isCustom,
      x: e.clientX,
      y: e.clientY
    });
  };

  const getSelectedStyles = (isSelected: boolean) => {
    if (!isSelected || isEditing) {
      return "bg-[var(--color-surface)] text-[var(--color-gray-dark)] border-[var(--color-gray-light)] hover:border-gray-400";
    }
    if (type === 'income') {
      return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
    }
    return "bg-[var(--color-dark)] text-[var(--color-surface)] border-[var(--color-dark)] shadow-sm";
  };

  const getCustomButtonStyles = () => {
    if (type === 'income') {
      return "border border-[var(--color-gray-light)] hover:border-emerald-500 bg-[var(--color-surface)] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 text-[var(--color-dark)] font-bold";
    }
    if (type === 'bill') {
      return "border border-[var(--color-gray-light)] hover:border-rose-500 bg-[var(--color-surface)] hover:bg-rose-50/60 dark:hover:bg-rose-950/40 text-[var(--color-dark)] font-bold";
    }
    return "border border-[var(--color-gray-light)] hover:border-purple-500 bg-[var(--color-surface)] hover:bg-purple-50/60 dark:hover:bg-purple-950/40 text-[var(--color-dark)] font-bold";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            setIsEditing(!isEditing);
            setContextMenu(null);
            setIsDragging(false);
            setDraggedIndex(null);
            setDragOverIndex(null);
          }}
          className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer",
            isEditing
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)]"
          )}
        >
          <SlidersHorizontal size={12} />
          <span>{isEditing ? 'Done' : 'Customize'}</span>
        </button>
      </div>

      {isEditing && (
        <div className="p-2 rounded-xl bg-[var(--color-surface-light)] border border-dashed border-[var(--color-gray-light)] text-[10px] text-[var(--color-gray-dark)] flex items-center justify-between animate-in fade-in duration-200">
          <span>Hold & drag to reorder, or use arrows / <strong>×</strong> to hide or delete.</span>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setIsDragging(false);
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            className="text-[var(--color-primary)] font-bold text-xs hover:underline ml-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      <div className={cn("grid gap-2", columnsClass)}>
        {categories.map((cat, index) => {
          const isSelected = selectedCategory === cat.name;
          const isCustom = isCustomCategory(cat.name);
          const isFirst = index === 0;
          const isLast = index === categories.length - 1;
          const isBeingDragged = isDragging && draggedIndex === index;
          const isDropTarget = isDragging && dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={cat.name}
              ref={(el) => { itemRefs.current[index] = el; }}
              draggable={isEditing && !isDragging}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleItemTouchStart(index, e)}
              onTouchMove={handleItemTouchMove}
              onTouchEnd={handleItemTouchEnd}
              onTouchCancel={handleItemTouchEnd}
              onContextMenu={(e) => handleContextMenu(cat.name, e)}
              className={cn(
                "relative group select-none transition-all duration-150",
                isEditing && "touch-none",
                isBeingDragged && "opacity-25 scale-95",
                isDropTarget && "scale-105 ring-2 ring-[var(--color-primary)] shadow-md rounded-xl"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (isLongPressTriggeredRef.current || isDragging) return;
                  if (!isEditing) {
                    onSelectCategory(cat.name);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left truncate relative cursor-pointer",
                  getSelectedStyles(isSelected),
                  isEditing && "pr-6 border-dashed border-red-300 dark:border-red-900/60 cursor-grab active:cursor-grabbing"
                )}
              >
                {isEditing && (
                  <GripVertical size={12} className="text-[var(--color-gray-dark)]/70 shrink-0 -ml-1 cursor-grab" />
                )}
                <span className="truncate">{cat.name}</span>
                {isSelected && !isEditing && <Check size={12} className="ml-auto shrink-0" />}
              </button>

              {/* Edit Controls when isEditing is active */}
              {isEditing && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {!isFirst && (
                    <button
                      type="button"
                      title="Move earlier"
                      onClick={(e) => handleMove(index, 'left', e)}
                      className="p-1 rounded-md text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] cursor-pointer"
                    >
                      <ChevronLeft size={12} />
                    </button>
                  )}
                  {!isLast && (
                    <button
                      type="button"
                      title="Move later"
                      onClick={(e) => handleMove(index, 'right', e)}
                      className="p-1 rounded-md text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface-light)] cursor-pointer"
                    >
                      <ChevronRight size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    title={isCustom ? "Delete custom category" : "Hide category"}
                    onClick={(e) => handleRemoveCategory(cat.name, e)}
                    className="p-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors shrink-0 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Custom Button */}
        <button
          type="button"
          onClick={onAddCustomClick}
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs",
            getCustomButtonStyles()
          )}
        >
          <Plus 
            size={14} 
            className={cn(
              "shrink-0 stroke-[2.5]",
              type === 'income' ? "text-emerald-600 dark:text-emerald-400" :
              type === 'bill' ? "text-rose-600 dark:text-rose-400" :
              "text-purple-600 dark:text-purple-400"
            )} 
          />
          <span className="truncate">{customButtonText}</span>
        </button>
      </div>

      {/* Floating Drag Clone for Touch Devices */}
      {isDragging && draggedIndex !== null && categories[draggedIndex] && touchPos && (
        <div
          className="fixed pointer-events-none z-[300] px-3 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-dark)] flex items-center gap-1.5 opacity-95 transition-none"
          style={{
            left: Math.max(10, Math.min(window.innerWidth - dragOffset.width - 10, touchPos.x - dragOffset.x)),
            top: touchPos.y - dragOffset.y - 10,
            width: dragOffset.width,
          }}
        >
          <GripVertical size={13} className="text-[var(--color-primary)] shrink-0" />
          <span className="truncate font-bold">{categories[draggedIndex].name}</span>
        </div>
      )}

      {/* Desktop Right-Click Context Menu & Dismissal Overlay */}
      {contextMenu && (
        <>
          {/* Invisible Backdrop: Click anywhere outside to instantly dismiss context menu */}
          <div 
            className="fixed inset-0 z-[190] cursor-default" 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />

          <div
            className="fixed z-[200] bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-2xl rounded-2xl p-1.5 min-w-44 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 150),
              left: Math.min(contextMenu.x, window.innerWidth - 180),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[var(--color-gray-dark)] border-b border-[var(--color-gray-light)] mb-1">
              {contextMenu.catName}
            </div>

            <button
              type="button"
              onClick={() => {
                const idx = categories.findIndex(c => c.name.toLowerCase() === contextMenu.catName.toLowerCase());
                if (idx > 0) handleMove(idx, 'left');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-dark)] cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Move Left</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const idx = categories.findIndex(c => c.name.toLowerCase() === contextMenu.catName.toLowerCase());
                if (idx < categories.length - 1) handleMove(idx, 'right');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-dark)] cursor-pointer"
            >
              <ChevronRight size={14} />
              <span>Move Right</span>
            </button>

            <button
              type="button"
              onClick={() => handleRemoveCategory(contextMenu.catName)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors border-t border-[var(--color-gray-light)] mt-1 pt-1.5 cursor-pointer"
            >
              {contextMenu.isCustom ? <Trash2 size={14} /> : <EyeOff size={14} />}
              <span>{contextMenu.isCustom ? 'Delete Custom Category' : 'Hide Category'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

