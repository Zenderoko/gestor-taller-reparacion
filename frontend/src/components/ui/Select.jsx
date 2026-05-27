import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Select = forwardRef(({ className, label, error, options = [], placeholder, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-red-300 bg-red-50' : 'border-secondary-300 bg-white',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label: optLabel }) => (
          <option key={value} value={value}>
            {optLabel}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
