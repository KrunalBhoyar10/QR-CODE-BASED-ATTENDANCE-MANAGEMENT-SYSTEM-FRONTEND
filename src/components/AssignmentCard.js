import React from 'react';
import { AcademicCapIcon, UserGroupIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const AssignmentCard = ({ assignment, onClick, className = '' }) => {
  const { program, academicYear, section, subject, status } = assignment;

  const statusColors = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'COMPLETED': 'bg-blue-100 text-blue-800',
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <BookOpenIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {subject?.name}
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Code:</span> {subject?.code}
          </p>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <AcademicCapIcon className="h-4 w-4 mr-1" />
            <span>{program?.name} - {academicYear?.label}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>Section {section?.name} ({section?.capacity} students)</span>
          </div>

          {subject?.credits && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Credits:</span> {subject.credits}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors.INACTIVE}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Assignment ID: {assignment.id}</span>
          {assignment.startDate && (
            <span>
              Start: {new Date(assignment.startDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;