import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 focus-visible:ring-indigo-500',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus-visible:ring-slate-400',
  outline:
    'bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-300 focus-visible:ring-indigo-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 focus-visible:ring-rose-500',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
  link:
    'bg-transparent text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-indigo-400',
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md font-medium',
  md: 'px-4 py-2 text-sm rounded-lg font-medium',
  lg: 'px-5 py-2.5 text-base rounded-lg font-semibold',
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      className = '',
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        className={`inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98] ${
          variantClasses[variant] || variantClasses.primary
        } ${variant !== 'link' ? sizeClasses[size] || sizeClasses.md : ''} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
