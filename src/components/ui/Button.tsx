import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl';
  
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-red-600 focus:ring-red-500',
    secondary: 'bg-[var(--color-dark)] text-white hover:bg-black focus:ring-gray-800',
    success: 'bg-[var(--color-success)] text-white hover:opacity-90 focus:ring-[var(--color-success)]',
    outline: 'border-2 border-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-gray-50 focus:ring-gray-200',
    ghost: 'hover:bg-gray-100 text-[var(--color-dark)] focus:ring-gray-200',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
