import React, { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Loader, Skeleton } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import studentService from '../../services/student.service';
import { getErrorMessage } from '../../utils/error';

const ProgressBar = ({ value, color = 'indigo' }) => {
  const colorMap = {
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
    rose:    'bg-rose-500',
    indigo:  'bg-indigo-500',
  };
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${colorMap[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

export default function MyAttendance() {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    studentService.getAttendanceSummary()
      .then(setSummary)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading attendance data…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Your overall attendance statistics across all subjects.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && summary && (
        <>
          {/* Summary cards */}
          {(() => {
            const total = summary.totalClasses ?? summary.totalSessions ?? 0;
            const attended = summary.attended ?? summary.presentCount ?? summary.effectiveAttended ?? 0;
            const absent = (summary.absentCount && summary.absentCount > 0)
              ? summary.absentCount
              : (summary.absent && summary.absent > 0)
              ? summary.absent
              : Math.max(0, total - attended);
            const overallPct = Number(summary.overallPercentage ?? summary.attendancePercentage ?? 0);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Classes',      value: total, icon: BookOpen,     color: 'indigo' },
                  { label: 'Attended',           value: attended, icon: CheckCircle2, color: 'emerald' },
                  { label: 'Absent',             value: absent, icon: XCircle,      color: 'rose' },
                  { label: 'Overall Percentage', value: `${overallPct.toFixed(1)}%`, icon: TrendingUp, color: 'amber' },
                ].map(({ label, value, icon: Icon, color }) => {
                  const bgMap = {
                    indigo: 'bg-indigo-50 text-indigo-600',
                    emerald: 'bg-emerald-50 text-emerald-600',
                    rose: 'bg-rose-50 text-rose-600',
                    amber: 'bg-amber-50 text-amber-600',
                  };
                  return (
                    <div key={label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                      <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${bgMap[color]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Overall progress */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">Overall Progress</p>
                <Badge
                  variant={
                    (summary.overallPercentage ?? 0) >= 75 ? 'emerald' :
                    (summary.overallPercentage ?? 0) >= 60 ? 'amber' : 'rose'
                  }
                >
                  {(summary.overallPercentage ?? 0).toFixed(1)}%
                </Badge>
              </div>
              <ProgressBar
                value={summary.overallPercentage ?? 0}
                color={
                  (summary.overallPercentage ?? 0) >= 75 ? 'emerald' :
                  (summary.overallPercentage ?? 0) >= 60 ? 'amber' : 'rose'
                }
              />
              <p className="text-xs text-slate-400 mt-2">
                {(summary.overallPercentage ?? 0) < 75
                  ? `⚠️ Below 75% threshold — you attended ${summary.attended ?? 0} of ${summary.totalClasses ?? 0} classes`
                  : `✓ You're meeting the 75% attendance requirement`}
              </p>
            </CardContent>
          </Card>

          {/* Subject breakdown embedded in this page */}
          {Array.isArray(summary.subjectBreakdown) && summary.subjectBreakdown.length > 0 && (
            <Card title="Subject Breakdown">
              <CardContent className="px-0 py-0">
                <ul className="divide-y divide-slate-100">
                  {summary.subjectBreakdown.map((s) => {
                    const pct = s.attendancePercentage ?? 0;
                    const color = pct >= 75 ? 'emerald' : pct >= 60 ? 'amber' : 'rose';
                    return (
                      <li key={s.subjectId || s.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">{s.subjectName}</p>
                          <Badge variant={color}>{pct.toFixed(1)}%</Badge>
                        </div>
                        <ProgressBar value={pct} color={color} />
                        <p className="text-xs text-slate-400 mt-1">
                          {s.attended ?? 0} attended / {s.totalClasses ?? 0} total
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!error && !summary && !loading && (
        <EmptyState icon={BookOpen} title="No attendance data" description="No attendance records found yet." />
      )}
    </div>
  );
}
