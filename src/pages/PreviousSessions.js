import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ClockIcon, 
  EyeIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const PreviousSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    subjectId: '',
    sectionId: ''
  });
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, pagination.limit, filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await teacherAPI.getSessions(params);
      const data = response.data.data || {};
      
      setSessions(data.sessions || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleViewSession = async (session) => {
    try {
      const response = await teacherAPI.getSessionById(session.id);
      setSelectedSession(response.data.data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDateTime = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Set default date range to current month if not set
  useEffect(() => {
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      
      setFilters(prev => ({
        ...prev,
        startDate: monthStart,
        endDate: monthEnd
      }));
    }
  }, []);

  if (loading && sessions.length === 0) {
    return <LoadingSpinner text="Loading previous sessions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Previous Sessions</h1>
        <p className="mt-1 text-gray-600">
          View and analyze your completed attendance sessions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          {/* Quick Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Filter
            </label>
            <select
              onChange={(e) => {
                const value = e.target.value;
                const now = new Date();
                let startDate = '';
                let endDate = format(now, 'yyyy-MM-dd');
                
                switch (value) {
                  case 'today':
                    startDate = format(now, 'yyyy-MM-dd');
                    break;
                  case 'this-month':
                    startDate = format(startOfMonth(now), 'yyyy-MM-dd');
                    endDate = format(endOfMonth(now), 'yyyy-MM-dd');
                    break;
                  case 'last-month':
                    const lastMonth = subMonths(now, 1);
                    startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                    endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                    break;
                  default:
                    return;
                }
                
                setFilters(prev => ({ ...prev, startDate, endDate }));
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              defaultValue=""
            >
              <option value="">Select range...</option>
              <option value="today">Today</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Session Details</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedSession.session.subject?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedSession.session.subject?.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedSession.session.program?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedSession.session.academicYear?.label} - Section {selectedSession.session.section?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedSession.session.sessionDate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Duration: {formatDuration(selectedSession.session.startTime, selectedSession.session.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedSession.session.status)}`}>
                            {selectedSession.session.status}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            Type: {selectedSession.session.sessionType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allowed Radius:</span>
                        <span className="font-medium">{selectedSession.session.allowedRadius}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Face Verification:</span>
                        <span className="font-medium">
                          {selectedSession.session.faceVerificationRequired ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      {selectedSession.session.latitude && selectedSession.session.longitude && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-xs">
                            {selectedSession.session.latitude.toFixed(4)}, {selectedSession.session.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance Summary</h3>
                    
                    {selectedSession.attendanceSummary && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedSession.attendanceSummary.totalPresent || 0}
                            </p>
                            <p className="text-sm text-gray-600">Present</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">
                              {selectedSession.attendanceSummary.totalAbsent || 0}
                            </p>
                            <p className="text-sm text-gray-600">Absent</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-amber-600">
                              {selectedSession.attendanceSummary.totalLate || 0}
                            </p>
                            <p className="text-sm text-gray-600">Late</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedSession.attendanceSummary.attendancePercentage?.toFixed(1) || '0.0'}%
                            </p>
                            <p className="text-sm text-gray-600">Attendance Rate</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject & Program
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading rows
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7" className="px-6 py-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="rounded bg-gray-200 h-4 w-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p>No sessions found for the selected criteria</p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.subject?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.program?.name}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.academicYear?.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        Section {session.section?.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(session.sessionDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(session.startTime)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(session.startTime, session.endTime)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {session.sessionType}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.totalAttendanceMarked || 0} marked
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewSession(session)}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousSessions;