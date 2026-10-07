import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import ActiveSessionCard from '../components/ActiveSessionCard';
import SessionCreationForm from '../components/SessionCreationForm';
import QRDisplay from '../components/QRDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PlusIcon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeSessions: 0,
    todaysSessions: 0,
    totalAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up polling for active sessions
    const interval = setInterval(fetchActiveSessions, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, assignmentsRes] = await Promise.all([
        teacherAPI.getActiveSessions(),
        teacherAPI.getAssignments()
      ]);

      const sessions = sessionsRes.data.data || [];
      const assignmentsData = assignmentsRes.data.data || {};

      setActiveSessions(sessions);
      setAssignments(assignmentsData.assignments || []);

      // Calculate stats
      setStats({
        totalAssignments: assignmentsData.totalCount || 0,
        activeSessions: sessions.length,
        todaysSessions: sessions.filter(s => 
          new Date(s.sessionDate).toDateString() === new Date().toDateString()
        ).length,
        totalAttendance: sessions.reduce((sum, s) => sum + (s.totalAttendanceMarked || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await teacherAPI.getActiveSessions();
      const sessions = response.data.data || [];
      setActiveSessions(sessions);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeSessions: sessions.length,
        totalAttendance: sessions.reduce((sum, s) => sum + (s.totalAttendanceMarked || 0), 0)
      }));
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const handleSessionCreated = (sessionData) => {
    toast.success('Session created successfully!');
    setSelectedSession(sessionData);
    setShowCreateSession(false);
    fetchActiveSessions(); // Refresh active sessions
  };

  const handleCloseSession = async (session) => {
    try {
      await teacherAPI.closeSession(session.id);
      toast.success('Session closed successfully');
      fetchActiveSessions();
      if (selectedSession && selectedSession.session.id === session.id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
    }
  };

  const handleViewSessionDetails = (session) => {
    // Create a mock session data structure for QR display
    const sessionData = {
      session: session,
      qr: {
        data: `attendance-session-${session.id}`, // This would normally be the actual QR data
        expiresAt: session.expiryTime,
        ttlSeconds: Math.floor((new Date(session.expiryTime) - new Date()) / 1000)
      }
    };
    setSelectedSession(sessionData);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  // Quick stats cards
  const statCards = [
    { label: 'Total Assignments', value: stats.totalAssignments, icon: BookOpenIcon, color: 'blue' },
    { label: 'Active Sessions', value: stats.activeSessions, icon: PlayIcon, color: 'green' },
    { label: "Today's Sessions", value: stats.todaysSessions, icon: ClockIcon, color: 'amber' },
    { label: 'Total Attendance', value: stats.totalAttendance, icon: UserGroupIcon, color: 'purple' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.profile?.firstName || 'Teacher'}!
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your attendance sessions and track student participation
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateSession(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-md ${colorClasses[stat.color]}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.label}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
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

      {/* Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
          <Link
            to="/active-sessions"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all →
          </Link>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-12">
            <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first attendance session.
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
            {activeSessions.slice(0, 4).map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                onClose={handleCloseSession}
                onViewDetails={handleViewSessionDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Assignments</h2>
          <Link
            to="/assignments"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all →
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <BookOpenIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No assignments found</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {assignments.slice(0, 5).map((assignment) => (
                <li key={assignment.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.subject?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {assignment.program?.name} - {assignment.academicYear?.label} - Section {assignment.section?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        assignment.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/programs"
            className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
            View Programs
          </Link>
          
          <Link
            to="/previous-sessions"
            className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            Session History
          </Link>
          
          <Link
            to="/attendance"
            className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
            View Attendance
          </Link>
          
          <Link
            to="/profile"
            className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
            Profile Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;