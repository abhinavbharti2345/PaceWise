import React from 'react';
import { cn } from '../../utils/cn';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Book,
  Briefcase,
  Bus,
  Camera,
  Car,
  CircleHelp,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  FileText,
  Film,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  Receipt,
  Shield,
  ShoppingBag,
  Smartphone,
  Smile,
  Sparkles,
  Tag,
  Tv,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Wifi,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Book,
  Briefcase,
  Bus,
  Camera,
  Car,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  FileText,
  Film,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  Receipt,
  Shield,
  ShoppingBag,
  Smartphone,
  Smile,
  Sparkles,
  Tag,
  Tv,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Wifi,
  Zap,
};

export interface IconBadgeProps {
  iconName: string;
  color?: 'red' | 'green' | 'orange' | 'gray' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconBadge({ iconName, color = 'gray', size = 'md', className }: IconBadgeProps) {
  const Icon = ICON_MAP[iconName] || CircleHelp;

  const colorStyles: Record<string, string> = {
    red: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    green: '',  // handled via inline style below
    orange: 'bg-amber-100 dark:bg-amber-500/10 text-[var(--color-orange)]',
    gray: 'bg-gray-100 dark:bg-gray-800 text-[var(--color-gray-dark)]',
    blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  const greenInlineStyle = color === 'green' ? {
    background: 'var(--positive-bg)',
    color: 'var(--positive-text)',
  } : undefined;

  const sizeStyles = {
    sm: 'w-8 h-8 min-w-[2rem]',
    md: 'w-10 h-10 min-w-[2.5rem]',
    lg: 'w-12 h-12 min-w-[3rem]',
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 transition-transform',
        colorStyles[color],
        sizeStyles[size],
        className
      )}
      style={greenInlineStyle}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.2} />
    </div>
  );
}
