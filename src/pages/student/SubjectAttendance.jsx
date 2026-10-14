import React, { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import studentService from '../../services/student.service';
import { getErrorMessage } from '../../utils/error';

const ProgressBar = ({ value }) => {
  const color =
    value >= 75 ? 'bg-emerald-500' :
    value >= 60 ? 'bg-amber-500'   : 'bg-rose-500';
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};

export default function SubjectAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    studentService.getSubjectWiseAttendance()
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading subject attendance…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subject Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attendance breakdown for each subject you are enrolled in.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && subjects.length === 0 && (
        <EmptyState icon={BookOpen} title="No subjects found" description="No subject-wise attendance data is available yet." />
      )}

      {!error && subjects.length > 0 && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
              <p className="text-xs text-slate-500 mt-1">Subjects</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {subjects.filter((s) => (s.attendancePercentage ?? 0) >= 75).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">≥ 75%</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4 text-center">
              <p className="text-2xl font-bold text-rose-600">
                {subjects.filter((s) => (s.attendancePercentage ?? 0) < 75).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Below 75%</p>
            </div>
          </div>

          {/* Subject cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((subj) => {
              const total    = Number(subj.totalClasses ?? subj.totalSessions ?? 0);
              const attended = Number(subj.attended ?? subj.presentCount ?? subj.effectiveAttended ?? 0);
              const pct      = Number(subj.attendancePercentage ?? (total > 0 ? (attended / total) * 100 : 0));
              const noClass  = total === 0;
              const good     = !noClass && pct >= 75;
              const warn     = !noClass && pct >= 60 && pct < 75;
              const bad      = !noClass && pct < 60;
              const variant  = noClass ? 'slate' : good ? 'emerald' : warn ? 'amber' : 'rose';

              // How many more classes needed to reach 75%
              let toReach75  = null;
              if (pct < 75 && total > 0) {
                // Need (75% * (total + x)) ≤ attended + x  →  solve for x
                // attended + x >= 0.75 * (total + x)  →  x >= (0.75*total - attended)/0.25
                const needed = Math.ceil((0.75 * total - attended) / 0.25);
                if (needed > 0) toReach75 = needed;
              }

              return (
                <Card key={subj.subjectId || subj.id} className="hover:border-indigo-200 transition-colors">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                          {subj.subjectName}
                        </h3>
                        {subj.subjectCode && (
                          <p className="text-xs text-slate-400 mt-0.5">{subj.subjectCode}</p>
                        )}
                        {subj.programName && (
                          <p className="text-xs text-slate-400">{subj.programName}</p>
                        )}
                      </div>
                      <Badge variant={variant} className="shrink-0">{pct.toFixed(1)}%</Badge>
                    </div>

                    <ProgressBar value={pct} />

                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{attended} attended</span>
                      <span>{total} total classes</span>
                    </div>

                    {/* Alert / info line */}
                    {noClass && (
                      <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span>No attendance sessions conducted for this subject yet.</span>
                      </div>
                    )}
                    {bad && (
                      <div className="mt-3 flex items-start gap-1.5 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Critical – attendance below 60%{toReach75 ? `. Need ${toReach75} consecutive classes to reach 75%` : ''}.</span>
                      </div>
                    )}
                    {warn && (
                      <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Below 75%{toReach75 ? `. Attend ${toReach75} more classes to meet the requirement` : ''}.</span>
                      </div>
                    )}
                    {good && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Meeting the 75% requirement.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
