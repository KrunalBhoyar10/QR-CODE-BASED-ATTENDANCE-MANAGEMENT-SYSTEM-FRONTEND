import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const SessionTimer = ({ expiryTime, onExpiry, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        if (onExpiry) {
          onExpiry();
        }
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, isExpired, onExpiry]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getColorClass = () => {
    if (isExpired) return 'text-red-600';
    if (timeRemaining < 60000) return 'text-red-500'; // Last minute
    if (timeRemaining < 300000) return 'text-amber-500'; // Last 5 minutes
    return 'text-green-600';
  };

  const getBackgroundClass = () => {
    if (isExpired) return 'bg-red-50 border-red-200';
    if (timeRemaining < 60000) return 'bg-red-50 border-red-200'; // Last minute
    if (timeRemaining < 300000) return 'bg-amber-50 border-amber-200'; // Last 5 minutes
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${getBackgroundClass()} ${className}`}>
      <ClockIcon className={`h-5 w-5 mr-2 ${getColorClass()}`} />
      <div className="text-center">
        <div className={`text-lg font-mono font-bold ${getColorClass()}`}>
          {isExpired ? 'EXPIRED' : formatTime(timeRemaining)}
        </div>
        {!isExpired && (
          <div className="text-xs text-gray-500">
            {timeRemaining < 60000 ? 'seconds remaining' : 'remaining'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionTimer;