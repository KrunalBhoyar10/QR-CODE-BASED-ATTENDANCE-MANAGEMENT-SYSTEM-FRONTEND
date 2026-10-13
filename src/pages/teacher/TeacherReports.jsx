import React, { useState, useEffect } from 'react';
import {
  FileText, Filter, Printer, ChevronRight,
  BookOpen, Grid, Users, Layers,
  CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Minus, Search, FileSpreadsheet, X, AlertCircle,
  Calendar, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { teacherService } from '../../services/teacher.service';
import { getErrorMessage } from '../../utils/error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v) => parseFloat(v || 0).toFixed(1);

const attColor = (p) => {
  const n = parseFloat(p);
  if (n >= 75) return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (n >= 60) return { bg: 'bg-amber-100', text: 'text-amber-800' };
  return { bg: 'bg-rose-100', text: 'text-rose-800' };
};

const AttBadge = ({ value }) => {
  const c = attColor(value);
  const n = parseFloat(value);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {n >= 75 ? <TrendingUp className="w-3 h-3" /> : n >= 60 ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct(value)}%
    </span>
  );
};

// ─── Step indicator breadcrumb ─────────────────────────────────────────────────
const StepBreadcrumb = ({ items }) => (
  <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-300">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-500" />}
        <span className={item.active ? 'text-white font-semibold' : item.done ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
          {item.done ? <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-400" /> : null}
          {item.label}
        </span>
      </React.Fragment>
    ))}
  </div>
);

