import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  UserIcon, 
  PencilIcon, 
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    designation: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getProfile();
      const profileData = response.data.data;
      setProfile(profileData);
      
      // Initialize edit form with current data
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        designation: profileData.designation || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await teacherAPI.updateProfile(editForm);
      setProfile(response.data.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      await teacherAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    // Reset form to original values
    setEditForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phoneNumber: profile.phoneNumber || '',
      designation: profile.designation || ''
    });
  };

  const cancelPasswordChange = () => {
    setChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-600">
          Manage your account information and settings
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Profile Avatar */}
          <div className="flex items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {profile.firstName?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-gray-600">{profile.designation || 'Teacher'}</p>
              <p className="text-sm text-gray-500">ID: {profile.employeeId}</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile.firstName || 'Not set'}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile.lastName || 'Not set'}</p>
              )}
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-sm text-gray-900 py-2">{profile.email}</p>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile.phoneNumber || 'Not set'}</p>
              )}
            </div>

            {/* Employee ID (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <p className="text-sm text-gray-900 py-2">{profile.employeeId}</p>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => handleEditChange('designation', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile.designation || 'Not set'}</p>
              )}
            </div>

            {/* Department (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <p className="text-sm text-gray-900 py-2">
                {profile.department ? `${profile.department.name} (${profile.department.code})` : 'Not assigned'}
              </p>
            </div>

            {/* Account Status (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <div className="py-2">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  profile.isActive 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1 inline" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CheckIcon className="h-4 w-4 mr-1 inline" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
            {!changingPassword && (
              <button
                onClick={() => setChangingPassword(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <KeyIcon className="h-4 w-4 mr-1" />
                Change Password
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          {changingPassword ? (
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-600 mb-1">Password requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Must be different from current password</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelPasswordChange}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1 inline" />
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <KeyIcon className="h-4 w-4 mr-1 inline" />
                  Change Password
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Change your account password. Make sure to use a strong, unique password.
            </p>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Last Login:</span>
            <span className="font-medium text-gray-900">
              {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account Created:</span>
            <span className="font-medium text-gray-900">
              {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium text-gray-900">
              {new Date(profile.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Must Change Password:</span>
            <span className={`font-medium ${profile.mustChangePassword ? 'text-red-600' : 'text-green-600'}`}>
              {profile.mustChangePassword ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;