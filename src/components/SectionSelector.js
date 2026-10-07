import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const SectionSelector = ({ 
  selectedAcademicYear, 
  selectedSection, 
  onSectionChange, 
  disabled = false, 
  className = '' 
}) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedAcademicYear) {
        setSections([]);
        onSectionChange(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await teacherAPI.getAssignedSections(selectedAcademicYear.id);
        setSections(response.data.data || []);
        
        // Reset selection when academic year changes
        onSectionChange(null);
      } catch (err) {
        setError('Failed to load sections');
        setSections([]);
        console.error('Error fetching sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [selectedAcademicYear, onSectionChange]);

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    const section = sections.find(s => s.id === sectionId);
    onSectionChange(section || null);
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Section
        </label>
        <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
          <div className="animate-pulse flex items-center">
            <div className="h-4 w-4 bg-gray-400 rounded mr-2"></div>
            <div className="h-4 w-16 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Section
        </label>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  const isDisabled = disabled || !selectedAcademicYear || sections.length === 0;

  return (
    <div className={className}>
      <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
        Section
      </label>
      <div className="relative">
        <select
          id="section"
          value={selectedSection?.id || ''}
          onChange={handleSectionChange}
          disabled={isDisabled}
          className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name} (Capacity: {section.capacity})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {!selectedAcademicYear && (
        <p className="mt-1 text-sm text-gray-500">Please select an academic year first.</p>
      )}
      {selectedAcademicYear && sections.length === 0 && !loading && (
        <p className="mt-1 text-sm text-gray-500">No sections available for selected academic year.</p>
      )}
    </div>
  );
};

export default SectionSelector;