import React, { useState, useEffect } from 'react';
import {
  Building2, BookOpen, ChevronRight, Users, BarChart2,
  GraduationCap, Layers, AlertCircle, Home,
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { principalService } from '../../services/principal.service';
import { getErrorMessage } from '../../utils/error';

/* ── Attendance color helper ───────────────────────────────────────── */
const attColor = (p) =>
  p >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : p >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
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
   LEVEL 3 — Year Detail
══════════════════════════════════════════════════════════════════════ */
const YearDetail = ({ year, program, dept, onBack, onBackToProgram }) => {
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
          principalService.getSectionsByAcademicYear(year.id),
          principalService.getAcademicYearWiseAttendance({ programId: program.id })
            .catch(() => ({ data: [] })),
        ]);
        setSections(Array.isArray(secRes?.data) ? secRes.data : []);
        const yearAtt = (Array.isArray(attRes?.data) ? attRes.data : [])
          .find(a => a.academicYearId === year.id);
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
      <Breadcrumb items={[
        { label: 'Departments', onClick: onBack },
        { label: dept.name, onClick: onBackToProgram },
        { label: program.name, onClick: onBackToProgram },
        { label: `Year ${year.year}` },
      ]} />

      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Layers className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {program.name} — Year {year.year}
          </h2>
          <p className="text-sm text-slate-500">
            {year.semesterCount ?? 2} Semesters · {dept.name}
          </p>
        </div>
        <div className={`ml-auto px-3 py-1.5 rounded-xl border text-sm font-bold ${attColor(pct)}`}>
          {pct.toFixed(1)}% Attendance
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader message="Loading year data..." /></div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatBox icon={Users} label="Students Enrolled" value={totalStudents} color="indigo" />
            <StatBox icon={BarChart2} label="Attendance" value={`${pct.toFixed(1)}%`} color={pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'} />
            <StatBox icon={BookOpen} label="Sessions Held" value={totalSessions} color="violet" />
            <StatBox icon={Layers} label="Sections" value={sections.length} color="blue" />
          </div>

          {/* Present / Absent breakdown */}
          {totalSessions > 0 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Attendance Breakdown</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-600 font-semibold w-10">{pct.toFixed(0)}%</span>
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
            Sections ({sections.length})
          </h3>
          {sections.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sections added yet.</p>
              <p className="text-xs mt-1">HOD will add sections from their dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map(sec => (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-lg">Section {sec.name}</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  {sec.teacher && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {sec.teacher.user?.firstName} {sec.teacher.user?.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 2 — Program Detail (shows academic years)
══════════════════════════════════════════════════════════════════════ */
const ProgramDetail = ({ program, dept, deptAttendance, onBack, onSelectYear }) => {
  const [years, setYears] = useState([]);
  const [yearAttendance, setYearAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const progAtt = deptAttendance.find(a => a.programId === program.id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [yrsRes, attRes] = await Promise.all([
          principalService.getAcademicYearsByProgram(program.id),
          principalService.getAcademicYearWiseAttendance({ programId: program.id })
            .catch(() => ({ data: [] })),
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
      <Breadcrumb items={[
        { label: 'Departments', onClick: onBack },
        { label: dept.name, onClick: onBack },
        { label: program.name },
      ]} />

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
            <Badge variant={program.isActive ? 'success' : 'error'}>
              {program.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {program.durationYears}-year program · {dept.name}
          </p>
        </div>
        {progAtt && (
          <div className={`ml-auto px-3 py-1.5 rounded-xl border text-sm font-bold ${attColor(progAtt.attendancePercentage)}`}>
            {Number(progAtt.attendancePercentage).toFixed(1)}% Attendance
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox icon={Layers} label="Total Years" value={program.durationYears} color="indigo" />
        <StatBox icon={Users} label="Students" value={program._count?.students ?? 0} color="violet" />
        <StatBox icon={BookOpen} label="Subjects" value={program._count?.subjects ?? 0} color="amber" />
        <StatBox icon={BarChart2} label="Sessions" value={progAtt?.totalSessions ?? 0} color="emerald" />
      </div>

      {/* Academic Years */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Academic Years — click to view details
      </h3>

      {loading ? (
        <div className="flex justify-center py-12"><Loader message="Loading years..." /></div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No academic years added yet.</p>
          <p className="text-xs mt-1">HOD will add years from their dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {years.map(year => {
            const att = yearAttendance.find(a => a.academicYearId === year.id);
            const pct = att?.attendancePercentage ?? 0;
            const students = year._count?.students ?? 0;
            const sections = year._count?.sections ?? 0;
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

                <p className="font-bold text-slate-800">Year {year.year}</p>
                <p className="text-xs text-slate-500 mt-0.5">{year.semesterCount ?? 2} Semesters</p>

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
   LEVEL 1 — Department Detail (shows programs)
══════════════════════════════════════════════════════════════════════ */
const DepartmentDetail = ({ dept, onBack, onSelectProgram }) => {
  const [programs, setPrograms] = useState([]);
  const [deptAttendance, setDeptAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [progsRes, attRes] = await Promise.all([
          principalService.getProgramsByDepartment(dept.id),
          principalService.getProgramWiseAttendance({ departmentId: dept.id })
            .catch(() => ({ data: [] })),
        ]);
        setPrograms(Array.isArray(progsRes?.data) ? progsRes.data : []);
        setDeptAttendance(Array.isArray(attRes?.data) ? attRes.data : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dept.id]);

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Departments', onClick: onBack },
        { label: dept.name },
      ]} />

      {/* Dept header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{dept.name}</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
              {dept.code}
            </span>
          </div>
          {dept.hod && (
            <p className="text-sm text-slate-500 mt-0.5">
              HOD: {dept.hod.firstName} {dept.hod.lastName} · {dept.hod.email}
            </p>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Programs — click to explore
      </h3>

      {loading ? (
        <div className="flex justify-center py-12"><Loader message="Loading programs..." /></div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No programs yet</p>
          <p className="text-xs mt-1">HOD will add programs from their dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(prog => {
            const att = deptAttendance.find(a => a.programId === prog.id);
            const pct = att?.attendancePercentage ?? 0;
            return (
              <button
                key={prog.id}
                onClick={() => onSelectProgram(prog, deptAttendance)}
                className="text-left p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all bg-white group"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge variant={prog.isActive ? 'success' : 'error'}>
                    {prog.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="font-bold text-slate-800 text-base">{prog.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{prog.code}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> {prog.durationYears} Years
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {prog._count?.students ?? 0} Students
                    </span>
                  </div>

                  {att ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Attendance</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${attColor(pct)}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-indigo-500 font-medium group-hover:gap-2 transition-all">
                  View years & details <ChevronRight className="w-3 h-3" />
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
   LEVEL 0 — Departments List
══════════════════════════════════════════════════════════════════════ */
const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // navigation stack: null | 'dept' | 'program' | 'year'
  const [view, setView] = useState('list');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [deptAttendance, setDeptAttendance] = useState([]);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await principalService.getDepartments();
      setDepartments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const goToDept = (dept) => {
    setSelectedDept(dept);
    setSelectedProgram(null);
    setSelectedYear(null);
    setView('dept');
  };

  const goToProgram = (prog, att) => {
    setSelectedProgram(prog);
    setDeptAttendance(att);
    setSelectedYear(null);
    setView('program');
  };

  const goToYear = (year) => {
    setSelectedYear(year);
    setView('year');
  };

  const goToList = () => {
    setView('list');
    setSelectedDept(null);
    setSelectedProgram(null);
    setSelectedYear(null);
  };

  const goBackToProgram = () => {
    setSelectedYear(null);
    setView('program');
  };

  const goBackToDept = () => {
    setSelectedProgram(null);
    setView('dept');
  };

  if (loading) return <Loader fullPage message="Loading departments..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchDepartments} /></div>;

  return (
    <div className="p-6">
      {/* Page title — only on list view */}
      {view === 'list' && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-slate-500 mt-1">Click on a department to explore programs and attendance</p>
        </div>
      )}

      {/* ── LEVEL 0: Departments list ──────────────────────────────── */}
      {view === 'list' && (
        <>
          {departments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No departments yet.</p>
              <p className="text-sm mt-1">Add a department from HOD Management.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => goToDept(dept)}
                  className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wide">
                      {dept.code}
                    </span>
                  </div>

                  <p className="font-bold text-slate-800 text-base leading-snug">{dept.name}</p>

                  {dept.hod ? (
                    <p className="text-xs text-slate-500 mt-1.5">
                      HOD: {dept.hod.firstName} {dept.hod.lastName}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 mt-1.5">No HOD assigned</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      {dept._count?.programs ?? 0} program{dept._count?.programs !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium group-hover:gap-2 transition-all">
                      Explore <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── LEVEL 1: Department detail (programs) ─────────────────── */}
      {view === 'dept' && selectedDept && (
        <DepartmentDetail
          dept={selectedDept}
          onBack={goToList}
          onSelectProgram={goToProgram}
        />
      )}

      {/* ── LEVEL 2: Program detail (years) ───────────────────────── */}
      {view === 'program' && selectedProgram && selectedDept && (
        <ProgramDetail
          program={selectedProgram}
          dept={selectedDept}
          deptAttendance={deptAttendance}
          onBack={goBackToDept}
          onSelectYear={goToYear}
        />
      )}

      {/* ── LEVEL 3: Year detail ──────────────────────────────────── */}
      {view === 'year' && selectedYear && selectedProgram && selectedDept && (
        <YearDetail
          year={selectedYear}
          program={selectedProgram}
          dept={selectedDept}
          onBack={goToList}
          onBackToProgram={goBackToDept}
        />
      )}
    </div>
  );
};

export default Departments;
