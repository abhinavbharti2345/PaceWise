import * as LucideIcons from 'lucide-react';

export interface CategoryMeta {
  name: string;
  icon: keyof typeof LucideIcons;
  color: 'red' | 'green' | 'orange' | 'gray' | 'blue' | 'purple';
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: 'Food', icon: 'Utensils', color: 'orange' },
  { name: 'Transport', icon: 'Bus', color: 'blue' },
  { name: 'Education', icon: 'GraduationCap', color: 'purple' },
  { name: 'Hostel / Rent', icon: 'Home', color: 'red' },
  { name: 'Recharge', icon: 'Smartphone', color: 'orange' },
  { name: 'Entertainment', icon: 'Film', color: 'purple' },
  { name: 'Shopping', icon: 'ShoppingBag', color: 'blue' },
  { name: 'Snacks', icon: 'Coffee', color: 'orange' },
  { name: 'Games', icon: 'Gamepad2', color: 'purple' },
  { name: 'Fitness', icon: 'Dumbbell', color: 'green' },
  { name: 'Other', icon: 'MoreHorizontal', color: 'gray' },
];

export const BILL_CATEGORIES: CategoryMeta[] = [
  { name: 'Credit Card', icon: 'CreditCard', color: 'red' },
  { name: 'Phone Recharge', icon: 'Smartphone', color: 'orange' },
  { name: 'Hostel Rent', icon: 'Home', color: 'red' },
  { name: 'Electricity / Utilities', icon: 'Zap', color: 'orange' },
  { name: 'Subscriptions', icon: 'Tv', color: 'purple' },
  { name: 'Tuition / College Fee', icon: 'GraduationCap', color: 'blue' },
  { name: 'Other Bill', icon: 'Receipt', color: 'gray' },
];

export const INCOME_SOURCES: CategoryMeta[] = [
  { name: 'Parents', icon: 'Users', color: 'green' },
  { name: 'Salary / Job', icon: 'Briefcase', color: 'green' },
  { name: 'Scholarship', icon: 'Award', color: 'green' },
  { name: 'Freelance / Side Gig', icon: 'Laptop', color: 'green' },
  { name: 'Gift / Other', icon: 'Gift', color: 'green' },
];

export function getAllExpenseCategories(customCategories: CategoryMeta[] = []): CategoryMeta[] {
  // Put standard categories (except 'Other') first, then custom categories, then 'Other'
  const standardWithoutOther = EXPENSE_CATEGORIES.filter(c => c.name !== 'Other');
  const otherCat = EXPENSE_CATEGORIES.find(c => c.name === 'Other') || { name: 'Other', icon: 'MoreHorizontal', color: 'gray' };
  
  return [...standardWithoutOther, ...customCategories, otherCat];
}

export function getCategoryMeta(type: string, category?: string, customCategories: CategoryMeta[] = []): CategoryMeta {
  if (type === 'income') {
    const match = INCOME_SOURCES.find(s => s.name.toLowerCase() === category?.toLowerCase());
    return match || { name: category || 'Income', icon: 'ArrowDownRight', color: 'green' };
  }

  if (type === 'bill') {
    const match = BILL_CATEGORIES.find(b => b.name.toLowerCase() === category?.toLowerCase());
    return match || { name: category || 'Bill', icon: 'CreditCard', color: 'red' };
  }

  if (type === 'person') {
    return { name: category || 'People', icon: 'UserCheck', color: 'blue' };
  }

  // Expense fallback (check custom categories first, then standard)
  const customMatch = customCategories.find(c => c.name.toLowerCase() === category?.toLowerCase());
  if (customMatch) return customMatch;

  const match = EXPENSE_CATEGORIES.find(c => c.name.toLowerCase() === category?.toLowerCase());
  return match || { name: category || 'Expense', icon: 'Receipt', color: 'orange' };
}
