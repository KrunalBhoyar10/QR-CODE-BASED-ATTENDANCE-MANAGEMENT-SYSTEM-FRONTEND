import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_DASHBOARDS } from '../utils/constants';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Pages
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Dashboard from '../pages/principal/Dashboard';
import Departments from '../pages/principal/Departments';
import HodManagement from '../pages/principal/HodManagement';
import Attendance from '../pages/principal/Attendance';
import Reports from '../pages/principal/Reports';
import HodDashboard from '../pages/hod/Dashboard';
import Programs from '../pages/hod/Programs';
import AcademicYears from '../pages/hod/AcademicYears';
import Sections from '../pages/hod/Sections';
import Subjects from '../pages/hod/Subjects';
import Teachers from '../pages/hod/Teachers';
import TeacherAssignments from '../pages/hod/TeacherAssignments';
import Students from '../pages/hod/Students';
import HodAttendance from '../pages/hod/Attendance';
import HodReports from '../pages/hod/Reports';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import StudentDashboard from '../pages/student/StudentDashboard';
import ScanAttendance from '../pages/student/ScanAttendance';
import MyAttendance from '../pages/student/MyAttendance';
import SubjectAttendance from '../pages/student/SubjectAttendance';
import AttendanceHistory from '../pages/student/AttendanceHistory';
import StudentProfile from '../pages/student/StudentProfile';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import { Loader } from '../components/ui/Loader';

/**
 * Root index redirector based on authentication and user role
 */
const RootRedirector = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullPage message="Initializing application..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const destination = ROLE_DASHBOARDS[user.role] || '/login';
  return <Navigate to={destination} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirector />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Role-Based Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Principal Route */}
          <Route path="/principal">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <Dashboard />
              </RoleRoute>
            } />
            <Route path="departments" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <Departments />
              </RoleRoute>
            } />
            <Route path="hods" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <HodManagement />
              </RoleRoute>
            } />
            <Route path="attendance" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <Attendance />
              </RoleRoute>
            } />
            <Route path="reports" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <Reports />
              </RoleRoute>
            } />
          </Route>

          {/* HOD Route */}
          <Route path="/hod">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodDashboard />
              </RoleRoute>
            } />
            <Route path="programs" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <Programs />
              </RoleRoute>
            } />
            <Route path="academic-years" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <AcademicYears />
              </RoleRoute>
            } />
            <Route path="sections" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <Sections />
              </RoleRoute>
            } />
            <Route path="subjects" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <Subjects />
              </RoleRoute>
            } />
            <Route path="teachers" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <Teachers />
              </RoleRoute>
            } />
            <Route path="assignments" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <TeacherAssignments />
              </RoleRoute>
            } />
            <Route path="students" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <Students />
              </RoleRoute>
            } />
            <Route path="attendance" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodAttendance />
              </RoleRoute>
            } />
            <Route path="reports" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodReports />
              </RoleRoute>
            } />
          </Route>

          {/* Teacher Route */}
          <Route
            path="/teacher/dashboard"
            element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherDashboard />
              </RoleRoute>
            }
          />

          {/* Student Routes */}
          <Route path="/student">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentDashboard />
              </RoleRoute>
            } />
            <Route path="scan" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <ScanAttendance />
              </RoleRoute>
            } />
            <Route path="attendance" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <MyAttendance />
              </RoleRoute>
            } />
            <Route path="subjects" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <SubjectAttendance />
              </RoleRoute>
            } />
            <Route path="history" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <AttendanceHistory />
              </RoleRoute>
            } />
            <Route path="profile" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentProfile />
              </RoleRoute>
            } />
          </Route>
        </Route>
      </Route>

      {/* Access Denied Page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
