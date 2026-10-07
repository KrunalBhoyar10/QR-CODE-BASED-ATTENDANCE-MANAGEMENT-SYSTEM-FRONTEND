import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyAssignments from './pages/MyAssignments';
import Programs from './pages/Programs';
import ActiveSessions from './pages/ActiveSessions';
import PreviousSessions from './pages/PreviousSessions';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assignments" element={<MyAssignments />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/active-sessions" element={<ActiveSessions />} />
        <Route path="/previous-sessions" element={<PreviousSessions />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;