import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const ProgramSelector = ({ selectedProgram, onProgramChange, disabled = false, className = '' }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await teacherAPI.getAssignedPrograms();
        setPrograms(response.data.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to load programs');
        console.error('Error fetching programs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const handleProgramChange = (e) => {
    const programId = e.target.value;
    const program = programs.find(p => p.id === programId);
    onProgramChange(program || null);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Program
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
          Program
        </label>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
        Program
      </label>
      <div className="relative">
        <select
          id="program"
          value={selectedProgram?.id || ''}
          onChange={handleProgramChange}
          disabled={disabled || programs.length === 0}
          className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select a program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name} ({program.code})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <AcademicCapIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {programs.length === 0 && !loading && (
        <p className="mt-1 text-sm text-gray-500">No programs assigned to you.</p>
      )}
    </div>
  );
};

export default ProgramSelector;