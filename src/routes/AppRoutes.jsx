import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_DASHBOARDS } from '../utils/constants';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth pages
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ForceChangePassword from '../pages/auth/ForceChangePassword';
import StudentRegister from '../pages/auth/StudentRegister';

// Principal pages
import PrincipalDashboard from '../pages/principal/Dashboard';
import PrincipalDepartments from '../pages/principal/Departments';
import HodManagement from '../pages/principal/HodManagement';
import PrincipalAttendance from '../pages/principal/Attendance';
import PrincipalReports from '../pages/principal/Reports';

// HOD pages
import HodDepartments from '../pages/hod/Departments';
import HodPrograms from '../pages/hod/Programs';
import HodAcademicYears from '../pages/hod/AcademicYears';
import HodSections from '../pages/hod/Sections';
import HodSubjects from '../pages/hod/Subjects';
import HodTeachers from '../pages/hod/Teachers';
import TeacherAssignments from '../pages/hod/TeacherAssignments';
import HodStudents from '../pages/hod/Students';
import HodAttendance from '../pages/hod/Attendance';
import HodReports from '../pages/hod/Reports';

// Teacher pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherStudents from '../pages/teacher/Students';
import TeacherSummary from '../pages/teacher/AttendanceSummary';
import FaceAuthorization from '../pages/teacher/FaceAuthorization';
import TeacherReports from '../pages/teacher/TeacherReports';

// Student pages
import ScanAttendance from '../pages/student/ScanAttendance';
import MyAttendance from '../pages/student/MyAttendance';
import SubjectAttendance from '../pages/student/SubjectAttendance';
import AttendanceHistory from '../pages/student/AttendanceHistory';
import StudentProfile from '../pages/student/StudentProfile';

// Misc
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import { Loader } from '../components/ui/Loader';

// ─── Helper: standalone /register/student route wrapper ─────────────────────
// Defined as a named function declaration so it is always available at the
// top of the module scope (avoids any TDZ issues with const ordering).
function StudentRegisterStandalone() {
  const navigate = useNavigate();
  return (
    <StudentRegister
      onBackToLogin={() => navigate('/login', { replace: true })}
    />
  );
}

// HOD dashboard removed from nav — legacy URL redirects to Department
function HodDashboard() {
  return <Navigate to="/hod/department" replace />;
}

// ─── Helper: root path redirector ────────────────────────────────────────────
function RootRedirector() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullPage message="Initializing application..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const destination = ROLE_DASHBOARDS[user.role] || '/login';
  return <Navigate to={destination} replace />;
}

// ─── Main route tree ──────────────────────────────────────────────────────────
export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirector />} />

      {/* ── Public Auth Routes (inside AuthLayout card) ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Direct URL to student registration wizard */}
        <Route path="/register/student" element={<StudentRegisterStandalone />} />
      </Route>

      {/* Force password change — protected but no sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ForceChangePassword />} />
      </Route>

      {/* ── Protected, role-gated routes (inside DashboardLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Principal */}
          <Route path="/principal">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <PrincipalDashboard />
              </RoleRoute>
            } />
            <Route path="departments" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <PrincipalDepartments />
              </RoleRoute>
            } />
            <Route path="hods" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <HodManagement />
              </RoleRoute>
            } />
            <Route path="attendance" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <PrincipalAttendance />
              </RoleRoute>
            } />
            <Route path="reports" element={
              <RoleRoute allowedRoles={[ROLES.PRINCIPAL]}>
                <PrincipalReports />
              </RoleRoute>
            } />
          </Route>

          {/* HOD */}
          <Route path="/hod">
            <Route index element={<Navigate to="/hod/department" replace />} />
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodDashboard />
              </RoleRoute>
            } />
            <Route path="departments" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodDepartments />
              </RoleRoute>
            } />
            <Route path="department" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodDepartments />
              </RoleRoute>
            } />
            <Route path="programs" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodPrograms />
              </RoleRoute>
            } />
            <Route path="academic-years" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodAcademicYears />
              </RoleRoute>
            } />
            <Route path="sections" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodSections />
              </RoleRoute>
            } />
            <Route path="subjects" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodSubjects />
              </RoleRoute>
            } />
            <Route path="teachers" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodTeachers />
              </RoleRoute>
            } />
            <Route path="assignments" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <TeacherAssignments />
              </RoleRoute>
            } />
            <Route path="students" element={
              <RoleRoute allowedRoles={[ROLES.HOD]}>
                <HodStudents />
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

          {/* Teacher */}
          <Route path="/teacher">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherDashboard />
              </RoleRoute>
            } />
            <Route path="students" element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherStudents />
              </RoleRoute>
            } />
            <Route path="summary" element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherSummary />
              </RoleRoute>
            } />
            <Route path="face-authorization" element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <FaceAuthorization />
              </RoleRoute>
            } />
            <Route path="reports" element={
              <RoleRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherReports />
              </RoleRoute>
            } />
          </Route>

          {/* Student */}
          <Route path="/student">
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <Navigate to="/student/scan" replace />
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

      {/* Misc */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
