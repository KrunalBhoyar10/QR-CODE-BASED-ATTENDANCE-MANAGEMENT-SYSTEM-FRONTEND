import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while communicating with the server.',
  onRetry,
  action,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-xl border border-rose-200/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      <p className="mt-1 text-xs text-rose-700/80 max-w-md">{message}</p>
      <div className="mt-4 flex items-center gap-3">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="border-rose-300 text-rose-700 hover:bg-rose-100/60"
          >
            Try Again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
};

export default ErrorState;
