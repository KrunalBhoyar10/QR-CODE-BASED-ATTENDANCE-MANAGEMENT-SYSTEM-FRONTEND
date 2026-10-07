import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlayIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'My Assignments', href: '/assignments', icon: BookOpenIcon },
    { name: 'Programs', href: '/programs', icon: AcademicCapIcon },
    { name: 'Active Sessions', href: '/active-sessions', icon: PlayIcon },
    { name: 'Previous Sessions', href: '/previous-sessions', icon: ClockIcon },
    { name: 'Attendance', href: '/attendance', icon: UserGroupIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
          <h1 className="text-xl font-bold text-white">Teacher Portal</h1>
          <button
            className="md:hidden text-white hover:text-gray-200"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700'
                      } mr-3 h-5 w-5 transition-colors duration-150`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.profile?.firstName?.charAt(0) || 'T'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Teacher'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-150"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Teacher Portal</h2>
            <div></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;