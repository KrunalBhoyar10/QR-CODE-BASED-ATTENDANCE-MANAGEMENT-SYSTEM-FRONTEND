import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({
  size = 'md',
  fullPage = false,
  message = 'Loading...',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2
        className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600`}
      />
      {message && (
        <p className="text-xs font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex justify-center">{spinner}</div>;
};

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
    />
  );
};

export default Loader;
