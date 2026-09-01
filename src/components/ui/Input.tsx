import React from 'react';
import { cn } from '../../utils/cn';
import { DatePicker } from './DatePicker';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, value, onChange, ...props }, ref) => {
    if (type === 'date') {
      return (
        <DatePicker
          label={label}
          value={value ? String(value) : ''}
          onChange={(dateStr) => {
            if (onChange) {
              onChange({ target: { value: dateStr } } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          className={className}
        />
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[var(--color-gray-dark)] mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            'flex w-full rounded-xl border border-[var(--color-gray-light)] bg-[var(--color-surface)] px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow touch-manipulation',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
