import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { QrCode, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DASHBOARDS } from '../utils/constants';

export const AuthLayout = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // If already authenticated, redirect straight to user's role dashboard
  if (!isLoading && isAuthenticated && user?.role) {
    const targetDashboard = ROLE_DASHBOARDS[user.role] || '/';
    return <Navigate to={targetDashboard} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative gradient glow circles in the background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-4 transform hover:rotate-6 transition-transform">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Smart Attendance Portal
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            QR Code Based Geofenced & Face-Verified Attendance System
          </p>
        </div>

        {/* Auth card content */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
            <Outlet />
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control • TLS Secured</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
