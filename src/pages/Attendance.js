import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import AttendanceTable from '../components/AttendanceTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  UserGroupIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const Attendance = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAttendance(selectedSession.id);
    }
  }, [selectedSession, pagination.page, searchTerm, statusFilter]);

  const fetchRecentSessions = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getSessions({ 
        limit: 50,
        status: 'COMPLETED' 
      });
      const data = response.data.data || {};
      setSessions(data.sessions || []);
      
      // Auto-select the most recent session
      if (data.sessions && data.sessions.length > 0) {
        setSelectedSession(data.sessions[0]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionAttendance = async (sessionId) => {
    try {
      setAttendanceLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await teacherAPI.getSessionAttendance(sessionId, params);
      const data = response.data;
      
      setAttendanceRecords(data.data || []);
      setAttendanceSummary(data.pagination?.summary);
      setPagination({
        ...data.pagination,
        page: data.pagination?.page || 1
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSessionChange = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    setSelectedSession(session);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset pagination
    setSearchTerm(''); // Reset search
    setStatusFilter('all'); // Reset filter
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDateTime = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return <LoadingSpinner text="Loading attendance data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="mt-1 text-gray-600">
          View and analyze student attendance for your sessions
        </p>
      </div>

      {/* Session Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <label htmlFor="session-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Session
            </label>
            <select
              id="session-select"
              value={selectedSession?.id || ''}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Choose a session...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.subject?.name} - {session.program?.name} - 
                  Section {session.section?.name} - {formatDateTime(session.sessionDate)}
                </option>
              ))}
            </select>
          </div>

          {selectedSession && (
            <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
              <div className="text-sm">
                <p className="font-medium text-primary-900">
                  {selectedSession.subject?.name}
                </p>
                <p className="text-primary-700">
                  {selectedSession.program?.name} - {selectedSession.academicYear?.label}
                </p>
                <p className="text-primary-600">
                  Section {selectedSession.section?.name} • {formatDateTime(selectedSession.sessionDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No session selected */}
      {!selectedSession && sessions.length > 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a session</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a session from the dropdown above to view attendance records.
          </p>
        </div>
      )}

      {/* No sessions available */}
      {sessions.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't conducted any sessions yet. Create a session to start recording attendance.
          </p>
        </div>
      )}

      {/* Attendance Summary */}
      {selectedSession && attendanceSummary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Attendance Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-green-900">
                    {attendanceSummary.totalPresent || 0}
                  </p>
                  <p className="text-sm text-green-700">Present</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-red-900">
                    {attendanceSummary.totalAbsent || 0}
                  </p>
                  <p className="text-sm text-red-700">Absent</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-amber-900">
                    {attendanceSummary.totalLate || 0}
                  </p>
                  <p className="text-sm text-amber-700">Late</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-blue-900">
                    {attendanceSummary.attendancePercentage?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-sm text-blue-700">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {selectedSession && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by student name, enrollment number, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      {selectedSession && (
        <AttendanceTable
          records={attendanceRecords}
          loading={attendanceLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          showSessionInfo={false} // Don't show session info since we're already in session context
          className="shadow-sm"
        />
      )}
    </div>
  );
};

export default Attendance;