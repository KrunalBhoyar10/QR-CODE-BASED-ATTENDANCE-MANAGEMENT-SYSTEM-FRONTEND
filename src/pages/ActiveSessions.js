import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import ActiveSessionCard from '../components/ActiveSessionCard';
import SessionCreationForm from '../components/SessionCreationForm';
import QRDisplay from '../components/QRDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PlusIcon, 
  PlayIcon, 
  RefreshIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ActiveSessions = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchActiveSessions();
    
    // Set up polling for active sessions
    const interval = setInterval(() => {
      fetchActiveSessions(true); // Silent refresh
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(!silent);
      
      const response = await teacherAPI.getActiveSessions();
      const sessions = response.data.data || [];
      setActiveSessions(sessions);
      
      if (!silent && sessions.length === 0) {
        toast('No active sessions found', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      if (!silent) {
        toast.error('Failed to load active sessions');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSessionCreated = async (sessionData) => {
    toast.success('Session created successfully!');
    setSelectedSession(sessionData);
    setShowCreateSession(false);
    await fetchActiveSessions(); // Refresh the list
  };

  const handleCloseSession = async (session) => {
    try {
      await teacherAPI.closeSession(session.id);
      toast.success('Session closed successfully');
      
      // Remove from local state
      setActiveSessions(prev => prev.filter(s => s.id !== session.id));
      
      // Close QR display if this session is currently displayed
      if (selectedSession && selectedSession.session.id === session.id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
    }
  };

  const handleViewSessionDetails = async (session) => {
    try {
      // Fetch fresh session data with QR information
      const response = await teacherAPI.getSessionById(session.id);
      const sessionData = response.data.data;
      
      // Create QR data structure
      const qrPayload = {
        sessionId: session.id,
        token: `session-${session.id}-${Date.now()}`, // Mock token
        expiresAt: session.expiryTime,
        type: 'ATTENDANCE_SESSION',
      };
      
      const qrCodeData = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
      
      const sessionWithQR = {
        session: sessionData.session,
        qr: {
          data: qrCodeData,
          payload: qrPayload,
          expiresAt: session.expiryTime,
          ttlSeconds: Math.max(0, Math.floor((new Date(session.expiryTime) - new Date()) / 1000))
        }
      };
      
      setSelectedSession(sessionWithQR);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const handleRefresh = () => {
    fetchActiveSessions();
  };

  if (loading) {
    return <LoadingSpinner text="Loading active sessions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
          <p className="mt-1 text-gray-600">
            Manage your currently running attendance sessions
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <RefreshIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateSession(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-900">{activeSessions.length}</p>
              <p className="text-sm text-green-700">Active Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-blue-900">
                {activeSessions.reduce((sum, session) => sum + (session.totalAttendanceMarked || 0), 0)}
              </p>
              <p className="text-sm text-blue-700">Total Attendance</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-purple-900">
                {activeSessions.filter(s => 
                  new Date(s.sessionDate).toDateString() === new Date().toDateString()
                ).length}
              </p>
              <p className="text-sm text-purple-700">Today's Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Display Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-screen overflow-y-auto">
            <QRDisplay
              session={selectedSession}
              qrData={selectedSession.qr}
              onClose={() => setSelectedSession(null)}
            />
          </div>
        </div>
      )}

      {/* Create Session Form */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-screen overflow-y-auto">
            <SessionCreationForm
              onSessionCreated={handleSessionCreated}
              onCancel={() => setShowCreateSession(false)}
            />
          </div>
        </div>
      )}

      {/* Active Sessions List */}
      {activeSessions.length === 0 ? (
        <div className="text-center py-12">
          <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new attendance session to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateSession(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Session
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeSessions.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
              onClose={handleCloseSession}
              onViewDetails={handleViewSessionDetails}
              className="border-l-4 border-l-green-500"
            />
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {activeSessions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RefreshIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                This page automatically refreshes every 15 seconds to show the latest session status.
                {refreshing && <span className="ml-1 font-medium">Refreshing...</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;