// ─── Cascade Dropdown ──────────────────────────────────────────────────────────
const CascadeSelect = ({ label, value, onChange, options, placeholder, disabled, loading, required, icon: Icon }) => (
  <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-50' : ''}`}>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full rounded-xl border px-3 py-2.5 text-xs text-slate-800 pr-8 appearance-none
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all
          ${disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-indigo-300 cursor-pointer'}
          ${value ? 'border-indigo-300 ring-1 ring-indigo-200' : ''}`}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.label || opt.name}</option>
        ))}
      </select>
      {loading && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  </div>
);

// ─── CSV Export ────────────────────────────────────────────────────────────────
const exportCSV = (rows, filename) => {
  if (!rows || rows.length === 0) { toast.error('No data to export'); return; }
  const headers = Object.keys(rows[0]);
  const lines = rows.map(r =>
    headers.map(h => {
      const v = r[h] ?? '';
      return typeof v === 'string' && (v.includes(',') || v.includes('"'))
        ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(',')
  );
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('CSV downloaded successfully');
};

// ─── Component ─────────────────────────────────────────────────────────────────
const TeacherReports = () => {
  // Cascading options
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected values
  const [selProgram, setSelProgram] = useState('');
  const [selYear, setSelYear] = useState('');
  const [selSection, setSelSection] = useState('');
  const [selSubject, setSelSubject] = useState('');

  // Date Filter Modes: 'all' | 'single' | 'range'
  const [dateMode, setDateMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI / Loading
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT' | 'GOOD' | 'CRITICAL'

  // Generated Report Data
  const [reportData, setReportData] = useState(null);

  // ── Step 1: Load Teacher's Programs on mount ──────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingInit(true);
      try {
        const res = await teacherService.getAssignedPrograms();
        const raw = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.programs) ? res.programs
          : Array.isArray(res) ? res : [];
        setPrograms(raw.map(p => ({ id: p.id, name: p.name, code: p.code })));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load assigned programs'));
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  // ── Step 2: Load academic years when program selected ──────────────────────
  useEffect(() => {
    if (!selProgram) {
      setAcademicYears([]); setSelYear('');
      setSections([]); setSelSection('');
      setSubjects([]); setSelSubject('');
      setReportData(null);
      return;
    }
    setLoadingYears(true);
    setAcademicYears([]); setSelYear('');
    setSections([]); setSelSection('');
    setSubjects([]); setSelSubject('');
    setReportData(null);
    teacherService.getAssignedAcademicYears(selProgram)
      .then(res => {
        const raw = Array.isArray(res?.data) ? res.data : res?.academicYears || [];
        setAcademicYears(raw.map(y => ({ id: y.id, name: y.name || y.year || `Year ${y.yearNumber || ''}` })));
      })
      .catch(() => toast.error('Failed to load academic years'))
      .finally(() => setLoadingYears(false));
  }, [selProgram]);

  // ── Step 3: Load sections when academic year selected ─────────────────────
  useEffect(() => {
    if (!selYear) {
      setSections([]); setSelSection('');
      setSubjects([]); setSelSubject('');
      return;
    }
    setLoadingSections(true);
    setSections([]); setSelSection('');
    setSubjects([]); setSelSubject('');
    setReportData(null);
    teacherService.getAssignedSections(selYear)
      .then(res => {
        const raw = Array.isArray(res?.data) ? res.data : res?.sections || [];
        setSections(raw.map(s => ({ id: s.id, name: s.name })));
      })
      .catch(() => toast.error('Failed to load sections'))
      .finally(() => setLoadingSections(false));
  }, [selYear]);

  // ── Step 4: Load subjects when section selected ───────────────────────────
  useEffect(() => {
    if (!selSection) {
      setSubjects([]); setSelSubject('');
      return;
    }
    setLoadingSubjects(true);
    setSubjects([]); setSelSubject('');
    setReportData(null);
    teacherService.getAssignedSubjects({ sectionId: selSection })
      .then(res => {
        const raw = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.subjects) ? res.subjects : [];
        setSubjects(raw.map(s => ({ id: s.subjectId || s.id, name: s.subjectName || s.name, code: s.subjectCode || s.code })));
      })
      .catch(() => {
        teacherService.getAssignments({ sectionId: selSection })
          .then(res2 => {
            const assignments = res2?.data?.assignments || [];
            const subMap = new Map();
            assignments.filter(a => a.sectionId === selSection).forEach(a => {
              if (a.subjectId && !subMap.has(a.subjectId)) {
                subMap.set(a.subjectId, { id: a.subjectId, name: a.subject?.name || a.subjectName || 'Subject', code: a.subject?.code || '' });
              }
            });
            setSubjects([...subMap.values()]);
          })
          .catch(() => toast.error('Failed to load subjects'));
      })
      .finally(() => setLoadingSubjects(false));
  }, [selSection]);

  // ── Generate Report ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selSection || !selSubject) {
      toast.error('Please select Program → Year → Section → Subject');
      return;
    }
    setLoadingReport(true);
    setError(null);
    setReportData(null);
    setSearchQuery('');

    try {
      const queryParams = {};
      if (dateMode === 'single' && selectedDate) {
        queryParams.date = selectedDate;
      } else if (dateMode === 'range') {
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
      }

      // 1. Get all students in section with their subject attendance
      let rawRecords = [];
      let attRes = null;
      try {
        attRes = await teacherService.getSectionStudentsSubjectAttendance(selSection, selSubject, queryParams);
        rawRecords = Array.isArray(attRes?.data) ? attRes.data
          : Array.isArray(attRes) ? attRes
          : Array.isArray(attRes?.students) ? attRes.students
          : Array.isArray(attRes?.records) ? attRes.records
          : [];
      } catch (attErr) {
        console.warn('Teacher subject attendance direct fetch failed:', attErr);
      }

      // 2. Fallback to getSectionStudents if array wasn't directly returned
      if (!rawRecords || rawRecords.length === 0) {
        try {
          const secRes = await teacherService.getSectionStudents(selSection);
          const studentList = Array.isArray(secRes?.data) ? secRes.data
            : Array.isArray(secRes?.students) ? secRes.students
            : Array.isArray(secRes) ? secRes
            : [];

          const map = attRes?.data || attRes || {};
          rawRecords = studentList.map(s => {
            const att = map[s.id] || {};
            const total = att.totalClasses ?? att.totalSessions ?? 0;
            const pres = att.totalPresent ?? att.presentCount ?? 0;
            const abs = att.totalAbsent ?? att.absentCount ?? (total >= pres ? total - pres : 0);
            const pctVal = att.attendancePercentage ?? att.percentage ?? (total > 0 ? (pres / total) * 100 : 0);
            return {
              id: s.id,
              studentId: s.id,
              studentName: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Student',
              email: s.user?.email || '',
              rollNumber: s.rollNumber || '',
              enrollmentNumber: s.enrollmentNumber || '',
              totalClasses: total,
              presentCount: pres,
              totalPresent: pres,
              absentCount: abs,
              totalAbsent: abs,
              attendancePercentage: pctVal,
              percentage: pctVal,
              dailyStatus: total > 0 ? (pres > 0 ? 'PRESENT' : 'ABSENT') : 'NO_CLASS',
            };
          });
        } catch (fallbackErr) {
          console.error('Fallback getSectionStudents failed:', fallbackErr);
        }
      }

      const programName = programs.find(p => p.id === selProgram)?.name || '';
      const yearName = academicYears.find(y => y.id === selYear)?.name || '';
      const sectionName = sections.find(s => s.id === selSection)?.name || '';
      const subjectObj = subjects.find(s => s.id === selSubject);
      const subjectName = subjectObj?.name || '';
      const subjectCode = subjectObj?.code || '';

      setReportData({
        records: rawRecords,
        dateMode,
        selectedDate,
        startDate,
        endDate,
        meta: { programName, yearName, sectionName, subjectName, subjectCode },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate report'));
    } finally {
      setLoadingReport(false);
    }
  };

  // ── Filtered display records ──────────────────────────────────────────────
  const displayRecords = (reportData?.records || []).filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${r.studentName || ''} ${r.student?.user?.firstName || ''} ${r.student?.user?.lastName || ''}`.toLowerCase();
      const enroll = (r.enrollmentNumber || r.student?.enrollmentNumber || '').toLowerCase();
      const roll = (r.rollNumber || '').toLowerCase();
      if (!name.includes(q) && !enroll.includes(q) && !roll.includes(q)) return false;
    }

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PRESENT') {
      return r.dailyStatus === 'PRESENT' || (r.totalPresent > 0);
    }
    if (statusFilter === 'ABSENT') {
      return r.dailyStatus === 'ABSENT' || (r.totalPresent === 0);
    }
    const p = parseFloat(r.attendancePercentage ?? r.percentage ?? 0);
    if (statusFilter === 'GOOD') return p >= 75;
    if (statusFilter === 'CRITICAL') return p < 60;
    return true;
  });

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = reportData ? (() => {
    const total = reportData.records.length;
    const isSingle = reportData.dateMode === 'single';
    const presentStudents = reportData.records.filter(r => r.dailyStatus === 'PRESENT' || (r.totalPresent > 0)).length;
    const absentStudents = total - presentStudents;
    const above75 = reportData.records.filter(r => parseFloat(r.attendancePercentage ?? r.percentage ?? 0) >= 75).length;
    const below60 = reportData.records.filter(r => parseFloat(r.attendancePercentage ?? r.percentage ?? 0) < 60).length;
    const avg = total
      ? (reportData.records.reduce((s, r) => s + parseFloat(r.attendancePercentage ?? r.percentage ?? 0), 0) / total).toFixed(1)
      : 0;
    const totalConducted = reportData.records[0]?.totalClasses ?? 0;
    return {
      total,
      presentStudents,
      absentStudents,
      above75,
      below60,
      avg,
      totalConducted,
      isSingle,
    };
  })() : null;

  // ── CSV rows ──────────────────────────────────────────────────────────────
  const buildCSVRows = () => {
    if (!reportData) return [];
    return displayRecords.map((r, i) => {
      const totalClasses = r.totalClasses ?? r.totalSessions ?? 0;
      const present = r.totalPresent ?? r.presentCount ?? 0;
      const absent = r.totalAbsent ?? r.absentCount ?? (totalClasses - present);
      const isSingle = reportData.dateMode === 'single';
      return {
        '#': i + 1,
        'Student Name': r.studentName || `${r.student?.user?.firstName || ''} ${r.student?.user?.lastName || ''}`.trim() || 'Unknown',
        'Roll No': r.rollNumber || '',
        'Enrollment No': r.enrollmentNumber || r.student?.enrollmentNumber || '',
        'Email': r.email || r.student?.user?.email || '',
        'Program': reportData.meta.programName,
        'Academic Year': reportData.meta.yearName,
        'Section': reportData.meta.sectionName,
        'Subject': reportData.meta.subjectName,
        'Date / Period': isSingle ? reportData.selectedDate : (reportData.dateMode === 'range' ? `${reportData.startDate} to ${reportData.endDate}` : 'All Sessions'),
        ...(isSingle ? {
          'Status on Date': r.dailyStatus === 'PRESENT' ? 'PRESENT' : (totalClasses > 0 ? 'ABSENT' : 'NO CLASS'),
          'Conducted Sessions': totalClasses,
          'Present Sessions': present,
        } : {
          'Total Classes': totalClasses,
          'Present': present,
          'Absent': absent,
          'Attendance %': `${pct(r.attendancePercentage ?? r.percentage ?? 0)}%`,
        }),
      };
    });
  };

  // ── Breadcrumb steps ──────────────────────────────────────────────────────
  const breadcrumbSteps = [
    { label: selProgram ? (programs.find(p => p.id === selProgram)?.name || 'Program') : 'Program', done: !!selProgram, active: !selProgram },
    { label: selYear ? (academicYears.find(y => y.id === selYear)?.name || 'Year') : 'Academic Year', done: !!selYear, active: !!selProgram && !selYear },
    { label: selSection ? (sections.find(s => s.id === selSection)?.name || 'Section') : 'Section', done: !!selSection, active: !!selYear && !selSection },
    { label: selSubject ? (subjects.find(s => s.id === selSubject)?.name || 'Subject') : 'Subject', done: !!selSubject, active: !!selSection && !selSubject },
  ];

  if (loadingInit) return <Loader fullPage message="Loading programs..." />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Screen Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Faculty Attendance Reports
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Generate and print student attendance by Program, Year, Section, Subject & Date.
          </p>
        </div>
        {reportData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCSV(buildCSVRows(), `Teacher_Attendance_${reportData.meta.subjectName.replace(/\s+/g, '_')}`)}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4 text-white" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Print Normal Report
            </Button>
          </div>
        )}
      </div>

      {/* ── Cascade Filter Card ──────────────────────────────────────────── */}
      <Card className="print-hidden border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-indigo-700 to-indigo-900 px-5 py-4">
          <div>
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Cascading Report Filters
            </h2>
            <div className="mt-2">
              <StepBreadcrumb items={breadcrumbSteps} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CascadeSelect
              label="1. Program"
              icon={BookOpen}
              value={selProgram}
              onChange={setSelProgram}
              options={programs}
              placeholder="Select Program"
              required
            />
            <CascadeSelect
              label="2. Academic Year"
              icon={Layers}
              value={selYear}
              onChange={setSelYear}
              options={academicYears}
              placeholder={selProgram ? 'Select Academic Year' : '← Select Program first'}
              disabled={!selProgram}
              loading={loadingYears}
              required
            />
            <CascadeSelect
              label="3. Section"
              icon={Grid}
              value={selSection}
              onChange={setSelSection}
              options={sections}
              placeholder={selYear ? 'Select Section' : '← Select Year first'}
              disabled={!selYear}
              loading={loadingSections}
              required
            />
            <CascadeSelect
              label="4. Subject"
              icon={FileText}
              value={selSubject}
              onChange={setSelSubject}
              options={subjects.map(s => ({ id: s.id, label: `${s.name}${s.code ? ` (${s.code})` : ''}` }))}
              placeholder={selSection ? 'Select Subject' : '← Select Section first'}
              disabled={!selSection}
              loading={loadingSubjects}
              required
            />
          </div>

          {/* ── Date Selection Controls ──────────────────────────────────── */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Date / Attendance Period:
              </label>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDateMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    dateMode === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Sessions (Overall)
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    dateMode === 'single'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📅 Specific Date (Particular Day)
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    dateMode === 'range'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Date Range (From - To)
                </button>
              </div>
            </div>

            {/* Date Inputs based on Mode */}
            <div className="flex flex-wrap items-end gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              {dateMode === 'single' && (
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Specific Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Shows exact Present/Absent students for sessions conducted on this date.
                  </p>
                </div>
              )}

              {dateMode === 'range' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </>
              )}

              {dateMode === 'all' && (
                <div className="text-xs text-slate-500 flex-1">
                  Viewing cumulative overall attendance of all completed sessions for this subject & section.
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerate}
                  isLoading={loadingReport}
                  disabled={!selSection || !selSubject}
                  leftIcon={<FileText className="w-4 h-4" />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Generate Report
                </Button>
                {reportData && (
                  <button
                    onClick={() => { setReportData(null); setSearchQuery(''); }}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} onRetry={handleGenerate} />}

      {loadingReport && (
        <div className="flex flex-col items-center justify-center py-20 print-hidden">
          <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
          <p className="text-sm text-slate-700 font-semibold">Compiling real attendance records...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching live students and attendance data from database</p>
        </div>
      )}

      {/* ── Screen Output View ────────────────────────────────────────────── */}
      {!loadingReport && reportData && (
        <div className="space-y-5 screen-only-report">
          {/* Metadata banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div>
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                {dateMode === 'single' ? `Single Date Attendance Report • ${reportData.selectedDate}` : 'Consolidated Subject Report'}
              </p>
              <h2 className="text-lg font-bold mt-0.5">
                {reportData.meta.subjectName}
                {reportData.meta.subjectCode && <span className="text-indigo-300 text-sm ml-2 font-normal">({reportData.meta.subjectCode})</span>}
              </h2>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-indigo-400" />{reportData.meta.programName}</span>
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-indigo-400" />{reportData.meta.yearName}</span>
                <span className="flex items-center gap-1"><Grid className="w-3.5 h-3.5 text-indigo-400" />Section: {reportData.meta.sectionName}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" />{stats?.totalConducted || 0} Sessions Conducted</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(buildCSVRows(), `Teacher_${reportData.meta.subjectName.replace(/\s+/g, '_')}`)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              >
                CSV
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Normal Report
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/60 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-indigo-700 uppercase">Total Students</span>
                <span className="text-2xl font-black text-indigo-900">{stats.total}</span>
                <span className="text-[11px] text-indigo-600 font-medium">Enrolled in Section</span>
              </div>

              {stats.isSingle ? (
                <>
                  <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">Present On Date</span>
                    <span className="text-2xl font-black text-emerald-900">{stats.presentStudents}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Attended class</span>
                  </div>

                  <div className="border border-rose-200 rounded-2xl p-4 bg-rose-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-rose-700 uppercase">Absent On Date</span>
                    <span className="text-2xl font-black text-rose-900">{stats.absentStudents}</span>
                    <span className="text-[11px] text-rose-600 font-medium">Missed class</span>
                  </div>

                  <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase">Classes On Date</span>
                    <span className="text-2xl font-black text-indigo-900">{stats.totalConducted}</span>
                    <span className="text-[11px] text-indigo-600 font-medium">Conducted sessions</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">≥ 75% Attendance</span>
                    <span className="text-2xl font-black text-emerald-900">{stats.above75}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Good Standing</span>
                  </div>

                  <div className="border border-rose-200 rounded-2xl p-4 bg-rose-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-rose-700 uppercase">&lt; 60% At Risk</span>
                    <span className="text-2xl font-black text-rose-900">{stats.below60}</span>
                    <span className="text-[11px] text-rose-600 font-medium">Critical shortage</span>
                  </div>

                  <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase">Class Average</span>
                    <span className="text-2xl font-black text-indigo-900">{stats.avg}%</span>
                    <span className="text-[11px] text-indigo-600 font-medium">Across all sessions</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Interactive Table Card */}
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">Student Attendance Table</span>
                  <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    {displayRecords.length} Students
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter tabs */}
                  <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      All
                    </button>
                    {dateMode === 'single' ? (
                      <>
                        <button
                          onClick={() => setStatusFilter('PRESENT')}
                          className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'PRESENT' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          Present ({stats?.presentStudents || 0})
                        </button>
                        <button
                          onClick={() => setStatusFilter('ABSENT')}
                          className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'ABSENT' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          Absent ({stats?.absentStudents || 0})
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setStatusFilter('GOOD')}
                          className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'GOOD' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          ≥75%
                        </button>
                        <button
                          onClick={() => setStatusFilter('CRITICAL')}
                          className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'CRITICAL' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          &lt;60%
                        </button>
                      </>
                    )}
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, roll, enroll..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-44 sm:w-56"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 w-28">Roll No.</th>
                      <th className="px-4 py-3 w-28">Enrollment No.</th>
                      {dateMode === 'single' ? (
                        <>
                          <th className="px-4 py-3 text-center w-28">Status</th>
                          <th className="px-4 py-3 text-center w-28">Attended Sessions</th>
                          <th className="px-4 py-3 text-center w-28">Conducted</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-center w-24">Total Classes</th>
                          <th className="px-4 py-3 text-center w-24 text-emerald-700">Present</th>
                          <th className="px-4 py-3 text-center w-24 text-rose-700">Absent</th>
                          <th className="px-4 py-3 text-center w-32">Attendance %</th>
                          <th className="px-4 py-3 text-center w-28">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRecords.map((r, i) => {
                      const totalClasses = r.totalClasses ?? 0;
                      const present = r.totalPresent ?? 0;
                      const absent = r.totalAbsent ?? 0;
                      const percentage = r.attendancePercentage ?? 0;
                      const isPresentToday = r.dailyStatus === 'PRESENT' || present > 0;
                      const p = parseFloat(percentage);

                      return (
                        <tr key={r.id || i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{r.studentName}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{r.email}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-700">{r.rollNumber || '—'}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">{r.enrollmentNumber || '—'}</td>

                          {dateMode === 'single' ? (
                            <>
                              <td className="px-4 py-3 text-center">
                                {totalClasses === 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                    No Class
                                  </span>
                                ) : isPresentToday ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRESENT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> ABSENT
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                <span className={present > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                  {present}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">{totalClasses}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">{totalClasses}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-7 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                                  {present}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-7 h-6 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                                  {absent}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <AttBadge value={percentage} />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {p >= 75 ? (
                                  <span className="text-emerald-700 font-semibold text-xs">Good</span>
                                ) : p >= 60 ? (
                                  <span className="text-amber-700 font-semibold text-xs">Warning</span>
                                ) : (
                                  <span className="text-rose-700 font-bold text-xs">Critical</span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── NORMAL OFFICIAL PRINT REPORT (Visible ONLY during window.print()) ── */}
      {reportData && (
        <div className="normal-print-sheet">
          {/* Institutional Heading */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              COLLEGE ATTENDANCE MANAGEMENT SYSTEM
            </h1>
            <h2 style={{ fontSize: '11pt', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              FACULTY ATTENDANCE RECORD
            </h2>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '4px 0 0 0', textTransform: 'uppercase', textDecoration: 'underline' }}>
              OFFICIAL STUDENT ATTENDANCE REPORT
            </h3>
          </div>

          {/* Meta Table Box */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9pt', marginBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', width: '20%', background: '#f5f5f5' }}>Program:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', width: '30%' }}>{reportData.meta.programName || '—'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', width: '20%', background: '#f5f5f5' }}>Academic Year:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', width: '30%' }}>{reportData.meta.yearName || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Section:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{reportData.meta.sectionName || '—'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Subject:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>
                  {reportData.meta.subjectName} {reportData.meta.subjectCode ? `(${reportData.meta.subjectCode})` : ''}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Report Date / Period:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: '600' }}>
                  {dateMode === 'single'
                    ? `Specific Date: ${reportData.selectedDate}`
                    : dateMode === 'range'
                    ? `Period: ${reportData.startDate || 'Start'} to ${reportData.endDate || 'End'}`
                    : 'Consolidated (All Conducted Sessions)'}
                </td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Conducted Classes:</td>
                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>
                  {stats?.totalConducted || 0} Sessions
                </td>
              </tr>
            </tbody>
          </table>

          {/* Standard Attendance Register Sheet */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9pt', marginBottom: '14px' }}>
            <thead>
              <tr style={{ background: '#e5e5e5', borderBottom: '1px solid #000' }}>
                <th style={{ border: '1px solid #000', padding: '6px 4px', width: '35px', textAlign: 'center' }}>Sr.</th>
                <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Student Name</th>
                <th style={{ border: '1px solid #000', padding: '6px 6px', width: '80px', textAlign: 'center' }}>Roll No.</th>
                <th style={{ border: '1px solid #000', padding: '6px 6px', width: '90px', textAlign: 'center' }}>Enrollment No.</th>
                {dateMode === 'single' ? (
                  <>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '85px', textAlign: 'center' }}>Status</th>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '70px', textAlign: 'center' }}>Attended</th>
                  </>
                ) : (
                  <>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '60px', textAlign: 'center' }}>Total</th>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '60px', textAlign: 'center' }}>Present</th>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '60px', textAlign: 'center' }}>Absent</th>
                    <th style={{ border: '1px solid #000', padding: '6px 6px', width: '65px', textAlign: 'center' }}>%</th>
                  </>
                )}
                <th style={{ border: '1px solid #000', padding: '6px 6px', width: '100px', textAlign: 'center' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((r, i) => {
                const totalClasses = r.totalClasses ?? 0;
                const present = r.totalPresent ?? 0;
                const absent = r.totalAbsent ?? 0;
                const percentage = r.attendancePercentage ?? 0;
                const isPresent = r.dailyStatus === 'PRESENT' || present > 0;

                return (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: '500' }}>{r.studentName}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontFamily: 'monospace' }}>{r.rollNumber || '—'}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{r.enrollmentNumber || '—'}</td>

                    {dateMode === 'single' ? (
                      <>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                          {totalClasses === 0 ? 'NO CLASS' : isPresent ? 'PRESENT' : 'ABSENT'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center' }}>{present}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center' }}>{totalClasses}</td>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>{present}</td>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center' }}>{absent}</td>
                        <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>{percentage}%</td>
                      </>
                    )}
                    <td style={{ border: '1px solid #000', padding: '5px 6px' }}></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bottom Statistical Summary Box */}
          <div style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '9pt', marginBottom: '32px', background: '#fcfcfc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total Students: {stats?.total || 0}</span>
              {dateMode === 'single' ? (
                <>
                  <span style={{ color: '#047857' }}>Total Present: {stats?.presentStudents || 0}</span>
                  <span style={{ color: '#b91c1c' }}>Total Absent: {stats?.absentStudents || 0}</span>
                  <span>Conducted Classes: {stats?.totalConducted || 0}</span>
                </>
              ) : (
                <>
                  <span>Students (≥75%): {stats?.above75 || 0}</span>
                  <span>Students (&lt;60%): {stats?.below60 || 0}</span>
                  <span>Class Average: {stats?.avg || 0}%</span>
                </>
              )}
            </div>
          </div>

          {/* Official Signatures Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center', fontSize: '9pt', marginTop: '36px', paddingTop: '10px' }}>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>
                Subject Faculty Signature
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>
                Class Coordinator Signature
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>
                Head of Department (HOD) Seal & Sign
              </div>
            </div>
          </div>

          {/* Generated timestamp footer */}
          <div style={{ fontSize: '7.5pt', color: '#666', marginTop: '16px', textAlign: 'right' }}>
            Generated on: {new Date().toLocaleString('en-IN')} | QR Attendance Portal
          </div>
        </div>
      )}

      {/* Guide State when no report is generated */}
      {!loadingReport && !reportData && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center print-hidden">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Select Filters & Click Generate</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            Select <strong>Program</strong> → <strong>Academic Year</strong> → <strong>Section</strong> → <strong>Subject</strong>,
            choose a <strong>Specific Date</strong> or <strong>All Sessions</strong>, then click <strong>Generate Report</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;
