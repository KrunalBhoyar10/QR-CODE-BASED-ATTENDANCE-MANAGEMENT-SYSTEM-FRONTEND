import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import { CalendarIcon } from '@heroicons/react/24/outline';

const AcademicYearSelector = ({ 
  selectedProgram, 
  selectedAcademicYear, 
  onAcademicYearChange, 
  disabled = false, 
  className = '' 
}) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      if (!selectedProgram) {
        setAcademicYears([]);
        onAcademicYearChange(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await teacherAPI.getAssignedAcademicYears(selectedProgram.id);
        setAcademicYears(response.data.data || []);
        
        // Reset selection when program changes
        onAcademicYearChange(null);
      } catch (err) {
        setError('Failed to load academic years');
        setAcademicYears([]);
        console.error('Error fetching academic years:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicYears();
  }, [selectedProgram, onAcademicYearChange]);

  const handleAcademicYearChange = (e) => {
    const yearId = e.target.value;
    const academicYear = academicYears.find(y => y.id === yearId);
    onAcademicYearChange(academicYear || null);
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Academic Year
        </label>
        <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
          <div className="animate-pulse flex items-center">
            <div className="h-4 w-4 bg-gray-400 rounded mr-2"></div>
            <div className="h-4 w-20 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Academic Year
        </label>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  const isDisabled = disabled || !selectedProgram || academicYears.length === 0;

  return (
    <div className={className}>
      <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-1">
        Academic Year
      </label>
      <div className="relative">
        <select
          id="academic-year"
          value={selectedAcademicYear?.id || ''}
          onChange={handleAcademicYearChange}
          disabled={isDisabled}
          className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select academic year</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.label} (Year {year.yearNumber})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {!selectedProgram && (
        <p className="mt-1 text-sm text-gray-500">Please select a program first.</p>
      )}
      {selectedProgram && academicYears.length === 0 && !loading && (
        <p className="mt-1 text-sm text-gray-500">No academic years available for selected program.</p>
      )}
    </div>
  );
};

export default AcademicYearSelector;