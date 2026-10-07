import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import AssignmentCard from '../components/AssignmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BookOpenIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [groupedAssignments, setGroupedAssignments] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAssignments();
      const data = response.data.data || {};
      
      setAssignments(data.assignments || []);
      setGroupedAssignments(data.grouped || []);
      setTeacher(data.teacher);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = assignments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.subject?.name?.toLowerCase().includes(term) ||
        assignment.subject?.code?.toLowerCase().includes(term) ||
        assignment.program?.name?.toLowerCase().includes(term) ||
        assignment.section?.name?.toLowerCase().includes(term)
      );
    }

    setAssignments(filtered);
  };

  const handleAssignmentClick = async (assignment) => {
    try {
      const response = await teacherAPI.getAssignmentById(assignment.id);
      setSelectedAssignment(response.data.data);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      toast.error('Failed to load assignment details');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading assignments..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teaching Assignments</h1>
          <p className="mt-1 text-gray-600">
            View and manage your assigned subjects and classes
          </p>
        </div>
        
        {teacher && (
          <div className="mt-4 sm:mt-0">
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <p className="text-sm font-medium text-primary-900">
                {teacher.name}
              </p>
              <p className="text-sm text-primary-700">
                {teacher.employeeId} • {teacher.department?.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
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
                placeholder="Search by subject, program, or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Assignment Details</h2>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm text-gray-900">{selectedAssignment.subject?.name}</p>
                  <p className="text-xs text-gray-500">{selectedAssignment.subject?.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedAssignment.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAssignment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program</label>
                  <p className="text-sm text-gray-900">{selectedAssignment.program?.name}</p>
                  <p className="text-xs text-gray-500">{selectedAssignment.program?.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <p className="text-sm text-gray-900">{selectedAssignment.academicYear?.label}</p>
                  <p className="text-xs text-gray-500">Year {selectedAssignment.academicYear?.yearNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <p className="text-sm text-gray-900">{selectedAssignment.section?.name}</p>
                  <p className="text-xs text-gray-500">Capacity: {selectedAssignment.section?.capacity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Credits</label>
                  <p className="text-sm text-gray-900">{selectedAssignment.subject?.credits || 'N/A'}</p>
                </div>
              </div>

              {selectedAssignment.startDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedAssignment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedAssignment.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedAssignment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-blue-900">{assignments.length}</p>
              <p className="text-sm text-blue-700">Total Assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-900">
                {assignments.filter(a => a.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-green-700">Active Assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-purple-900">{groupedAssignments.length}</p>
              <p className="text-sm text-purple-700">Programs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'You have no teaching assignments yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onClick={() => handleAssignmentClick(assignment)}
              className="hover:shadow-lg transition-shadow duration-200"
            />
          ))}
        </div>
      )}

      {/* Grouped View Toggle */}
      {groupedAssignments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assignments by Program</h2>
          <div className="space-y-4">
            {groupedAssignments.map((program) => (
              <div key={program.programId} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {program.programName} ({program.programCode})
                </h3>
                
                {program.academicYears.map((year) => (
                  <div key={year.academicYearId} className="ml-4 mb-3">
                    <h4 className="text-md font-medium text-gray-800 mb-1">
                      {year.label}
                    </h4>
                    
                    {year.sections.map((section) => (
                      <div key={section.sectionId} className="ml-4 mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Section {section.sectionName}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {section.subjects.map((subject) => (
                            <span
                              key={subject.assignmentId}
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                                subject.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {subject.subjectName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssignments;