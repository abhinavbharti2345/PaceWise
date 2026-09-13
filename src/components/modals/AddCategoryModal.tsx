import React, { useState } from 'react';
import { 
  X, AlertCircle, Plus, Tag, Sparkles, Heart, Car, Book, Coffee, 
  Briefcase, Gift, Smile, Shield, Music, Camera, CreditCard, 
  Zap, Wifi, Home, Smartphone, Tv, GraduationCap, Receipt, 
  Droplets, Flame, FileText 
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import { EXPENSE_CATEGORIES, BILL_CATEGORIES, INCOME_SOURCES, type CategoryMeta } from '../../utils/categoryHelpers';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (categoryName: string) => void;
  title?: string;
  categoryType?: 'expense' | 'bill' | 'income';
}

const AVAILABLE_ICONS: Array<{ name: CategoryMeta['icon']; label: string; IconComp: React.ElementType }> = [
  { name: 'CreditCard', label: 'Card', IconComp: CreditCard },
  { name: 'Zap', label: 'Electricity', IconComp: Zap },
  { name: 'Wifi', label: 'Internet', IconComp: Wifi },
  { name: 'Home', label: 'Home/Rent', IconComp: Home },
  { name: 'Smartphone', label: 'Mobile', IconComp: Smartphone },
  { name: 'Tv', label: 'Subscription', IconComp: Tv },
  { name: 'GraduationCap', label: 'Tuition', IconComp: GraduationCap },
  { name: 'Receipt', label: 'Bill', IconComp: Receipt },
  { name: 'Droplets', label: 'Water', IconComp: Droplets },
  { name: 'Flame', label: 'Gas/Fuel', IconComp: Flame },
  { name: 'Car', label: 'Vehicle', IconComp: Car },
  { name: 'FileText', label: 'Doc', IconComp: FileText },
  { name: 'Tag', label: 'Tag', IconComp: Tag },
  { name: 'Sparkles', label: 'Sparkles', IconComp: Sparkles },
  { name: 'Heart', label: 'Health', IconComp: Heart },
  { name: 'Book', label: 'Education', IconComp: Book },
  { name: 'Coffee', label: 'Food/Drink', IconComp: Coffee },
  { name: 'Briefcase', label: 'Work', IconComp: Briefcase },
  { name: 'Gift', label: 'Gift', IconComp: Gift },
  { name: 'Smile', label: 'Personal', IconComp: Smile },
  { name: 'Shield', label: 'Insurance', IconComp: Shield },
  { name: 'Music', label: 'Entertainment', IconComp: Music },
  { name: 'Camera', label: 'Media', IconComp: Camera },
];

const AVAILABLE_COLORS: Array<CategoryMeta['color']> = ['red', 'orange', 'purple', 'blue', 'green', 'gray'];

export function AddCategoryModal({ 
  isOpen, 
  onClose, 
  onCategoryAdded,
  title,
  categoryType = 'expense'
}: AddCategoryModalProps) {
  const { 
    addCustomCategory, 
    customCategories = [],
    addCustomBillCategory,
    customBillCategories = [],
    addCustomIncomeCategory,
    customIncomeCategories = []
  } = useStore();

  const isBill = categoryType === 'bill';
  const isIncome = categoryType === 'income';
  const modalTitle = title || (isIncome ? 'Add Custom Income Source' : (isBill ? 'Add Custom Bill Type' : 'Add Custom Category'));

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<CategoryMeta['icon']>(isIncome ? 'Briefcase' : (isBill ? 'Receipt' : 'Tag'));
  const [selectedColor, setSelectedColor] = useState<CategoryMeta['color']>(isIncome ? 'green' : (isBill ? 'red' : 'purple'));
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(isIncome ? 'Please enter an income source name' : (isBill ? 'Please enter a bill type name' : 'Please enter a category name'));
      return;
    }

    if (isIncome) {
      const existsInStandard = INCOME_SOURCES.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      const existsInCustom = customIncomeCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existsInStandard || existsInCustom) {
        setError('An income source with this name already exists');
        return;
      }

      addCustomIncomeCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      });
    } else if (isBill) {
      const existsInStandard = BILL_CATEGORIES.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      const existsInCustom = customBillCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existsInStandard || existsInCustom) {
        setError('A bill type with this name already exists');
        return;
      }

      addCustomBillCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      const existsInStandard = EXPENSE_CATEGORIES.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      const existsInCustom = customCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existsInStandard || existsInCustom) {
        setError('A category with this name already exists');
        return;
      }

      addCustomCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      });
    }

    if (onCategoryAdded) {
      onCategoryAdded(trimmed);
    }

    setName('');
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-6 duration-300 flex flex-col border border-[var(--color-gray-light)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--color-gray-light)] shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-xl",
              isBill 
                ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" 
                : "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
            )}>
              <Plus size={18} />
            </div>
            <h2 className="font-bold text-[var(--color-dark)] text-lg">{modalTitle}</h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-[var(--color-surface-light)] rounded-full transition-colors text-[var(--color-gray-dark)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <Input 
              label={isBill ? "Bill Type Name *" : "Category Name *"} 
              placeholder={isBill ? "e.g. Water Bill, Gas, Gym Membership" : "e.g. Subscriptions, Pet Care, Fitness"}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-6 gap-2 bg-[var(--color-surface-light)] p-2 rounded-2xl border border-[var(--color-gray-light)] max-h-40 overflow-y-auto">
              {AVAILABLE_ICONS.map(({ name: iconName, label, IconComp }) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={label}
                    onClick={() => setSelectedIcon(iconName)}
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-[var(--color-dark)] text-[var(--color-surface)] shadow-md scale-105" 
                        : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-surface)]"
                    )}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-2">
              Select Theme Color
            </label>
            <div className="flex items-center gap-3 bg-[var(--color-surface-light)] p-2.5 rounded-2xl border border-[var(--color-gray-light)] justify-around">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = selectedColor === c;
                const colorMap: Record<string, string> = {
                  orange: 'bg-amber-500',
                  blue: 'bg-blue-500',
                  purple: 'bg-purple-500',
                  green: 'bg-emerald-500',
                  red: 'bg-rose-500',
                  gray: 'bg-slate-500',
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform flex items-center justify-center",
                      colorMap[c],
                      isSelected ? "ring-4 ring-[var(--color-primary)]/30 scale-110 shadow-md" : "opacity-70 hover:opacity-100"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full font-bold text-base shadow-md"
            >
              {isBill ? 'Save Bill Type' : 'Save Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

