import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  UserGroupIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Programs = () => {
  const [groupedAssignments, setGroupedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [expandedYears, setExpandedYears] = useState(new Set());

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAssignments();
      const data = response.data.data || {};
      setGroupedAssignments(data.grouped || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const toggleProgram = (programId) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const toggleYear = (programId, yearId) => {
    const key = `${programId}-${yearId}`;
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedYears(newExpanded);
  };

  if (loading) {
    return <LoadingSpinner text="Loading programs..." />;
  }

  if (groupedAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="mt-1 text-gray-600">
            View your assigned programs and subjects by academic structure
          </p>
        </div>

        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No programs assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any program assignments yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <p className="mt-1 text-gray-600">
          View your assigned programs and subjects organized by academic structure
        </p>
      </div>

      {/* Programs Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-blue-900">{groupedAssignments.length}</p>
              <p className="text-sm text-blue-700">Programs</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-900">
                {groupedAssignments.reduce((sum, program) => sum + program.academicYears.length, 0)}
              </p>
              <p className="text-sm text-green-700">Academic Years</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-purple-900">
                {groupedAssignments.reduce((sum, program) => 
                  sum + program.academicYears.reduce((yearSum, year) =>
                    yearSum + year.sections.reduce((sectionSum, section) =>
                      sectionSum + section.subjects.length, 0
                    ), 0
                  ), 0
                )}
              </p>
              <p className="text-sm text-purple-700">Subject Assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {groupedAssignments.map((program) => {
          const isProgramExpanded = expandedPrograms.has(program.programId);
          
          return (
            <div key={program.programId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Program Header */}
              <button
                onClick={() => toggleProgram(program.programId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <AcademicCapIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {program.programName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {program.programCode} • {program.durationYears} years • 
                      {program.academicYears.length} academic year(s) assigned
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    program.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {program.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {isProgramExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Program Content */}
              {isProgramExpanded && (
                <div className="border-t border-gray-200">
                  {program.academicYears.map((year) => {
                    const isYearExpanded = expandedYears.has(`${program.programId}-${year.academicYearId}`);
                    
                    return (
                      <div key={year.academicYearId} className="border-b border-gray-100 last:border-b-0">
                        {/* Academic Year Header */}
                        <button
                          onClick={() => toggleYear(program.programId, year.academicYearId)}
                          className="w-full px-8 py-3 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <div className="text-left">
                              <p className="text-md font-medium text-gray-900">
                                {year.label}
                              </p>
                              <p className="text-sm text-gray-600">
                                Year {year.yearNumber} • {year.sections.length} section(s)
                              </p>
                            </div>
                          </div>
                          
                          {isYearExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>

                        {/* Sections and Subjects */}
                        {isYearExpanded && (
                          <div className="px-10 pb-4">
                            <div className="space-y-3">
                              {year.sections.map((section) => (
                                <div key={section.sectionId} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          Section {section.sectionName}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Capacity: {section.capacity} students
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {section.subjects.length} subject(s)
                                    </p>
                                  </div>

                                  {/* Subjects Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {section.subjects.map((subject) => (
                                      <div
                                        key={subject.assignmentId}
                                        className="bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                              <BookOpenIcon className="h-4 w-4 text-primary-600 mr-1" />
                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                {subject.subjectName}
                                              </p>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">
                                              {subject.subjectCode}
                                            </p>
                                            {subject.credits && (
                                              <p className="text-xs text-gray-500">
                                                Credits: {subject.credits}
                                              </p>
                                            )}
                                          </div>
                                          
                                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                                            subject.status === 'ACTIVE'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {subject.status}
                                          </span>
                                        </div>

                                        {subject.startDate && (
                                          <div className="mt-2 pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-500">
                                              Started: {new Date(subject.startDate).toLocaleDateString()}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Assignment Summary</h2>
        <div className="space-y-3">
          {groupedAssignments.map((program) => (
            <div key={program.programId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-sm font-medium text-gray-900">
                {program.programName}
              </span>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{program.academicYears.length} year(s)</span>
                <span>
                  {program.academicYears.reduce((sum, year) => sum + year.sections.length, 0)} section(s)
                </span>
                <span>
                  {program.academicYears.reduce((sum, year) => 
                    sum + year.sections.reduce((sectionSum, section) =>
                      sectionSum + section.subjects.length, 0
                    ), 0
                  )} assignment(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Programs;