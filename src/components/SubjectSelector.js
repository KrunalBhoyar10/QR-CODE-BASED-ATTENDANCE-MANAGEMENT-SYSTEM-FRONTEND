import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const SubjectSelector = ({ 
  selectedProgram,
  selectedAcademicYear,
  selectedSection,
  selectedSubject, 
  onSubjectChange, 
  disabled = false, 
  className = '' 
}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedProgram || !selectedAcademicYear || !selectedSection) {
        setSubjects([]);
        onSubjectChange(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params = {
          programId: selectedProgram.id,
          academicYearId: selectedAcademicYear.id,
          sectionId: selectedSection.id
        };
        
        const response = await teacherAPI.getAssignedSubjects(params);
        setSubjects(response.data.data || []);
        
        // Reset selection when context changes
        onSubjectChange(null);
      } catch (err) {
        setError('Failed to load subjects');
        setSubjects([]);
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedProgram, selectedAcademicYear, selectedSection, onSubjectChange]);

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const subject = subjects.find(s => s.id === subjectId);
    onSubjectChange(subject || null);
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
          <div className="animate-pulse flex items-center">
            <div className="h-4 w-4 bg-gray-400 rounded mr-2"></div>
            <div className="h-4 w-24 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  const isDisabled = disabled || !selectedProgram || !selectedAcademicYear || !selectedSection || subjects.length === 0;

  return (
    <div className={className}>
      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
        Subject
      </label>
      <div className="relative">
        <select
          id="subject"
          value={selectedSubject?.id || ''}
          onChange={handleSubjectChange}
          disabled={isDisabled}
          className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BookOpenIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {(!selectedProgram || !selectedAcademicYear || !selectedSection) && (
        <p className="mt-1 text-sm text-gray-500">Please select program, academic year, and section first.</p>
      )}
      {selectedProgram && selectedAcademicYear && selectedSection && subjects.length === 0 && !loading && (
        <p className="mt-1 text-sm text-gray-500">No subjects available for selected context.</p>
      )}
    </div>
  );
};

export default SubjectSelector;