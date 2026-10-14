import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  BookOpen,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader, Skeleton } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/student.service';
import { getErrorMessage } from '../../utils/error';

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '–'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

const AttendanceRing = ({ percentage }) => {
  const pct = Math.min(100, Math.max(0, percentage ?? 0));
  const color =
    pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="60" y="65" textAnchor="middle" className="text-xl font-bold" style={{ fontSize: 22, fontWeight: 700, fill: color }}>
          {pct.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs text-slate-500 mt-1">Overall Attendance</p>
    </div>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      studentService.getAttendanceSummary(),
      studentService.getSubjectWiseAttendance(),
    ])
      .then(([s, subj]) => {
        if (!cancelled) {
          setSummary(s);
          setSubjects(Array.isArray(subj) ? subj : []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader message="Loading your dashboard…" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.firstName || 'Student'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's your attendance overview at a glance.
          </p>
        </div>
        <Link to="/student/scan">
          <Button leftIcon={<QrCode className="w-4 h-4" />} size="md">
            Scan QR Code
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Classes"
          value={summary?.totalClasses ?? summary?.totalSessions ?? 0}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          label="Attended"
          value={summary?.attended ?? summary?.presentCount ?? summary?.effectiveAttended ?? 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Absent"
          value={
            (summary?.absentCount && summary.absentCount > 0)
              ? summary.absentCount
              : (summary?.absent && summary.absent > 0)
              ? summary.absent
              : Math.max(0, (summary?.totalClasses ?? summary?.totalSessions ?? 0) - (summary?.attended ?? summary?.presentCount ?? 0))
          }
          icon={XCircle}
          color="rose"
        />
        <StatCard
          label="Overall %"
          value={`${Number(summary?.overallPercentage ?? summary?.attendancePercentage ?? 0).toFixed(1)}%`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Ring + subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ring */}
        <Card className="flex items-center justify-center py-4">
          <AttendanceRing percentage={summary?.overallPercentage ?? summary?.attendancePercentage} />
        </Card>

        {/* Subject summary */}
        <Card className="lg:col-span-2" title="Subject-wise Summary" action={
          <Link to="/student/subjects">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              View all
            </Button>
          </Link>
        }>
          <CardContent className="px-0 py-0">
            {subjects.length === 0 ? (
              <div className="px-6 py-8">
                <EmptyState icon={BookOpen} title="No subjects yet" description="Attendance data will appear once sessions are conducted." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {subjects.slice(0, 5).map((subj) => {
                  const total = subj.totalClasses ?? subj.totalSessions ?? 0;
                  const attended = subj.attended ?? subj.presentCount ?? subj.effectiveAttended ?? 0;
                  const pct = subj.attendancePercentage ?? (total > 0 ? (attended / total) * 100 : 0);
                  const color = pct >= 75 ? 'emerald' : pct >= 60 ? 'amber' : 'rose';
                  return (
                    <li key={subj.subjectId || subj.id} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{subj.subjectName}</p>
                        <p className="text-xs text-slate-500">{attended}/{total} classes</p>
                      </div>
                      <Badge variant={color}>{Number(pct).toFixed(1)}%</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { to: '/student/scan',       icon: QrCode,      label: 'Scan Attendance', color: 'indigo' },
          { to: '/student/attendance', icon: TrendingUp,  label: 'My Attendance',   color: 'emerald' },
          { to: '/student/history',    icon: Clock,       label: 'View History',    color: 'amber' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
