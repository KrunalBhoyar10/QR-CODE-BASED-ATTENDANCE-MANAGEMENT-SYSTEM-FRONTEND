import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, Badge } from '../../components/ui';
import { ShieldCheck, QrCode, Calendar, CheckCircle } from 'lucide-react';
import { ROLE_LABELS } from '../../utils/constants';

export const TeacherDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Teacher Faculty Console
            </h1>
            <Badge role={user?.role} size="md">
              {ROLE_LABELS[user?.role] || 'Teacher'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Welcome, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}.
            Session initiation, dynamic QR code generation, and manual attendance correction.
          </p>
        </div>
      </div>

      {/* Foundation Status Card */}
      <Card
        title="Faculty Attendance Hub Foundation"
        subtitle="Frontend foundation connected to real backend auth & permissions"
      >
        <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-100 flex items-start gap-3">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-sky-900">
            <p className="font-semibold text-sm">Role-Protected Access Verified</p>
            <p className="mt-1 text-sky-700/90 leading-relaxed">
              You are signed in as an authenticated <span className="font-semibold">TEACHER / FACULTY MEMBER</span>.
              Ready for timetable sessions and rotating dynamic QR code display.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>QR Engine</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">Dynamic Rotation Ready</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Faculty ID</span>
            </div>
            <p className="text-xs font-mono text-slate-700 truncate">
              {user?.teacherId || user?.id}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Session Status</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600">Active & Verified</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
