import React, { useState, useEffect } from 'react';
import {
  Building2, BookOpen, ChevronRight, Users, BarChart2,
  GraduationCap, Layers, AlertCircle, Grid, UserCheck, ShieldCheck,
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { hodService } from '../../services/hod.service';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/error';

/* ── Attendance color helper ───────────────────────────────────────── */
const attColor = (p) =>
  p >= 75
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : p >= 50
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-rose-600 bg-rose-50 border-rose-200';

/* ── Stat box ──────────────────────────────────────────────────────── */
const StatBox = ({ icon: Icon, label, value, sub, color = 'indigo' }) => (
  <div className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
    <div className={`flex items-center gap-1.5 text-${color}-500 mb-2`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className={`text-2xl font-bold text-${color}-700`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

/* ── Breadcrumb ────────────────────────────────────────────────────── */
const Breadcrumb = ({ items }) => (
  <nav className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
        {item.onClick ? (
          <button
            onClick={item.onClick}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:underline"
          >
            {item.label}
          </button>
        ) : (
          <span className="text-slate-500 font-medium">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 2 — Year Detail
══════════════════════════════════════════════════════════════════════ */
const YearDetail = ({ year, program, dept, onBackToDepartment, onBackToProgram }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [secRes, attRes] = await Promise.all([
          hodService.listSections(year.id),
          hodService.getAcademicYearAttendance({ programId: program.id }).catch(() => ({ data: [] })),
        ]);
        setSections(Array.isArray(secRes?.data) ? secRes.data : []);
        const yearAtt = (Array.isArray(attRes?.data) ? attRes.data : []).find(
          (a) => a.academicYearId === year.id
        );
        setAttendance(yearAtt || null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year.id, program.id]);

  const pct = attendance?.attendancePercentage ?? 0;
  const totalStudents = year._count?.students ?? 0;
  const totalSessions = attendance?.totalSessions ?? 0;
  const presentCount = attendance?.presentCount ?? 0;
  const absentCount = attendance?.absentCount ?? 0;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: dept.name, onClick: onBackToDepartment },
          { label: program.name, onClick: onBackToProgram },
          { label: `Year ${year.yearNumber ?? year.year}` },
        ]}
      />

      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Layers className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {program.name} — Year {year.yearNumber ?? year.year}
          </h2>
          <p className="text-sm text-slate-500">
            {year.semesterCount ?? 2} Semesters · {dept.name}
          </p>
        </div>
        {attendance && (
          <div
            className={`ml-auto px-3 py-1.5 rounded-xl border text-sm font-bold ${attColor(pct)}`}
          >
            {pct.toFixed(1)}% Attendance
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader message="Loading year data..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatBox icon={Users} label="Students Enrolled" value={totalStudents} color="indigo" />
            <StatBox
              icon={BarChart2}
              label="Attendance"
              value={`${pct.toFixed(1)}%`}
              color={pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'}
            />
            <StatBox icon={BookOpen} label="Sessions Held" value={totalSessions} color="violet" />
            <StatBox icon={Layers} label="Sections" value={sections.length} color="blue" />
          </div>

          {/* Present / Absent breakdown */}
          {totalSessions > 0 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Attendance Breakdown
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-600 font-semibold w-10">
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Present: {presentCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  Absent: {absentCount}
                </span>
              </div>
            </div>
          )}

          {/* Sections */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Sections
          </h3>
          {sections.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Grid className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sections created for this academic year yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map((sec) => {
                const teacherObj = sec.classTeacher || sec.teacher;
                const teacherName = teacherObj?.user
                  ? `${teacherObj.user.firstName || ''} ${teacherObj.user.lastName || ''}`.trim()
                  : null;

                return (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800">Section {sec.name}</p>
                      <span className="text-xs text-slate-400">
                        {sec._count?.students ?? 0} students
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Class Teacher:</span>
                      {teacherName ? (
                        <span className="font-medium text-slate-700">{teacherName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 1 — Program Detail
══════════════════════════════════════════════════════════════════════ */
const ProgramDetail = ({ program, dept, deptAttendance, onBackToDepartment, onSelectYear }) => {
  const [years, setYears] = useState([]);
  const [yearAttendance, setYearAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const progAtt = (deptAttendance || []).find((a) => a.programId === program.id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [yrsRes, attRes] = await Promise.all([
          hodService.listAcademicYears(program.id),
          hodService.getAcademicYearAttendance({ programId: program.id }).catch(() => ({ data: [] })),
        ]);
        setYears(Array.isArray(yrsRes?.data) ? yrsRes.data : []);
        setYearAttendance(Array.isArray(attRes?.data) ? attRes.data : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [program.id]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: dept.name, onClick: onBackToDepartment },
          { label: program.name },
        ]}
      />

      {/* Program header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{program.name}</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
              {program.code}
            </span>
            <Badge variant={program.isActive !== false ? 'success' : 'error'}>
              {program.isActive !== false ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {program.durationYears}-year program · {dept.name}
          </p>
        </div>
        {progAtt && (
          <div
            className={`ml-auto px-3 py-1.5 rounded-xl border text-sm font-bold ${attColor(
              progAtt.attendancePercentage
            )}`}
          >
            {Number(progAtt.attendancePercentage).toFixed(1)}% Attendance
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox icon={Layers} label="Total Years" value={program.durationYears} color="indigo" />
        <StatBox
          icon={Users}
          label="Students"
          value={program._count?.students ?? 0}
          color="violet"
        />
        <StatBox
          icon={BookOpen}
          label="Subjects"
          value={program._count?.subjects ?? 0}
          color="amber"
        />
        <StatBox
          icon={BarChart2}
          label="Sessions"
          value={progAtt?.totalSessions ?? 0}
          color="emerald"
        />
      </div>

      {/* Academic Years */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Academic Years — click to view details
      </h3>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader message="Loading years..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No academic years added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {years.map((year) => {
            const att = yearAttendance.find((a) => a.academicYearId === year.id);
            const pct = att?.attendancePercentage ?? 0;
            const students = year._count?.students ?? 0;
            const sections = year._count?.sections ?? year.sections?.length ?? 0;

            return (
              <button
                key={year.id}
                onClick={() => onSelectYear(year, yearAttendance)}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Layers className="w-5 h-5 text-violet-500" />
                  </div>
                  <span className={`px-2 py-1 rounded-lg border text-xs font-bold ${attColor(pct)}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>

                <p className="font-bold text-slate-800">
                  Year {year.yearNumber ?? year.year}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {year.semesterCount ?? 2} Semesters
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-400" /> {students} Students
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-violet-400" /> {sections} Sections
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500 font-medium group-hover:gap-2 transition-all">
                  View details <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN HOD DEPARTMENT PAGE
   Strictly shows ONLY the HOD's own department and its programs (e.g. BCA, MCA)
══════════════════════════════════════════════════════════════════════ */
const Departments = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [deptAttendance, setDeptAttendance] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // navigation stack: 'dept' | 'program' | 'year'
  const [view, setView] = useState('dept');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  const fetchDepartmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, progsRes, attRes, summaryRes] = await Promise.all([
        hodService.getMyDepartment().catch(() => null),
        hodService.listPrograms(),
        hodService.getProgramAttendance().catch(() => ({ data: [] })),
        hodService.getAttendanceSummary().catch(() => ({ data: null })),
      ]);

      const deptData = deptRes?.data || null;
      setDepartment(deptData);

      const progList = Array.isArray(progsRes?.data) ? progsRes.data : [];
      setPrograms(progList);

      setDeptAttendance(Array.isArray(attRes?.data) ? attRes.data : []);
      setSummaryStats(summaryRes?.data || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const goToProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedYear(null);
    setView('program');
  };

  const goToYear = (year) => {
    setSelectedYear(year);
    setView('year');
  };

  const goToDepartment = () => {
    setView('dept');
    setSelectedProgram(null);
    setSelectedYear(null);
  };

  const goBackToProgram = () => {
    setSelectedYear(null);
    setView('program');
  };

  if (loading) return <Loader fullPage message="Loading your department details..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchDepartmentData} /></div>;

  const deptName = department?.name || 'Department';
  const deptCode = department?.code || '';
  const hodName = department?.hod
    ? `${department.hod.firstName} ${department.hod.lastName}`
    : user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'HOD';
  const hodEmail = department?.hod?.email || user?.email || '';

  const totalStudents = summaryStats?.totalStudents ?? department?._count?.students ?? 0;
  const overallPercentage = summaryStats?.overallPercentage != null
    ? parseFloat(summaryStats.overallPercentage).toFixed(1)
    : '—';

  return (
    <div className="p-6 space-y-6">
      {/* ── LEVEL 0: Own Department View ─────────────────────────────── */}
      {view === 'dept' && (
        <>
          {/* Department Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                  Your Department
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-200" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {deptName}
                    </h1>
                    {deptCode && (
                      <span className="text-xs font-mono font-semibold bg-white/15 px-2 py-0.5 rounded text-indigo-100 uppercase">
                        Code: {deptCode}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  Head of Department: <span className="font-semibold text-white">{hodName}</span>
                  {hodEmail && <span className="text-indigo-300 ml-1">({hodEmail})</span>}
                </p>
              </div>

              {/* High-level department metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
                  <p className="text-xs text-indigo-200 font-medium">Programs</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{programs.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
                  <p className="text-xs text-indigo-200 font-medium">Students</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{totalStudents}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px] col-span-2 sm:col-span-1">
                  <p className="text-xs text-indigo-200 font-medium">Attendance</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {overallPercentage !== '—' ? `${overallPercentage}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Programs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Department Programs</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic programs managed under your department
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {programs.length} Program{programs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {programs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-slate-600">No programs found for your department.</p>
                <p className="text-xs text-slate-400 mt-1">Programs can be added from the Programs section.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((prog) => {
                  const att = deptAttendance.find((a) => a.programId === prog.id);
                  const pct = att?.attendancePercentage ?? 0;

                  return (
                    <button
                      key={prog.id}
                      onClick={() => goToProgram(prog)}
                      className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-lg transition-all group relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                              {prog.code}
                            </span>
                            <Badge variant={prog.isActive !== false ? 'success' : 'error'}>
                              {prog.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        <p className="font-bold text-slate-800 text-base leading-snug">{prog.name}</p>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              {prog.durationYears} Years Duration
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {prog._count?.students ?? 0} Students
                            </span>
                          </div>

                          {att && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-400">Avg Attendance</span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${attColor(pct)}`}
                              >
                                {Number(pct).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:gap-1.5 transition-all">
                        <span>Explore Years & Sections</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LEVEL 1: Program Detail (Academic Years) ───────────────── */}
      {view === 'program' && selectedProgram && (
        <ProgramDetail
          program={selectedProgram}
          dept={{ name: deptName }}
          deptAttendance={deptAttendance}
          onBackToDepartment={goToDepartment}
          onSelectYear={goToYear}
        />
      )}

      {/* ── LEVEL 2: Year Detail (Sections) ────────────────────────── */}
      {view === 'year' && selectedYear && selectedProgram && (
        <YearDetail
          year={selectedYear}
          program={selectedProgram}
          dept={{ name: deptName }}
          onBackToDepartment={goToDepartment}
          onBackToProgram={goBackToProgram}
        />
      )}
    </div>
  );
};

export default Departments;
