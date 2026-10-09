import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  QrCode,
  LayoutDashboard,
  LogOut,
  KeyRound,
  User,
  Menu,
  X,
  Shield,
  ChevronRight,
  Building2,
  CalendarCheck,
  Users,
  FileText,
  BookOpen,
  Layers,
  Grid,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_LABELS, ROLE_DASHBOARDS } from '../utils/constants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { getErrorMessage } from '../utils/error';

export const DashboardLayout = () => {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logout dialog state
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password successfully updated! Please remember your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Failed to update password. Please check your current password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Nav links based on current role
  const getNavLinks = () => {
    if (!user) return [];

    const links = [];

    if (user.role === ROLES.PRINCIPAL) {
      links.push(
        { name: 'Dashboard', path: '/principal/dashboard', icon: LayoutDashboard },
        { name: 'Departments', path: '/principal/departments', icon: Building2 },
        { name: 'HOD Management', path: '/principal/hods', icon: Users },
        { name: 'Attendance', path: '/principal/attendance', icon: CalendarCheck },
        { name: 'Reports', path: '/principal/reports', icon: FileText }
      );
    } else if (user.role === ROLES.HOD) {
      links.push(
        { name: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
        { name: 'Department', path: '/hod/department', icon: Building2 },
        { name: 'Programs', path: '/hod/programs', icon: BookOpen },
        { name: 'Academic Years', path: '/hod/academic-years', icon: Layers },
        { name: 'Sections', path: '/hod/sections', icon: Grid },
        { name: 'Subjects', path: '/hod/subjects', icon: BookOpen },
        { name: 'Teachers', path: '/hod/teachers', icon: Users },
        { name: 'Assignments', path: '/hod/assignments', icon: Briefcase },
        { name: 'Students', path: '/hod/students', icon: GraduationCap },
        { name: 'Attendance', path: '/hod/attendance', icon: CalendarCheck },
        { name: 'Reports', path: '/hod/reports', icon: FileText }
      );
    } else if (user.role === ROLES.TEACHER) {
      links.push(
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Students', path: '/teacher/students', icon: GraduationCap },
        { name: 'Attendance Summary', path: '/teacher/summary', icon: CalendarCheck }
      );
    } else if (user.role === ROLES.STUDENT) {
      links.push(
        { name: 'Dashboard',          path: '/student/dashboard',         icon: LayoutDashboard },
        { name: 'Scan Attendance',     path: '/student/scan',              icon: QrCode },
        { name: 'My Attendance',       path: '/student/attendance',        icon: CalendarCheck },
        { name: 'Subject Attendance',  path: '/student/subjects',          icon: BookOpen },
        { name: 'History',             path: '/student/history',           icon: FileText },
        { name: 'Profile',             path: '/student/profile',           icon: User }
      );
    } else {
      const homePath = ROLE_DASHBOARDS[user.role] || '/';
      links.push({ name: 'Dashboard Overview', path: homePath, icon: LayoutDashboard });
    }

    return links;
  };

  const navLinks = getNavLinks();
  const roleTitle = user?.role ? ROLE_LABELS[user.role] || user.role : 'User';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                  QR Attendance
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  Portal
                </span>
              </div>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* User role & identity snippet */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
              </span>
              <div className="mt-0.5">
                <Badge role={user?.role} size="sm" withDot>
                  {roleTitle}
                </Badge>
              </div>
            </div>

            {/* Change Password Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setIsPasswordModalOpen(true);
              }}
              leftIcon={<KeyRound className="w-4 h-4 text-slate-500" />}
              className="hidden md:inline-flex text-slate-600"
            >
              Password
            </Button>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutDialogOpen(true)}
              leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
              className="border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm sticky top-24">
            {/* User Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.firstName ? user.firstName[0].toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                Navigation
              </p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </NavLink>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-1">
              <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                Account Settings
              </p>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-in Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white p-5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-slate-900">QR Attendance</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl mb-4">
                  <p className="text-xs font-semibold text-slate-900">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <div className="mt-2">
                    <Badge role={user?.role} size="sm">
                      {roleTitle}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs text-rose-600 border-rose-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLogoutDialogOpen(true);
                  }}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out of Session"
        message="Are you sure you want to end your current attendance portal session?"
        confirmText="Yes, Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        isLoading={isLoggingOut}
      />

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        description="Update your credentials. All other active sessions will be invalidated for security."
        size="sm"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
              {passwordSuccess}
            </div>
          )}

          <Input
            label="Current Password"
            isPassword
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Input
            label="New Password"
            isPassword
            required
            helperText="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Input
            label="Confirm New Password"
            isPassword
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isChangingPassword}
            >
              Save New Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
