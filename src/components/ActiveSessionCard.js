import React from 'react';
import SessionTimer from './SessionTimer';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const ActiveSessionCard = ({ session, onClose, onViewDetails, className = '' }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-6">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">ACTIVE SESSION</span>
            </div>
            
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                {session.subject?.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500">{session.subject?.code}</p>
          </div>

          <SessionTimer 
            expiryTime={session.expiryTime}
            onExpiry={() => {
              // Session expired - could trigger refresh of active sessions
              console.log('Session expired:', session.id);
            }}
          />
        </div>

        {/* Session Details */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            <span>{session.program?.name} - {session.academicYear?.label}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            <span>Section {session.section?.name}</span>
            {session.totalAttendanceMarked !== undefined && (
              <span className="ml-auto font-medium text-blue-600">
                {session.totalAttendanceMarked} marked
              </span>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>Radius: {session.allowedRadius}m</span>
          </div>

          {session.faceVerificationRequired && (
            <div className="flex items-center text-sm text-amber-600">
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              <span>Face verification required</span>
            </div>
          )}
        </div>

        {/* Time Information */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Started: {formatTime(session.startTime)}</span>
            <span>Expires: {formatTime(session.expiryTime)}</span>
          </div>
        </div>

        {/* Cache Status (for debugging) */}
        {session.hasActiveCache !== undefined && (
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              session.hasActiveCache 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {session.hasActiveCache ? 'Live' : 'Offline'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 mt-4">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(session)}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
            >
              View QR & Details
            </button>
          )}
          
          {onClose && (
            <button
              onClick={() => onClose(session)}
              className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors duration-200"
            >
              <StopIcon className="h-4 w-4 mr-1" />
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionCard;