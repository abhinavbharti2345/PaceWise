import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'red' | 'green' | 'orange' | 'gray';
}

export function Badge({ className, children, variant = 'gray', ...props }: BadgeProps) {
  const variants = {
    red: 'bg-red-100 text-red-600',
    green: '',  // handled below via inline style
    orange: 'bg-orange-100 text-orange-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      style={variant === 'green' ? {
        background: 'var(--positive-bg)',
        color: 'var(--positive-text)',
        border: '1px solid var(--positive-border)',
      } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
