import React from 'react';
import QRCode from 'react-qr-code';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const QRDisplay = ({ session, qrData, onClose, className = '' }) => {
  if (!session || !qrData) {
    return null;
  }

  const { session: sessionData } = session;
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Attendance Session Active</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-primary-200 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-primary-100 mt-1">Students can now scan the QR code to mark attendance</p>
      </div>

      <div className="p-6">
        {/* Session Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">{sessionData.subject?.name}</p>
                <p className="text-sm text-gray-500">{sessionData.subject?.code}</p>
              </div>
            </div>

            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {sessionData.program?.name} - {sessionData.academicYear?.label}
                </p>
                <p className="text-sm text-gray-500">Section {sessionData.section?.name}</p>
              </div>
            </div>

            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(sessionData.startTime)} - {formatTime(sessionData.expiryTime)}
                </p>
                <p className="text-sm text-gray-500">
                  Started: {formatDate(sessionData.startTime)}
                </p>
              </div>
            </div>

            {sessionData.latitude && sessionData.longitude && (
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Radius: {sessionData.allowedRadius}m
                  </p>
                  <p className="text-sm text-gray-500">
                    Location: {sessionData.latitude.toFixed(4)}, {sessionData.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            )}

            {sessionData.faceVerificationRequired && (
              <div className="flex items-center text-amber-600">
                <UserGroupIcon className="h-5 w-5 mr-3" />
                <p className="text-sm font-medium">Face verification required</p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
              <QRCode
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={qrData.data}
                viewBox={`0 0 200 200`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Session ID: {sessionData.id}
            </p>
            <p className="text-xs text-gray-500 text-center">
              Expires: {formatTime(qrData.expiresAt)}
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">{sessionData.id}</p>
              <p className="text-sm text-gray-600">Session ID</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((qrData.ttlSeconds || 0) / 60)}
              </p>
              <p className="text-sm text-gray-600">Duration (minutes)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{sessionData.section?.capacity || 0}</p>
              <p className="text-sm text-gray-600">Expected Students</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions for Students:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Open your student attendance app</li>
            <li>2. Tap "Mark Attendance" or scan QR code</li>
            <li>3. Point camera at the QR code above</li>
            {sessionData.faceVerificationRequired && (
              <li>4. Complete face verification when prompted</li>
            )}
            <li>{sessionData.faceVerificationRequired ? '5' : '4'}. Ensure you are within {sessionData.allowedRadius}m of the session location</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This session will automatically expire at {formatTime(qrData.expiresAt)}. 
            Students will not be able to mark attendance after this time unless late scan is enabled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;