import React, { useState, useEffect } from 'react';
import { teacherAPI, getGeolocation } from '../services/api';
import ProgramSelector from './ProgramSelector';
import AcademicYearSelector from './AcademicYearSelector';
import SectionSelector from './SectionSelector';
import SubjectSelector from './SubjectSelector';
import { MapPinIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SessionCreationForm = ({ onSessionCreated, onCancel, className = '' }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [teachingAssignmentId, setTeachingAssignmentId] = useState('');
  
  const [formData, setFormData] = useState({
    durationMinutes: 10,
    allowedRadius: 50,
    faceVerificationRequired: false,
    sessionType: 'REGULAR',
    allowLateScan: false
  });
  
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignments, setAssignments] = useState([]);

  // Fetch assignments when component mounts
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await teacherAPI.getAssignments();
        setAssignments(response.data.data?.assignments || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };
    fetchAssignments();
  }, []);

  // Find matching assignment when selections change
  useEffect(() => {
    if (selectedProgram && selectedAcademicYear && selectedSection && selectedSubject) {
      const assignment = assignments.find(a => 
        a.program?.id === selectedProgram.id &&
        a.academicYear?.id === selectedAcademicYear.id &&
        a.section?.id === selectedSection.id &&
        a.subject?.id === selectedSubject.id &&
        a.status === 'ACTIVE'
      );
      
      if (assignment) {
        setTeachingAssignmentId(assignment.id);
      } else {
        setTeachingAssignmentId('');
        toast.error('No active assignment found for selected combination');
      }
    } else {
      setTeachingAssignmentId('');
    }
  }, [selectedProgram, selectedAcademicYear, selectedSection, selectedSubject, assignments]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const coords = await getGeolocation();
      setLocation(coords);
      toast.success(`Location acquired (±${Math.round(coords.accuracy)}m accuracy)`);
    } catch (error) {
      toast.error(error.message);
      console.error('Geolocation error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!teachingAssignmentId) {
      toast.error('Please select a valid program, academic year, section, and subject combination');
      return;
    }

    if (!location) {
      toast.error('Please get your current location first');
      return;
    }

    setCreating(true);
    
    try {
      const sessionData = {
        teachingAssignmentId,
        durationMinutes: formData.durationMinutes,
        allowedRadius: formData.allowedRadius,
        latitude: location.latitude,
        longitude: location.longitude,
        faceVerificationRequired: formData.faceVerificationRequired,
        sessionType: formData.sessionType,
        allowLateScan: formData.allowLateScan
      };

      const response = await teacherAPI.createSession(sessionData);
      const sessionResult = response.data.data;
      
      toast.success('Attendance session created successfully!');
      onSessionCreated(sessionResult);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create session';
      toast.error(message);
      console.error('Session creation error:', error);
    } finally {
      setCreating(false);
    }
  };

  const isFormValid = selectedProgram && selectedAcademicYear && selectedSection && 
                    selectedSubject && teachingAssignmentId && location &&
                    formData.durationMinutes > 0 && formData.allowedRadius > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Create Attendance Session</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic Context Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProgramSelector
            selectedProgram={selectedProgram}
            onProgramChange={setSelectedProgram}
          />
          
          <AcademicYearSelector
            selectedProgram={selectedProgram}
            selectedAcademicYear={selectedAcademicYear}
            onAcademicYearChange={setSelectedAcademicYear}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionSelector
            selectedAcademicYear={selectedAcademicYear}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
          />
          
          <SubjectSelector
            selectedProgram={selectedProgram}
            selectedAcademicYear={selectedAcademicYear}
            selectedSection={selectedSection}
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
          />
        </div>

        {/* Assignment Validation */}
        {selectedProgram && selectedAcademicYear && selectedSection && selectedSubject && (
          <div className="p-3 rounded-md bg-gray-50 border">
            {teachingAssignmentId ? (
              <p className="text-sm text-green-700 flex items-center">
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Valid assignment found (ID: {teachingAssignmentId})
              </p>
            ) : (
              <p className="text-sm text-red-700">
                No active assignment found for this combination
              </p>
            )}
          </div>
        )}

        {/* Session Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="180"
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value) || 0)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="10"
              />
              <ClockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowed Radius (meters)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.allowedRadius}
                onChange={(e) => handleInputChange('allowedRadius', parseInt(e.target.value) || 0)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="50"
              />
              <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Location
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <MapPinIcon className="h-4 w-4 mr-2" />
              {locationLoading ? 'Getting Location...' : 'Get Current Location'}
            </button>
            
            {location && (
              <span className="text-sm text-green-600">
                ✓ Location acquired (±{Math.round(location.accuracy)}m)
              </span>
            )}
          </div>
          
          {location && (
            <div className="mt-2 text-xs text-gray-500">
              Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="face-verification"
              type="checkbox"
              checked={formData.faceVerificationRequired}
              onChange={(e) => handleInputChange('faceVerificationRequired', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="face-verification" className="ml-2 block text-sm text-gray-700">
              Require face verification for attendance
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="allow-late-scan"
              type="checkbox"
              checked={formData.allowLateScan}
              onChange={(e) => handleInputChange('allowLateScan', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="allow-late-scan" className="ml-2 block text-sm text-gray-700">
              Allow attendance after session expires
            </label>
          </div>
        </div>

        {/* Session Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Type
          </label>
          <select
            value={formData.sessionType}
            onChange={(e) => handleInputChange('sessionType', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="REGULAR">Regular Class</option>
            <option value="LAB">Lab Session</option>
            <option value="TUTORIAL">Tutorial</option>
            <option value="EXTRA">Extra Class</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={!isFormValid || creating}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionCreationForm;