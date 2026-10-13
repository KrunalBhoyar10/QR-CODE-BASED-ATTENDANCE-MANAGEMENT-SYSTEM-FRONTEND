import React, { useState, useEffect } from 'react';
import {
  Building2, BookOpen, ChevronRight, Users,
  GraduationCap, Layers, AlertCircle, Grid, ShieldCheck,
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
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
const parseStudentList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.students)) return res.data.students;
  if (Array.isArray(res?.students)) return res.students;
  return [];
};

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 3 — Section Detail (students)
══════════════════════════════════════════════════════════════════════ */
const SectionDetail = ({
  section,
  year,
  program,
  dept,
  onBackToDepartment,
  onBackToProgram,
  onBackToYear,
}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const filterBySection = (rows) =>
          rows.filter((s) => (s.sectionId || s.section?.id) === section.id);

        const res = await hodService.listStudents({
          programId: program.id,
          academicYearId: year.id,
          sectionId: section.id,
        });
        let list = parseStudentList(res);
        if (list.some((s) => s.sectionId || s.section?.id)) {
          list = filterBySection(list);
        } else if (list.length === 0) {
          const broadRes = await hodService.listStudents({
            programId: program.id,
            academicYearId: year.id,
          });
          list = filterBySection(parseStudentList(broadRes));
        }
        setStudents(list);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [section.id, program.id, year.id]);

  const yearLabel = year.yearNumber ?? year.year;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: dept.name, onClick: onBackToDepartment },
          { label: program.name, onClick: onBackToProgram },
          { label: `Year ${yearLabel}`, onClick: onBackToYear },
          { label: `Section ${section.name}` },
        ]}
      />

      <h2 className="text-lg font-bold text-slate-900 mb-4">Section {section.name}</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader message="Loading students..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No students enrolled in this section.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {students.map((st) => {
            const first = st.user?.firstName ?? st.firstName ?? '';
            const last = st.user?.lastName ?? st.lastName ?? '';
            const email = st.user?.email ?? st.email ?? '';
            const name = `${first} ${last}`.trim() || '—';

            return (
              <li
                key={st.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <div>
                  <p className="font-medium text-slate-900">{name}</p>
                  {email && <p className="text-xs text-slate-500">{email}</p>}
                </div>
                {st.enrollmentNumber && (
                  <span className="text-sm font-mono text-slate-600 shrink-0">
                    {st.enrollmentNumber}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 2 — Year Detail
══════════════════════════════════════════════════════════════════════ */
const YearDetail = ({ year, program, dept, onBackToDepartment, onBackToProgram, onSelectSection }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const secRes = await hodService.listSections(year.id);
        setSections(Array.isArray(secRes?.data) ? secRes.data : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year.id]);

  const yearLabel = year.yearNumber ?? year.year;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: dept.name, onClick: onBackToDepartment },
          { label: program.name, onClick: onBackToProgram },
          { label: `Year ${yearLabel}` },
        ]}
      />

      <h2 className="text-lg font-bold text-slate-900 mb-4">Year {yearLabel}</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader message="Loading sections..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Grid className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No sections for this year yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec)}
              className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group text-left w-full"
            >
              <p className="font-bold text-slate-800">Section {sec.name}</p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>
                  <span className="font-semibold text-slate-900">{sec._count?.students ?? 0}</span>
                  {' '}Students
                </span>
                <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   LEVEL 1 — Program Detail
══════════════════════════════════════════════════════════════════════ */
const ProgramDetail = ({ program, dept, onBackToDepartment, onSelectYear }) => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const yrsRes = await hodService.listAcademicYears(program.id);
        setYears(Array.isArray(yrsRes?.data) ? yrsRes.data : []);
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

      <h2 className="text-lg font-bold text-slate-900 mb-4">{program.name}</h2>

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
          {years.map((year) => (
            <button
              key={year.id}
              onClick={() => onSelectYear(year)}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group flex items-center justify-between"
            >
              <p className="font-bold text-slate-800">
                Year {year.yearNumber ?? year.year}
              </p>
              <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
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

  // navigation stack: 'dept' | 'program' | 'year' | 'section'
  const [view, setView] = useState('dept');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

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
    setSelectedSection(null);
    setView('program');
  };

  const goToYear = (year) => {
    setSelectedYear(year);
    setSelectedSection(null);
    setView('year');
  };

  const goToSection = (section) => {
    setSelectedSection(section);
    setView('section');
  };

  const goToDepartment = () => {
    setView('dept');
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedSection(null);
  };

  const goBackToProgram = () => {
    setSelectedYear(null);
    setSelectedSection(null);
    setView('program');
  };

  const goBackToYear = () => {
    setSelectedSection(null);
    setView('year');
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
              <div className="grid grid-cols-3 gap-3 min-w-[260px]">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Total Programs</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{programs.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{totalStudents}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Total Teachers</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {department?._count?.teachers ?? 0}
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
          onSelectSection={goToSection}
        />
      )}

      {/* ── LEVEL 3: Section Detail (Students) ─────────────────────── */}
      {view === 'section' && selectedSection && selectedYear && selectedProgram && (
        <SectionDetail
          section={selectedSection}
          year={selectedYear}
          program={selectedProgram}
          dept={{ name: deptName }}
          onBackToDepartment={goToDepartment}
          onBackToProgram={goBackToProgram}
          onBackToYear={goBackToYear}
        />
      )}
    </div>
  );
};

export default Departments;
