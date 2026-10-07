import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  (
    {
      label,
      options = [],
      placeholder = 'Select an option',
      error,
      helperText,
      className = '',
      id,
      name,
      required = false,
      disabled = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const selectId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-200'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => {
              const optVal = typeof option === 'object' ? option.value : option;
              const optLabel = typeof option === 'object' ? option.label : option;
              return (
                <option key={optVal} value={optVal}>
                  {optLabel}
                </option>
              );
            })}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
