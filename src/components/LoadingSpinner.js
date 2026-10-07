import React from 'react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 ${sizeClasses[size]} mx-auto mb-4`}></div>
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;