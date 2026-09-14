import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'red' | 'green' | 'orange' | 'gray';
}

export function Badge({ className, children, variant = 'gray', ...props }: BadgeProps) {
  const variants = {
    red: 'bg-[var(--color-negative-bg)] text-[var(--color-negative-text)] border border-[var(--color-negative-border)]',
    green: 'bg-[var(--color-positive-bg)] text-[var(--color-positive-text)] border border-[var(--color-positive-border)]',
    orange: 'bg-amber-100 dark:bg-amber-500/10 text-[var(--color-orange)] border border-amber-200 dark:border-amber-500/20',
    gray: 'bg-[var(--color-surface-light)] text-[var(--color-gray-dark)] border border-[var(--color-gray-light)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
